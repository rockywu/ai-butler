import type {
  PluginEnvelope,
  PluginError,
  PluginRequest,
  PluginResponse,
} from '@ai-butler/desktop-plugin-protocol';
import type { BrowserContext } from 'playwright';

import type { TaskDocument } from './task-types';

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import {
  parseEnvelope,
  PLUGIN_PROTOCOL_VERSION,
} from '@ai-butler/desktop-plugin-protocol';
import { chromium } from 'playwright';

import { MockAiVerifier } from './ai-verifier';
import { copyProfile } from './copy-profile';
import { findInstalledBrowser } from './detect-browser';
import { createPlaywrightDriver } from './playwright-driver';
import { STEALTH_SCRIPT } from './stealth';
import { runTask } from './task-engine';
import { BuiltinTaskSource, HttpTaskSource } from './task-source';
import sampleBlank from './tasks/sample.blank.json';

interface ParentPort {
  on: (event: 'message', listener: (event: { data: unknown }) => void) => void;
  postMessage: (message: unknown) => void;
}

interface SessionStartParams {
  browserType: 'chrome' | 'edge';
  taskId: string;
  userDataRoot: string;
}

interface SessionSnapshot {
  browserType: 'chrome' | 'edge' | null;
  sessionId: null | string;
  state: 'failed' | 'idle' | 'preparing' | 'running' | 'stopping' | 'verifying';
  taskId: null | string;
}

const parentPort = (process as NodeJS.Process & { parentPort?: ParentPort })
  .parentPort;

const idleSnapshot = (): SessionSnapshot => ({
  browserType: null,
  sessionId: null,
  state: 'idle',
  taskId: null,
});

let snapshot = idleSnapshot();
let activeContext: BrowserContext | undefined;
let startInFlight = false;

const builtinTasks = new BuiltinTaskSource({
  'sample.blank': sampleBlank as TaskDocument,
});

type HandlerResult =
  | { data: unknown; ok: true }
  | { error: PluginError; ok: false };

function respond(request: PluginRequest, body: HandlerResult): void {
  const envelope: PluginResponse = body.ok
    ? {
        data: body.data,
        id: request.id,
        kind: 'response',
        ok: true,
        v: PLUGIN_PROTOCOL_VERSION,
      }
    : {
        error: body.error,
        id: request.id,
        kind: 'response',
        ok: false,
        v: PLUGIN_PROTOCOL_VERSION,
      };
  // Electron utilityProcess parentPort 是 Node MessagePort，没有 targetOrigin。
  // oxlint-disable-next-line unicorn/require-post-message-target-origin
  parentPort?.postMessage(envelope);
}

function emitProgress(message: string, stepId?: string): void {
  if (!snapshot.sessionId || !snapshot.taskId) return;
  const envelope: PluginEnvelope = {
    event: 'session.progress',
    kind: 'event',
    payload: {
      message,
      sessionId: snapshot.sessionId,
      state: snapshot.state,
      stepId,
      taskId: snapshot.taskId,
    },
    v: PLUGIN_PROTOCOL_VERSION,
  };
  // Electron utilityProcess parentPort 是 Node MessagePort，没有 targetOrigin。
  // oxlint-disable-next-line unicorn/require-post-message-target-origin
  parentPort?.postMessage(envelope);
}

function errorResult(error: PluginError): HandlerResult {
  return { error, ok: false };
}

async function closeContext(): Promise<void> {
  const context = activeContext;
  activeContext = undefined;
  if (!context) return;
  try {
    await context.close();
  } catch {
    // already closed
  }
}

async function handleStart(params: SessionStartParams): Promise<HandlerResult> {
  if (snapshot.state !== 'idle' || startInFlight) {
    return errorResult({
      code: 'conflict',
      message: 'A browser session is already running',
    });
  }

  startInFlight = true;
  snapshot = {
    browserType: params.browserType,
    sessionId: `browser-${String(Date.now())}`,
    state: 'preparing',
    taskId: params.taskId,
  };
  emitProgress('Preparing browser session');

  try {
    const installed = findInstalledBrowser(params.browserType, {
      env: process.env,
      exists: existsSync,
      homedir: homedir(),
      platform: process.platform,
    });
    if (!installed) {
      const browserName =
        params.browserType === 'chrome' ? 'Google Chrome' : 'Microsoft Edge';
      snapshot = idleSnapshot();
      return errorResult({
        code: 'unavailable',
        message: `Install ${browserName} to continue`,
      });
    }

    const destination = join(params.userDataRoot, params.browserType);
    copyProfile(installed.userDataDir, destination, {
      cp: cpSync,
      mkdir: mkdirSync,
      rm: rmSync,
    });

    const context = await chromium.launchPersistentContext(destination, {
      channel: installed.channel,
      headless: false,
      ignoreDefaultArgs: ['--no-sandbox'],
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
    });
    await context.addInitScript({ content: STEALTH_SCRIPT });
    activeContext = context;

    snapshot = { ...snapshot, state: 'running' };
    emitProgress('Browser launched');

    const taskResult = params.taskId.startsWith('sample.')
      ? await builtinTasks.getTask(params.taskId)
      : await new HttpTaskSource({
          baseUrl: process.env.AI_BUTLER_BROWSER_TASK_API || null,
        }).getTask(params.taskId);

    if (!taskResult.ok) {
      await closeContext();
      snapshot = idleSnapshot();
      return errorResult(taskResult.error);
    }

    const driver = createPlaywrightDriver({ context });
    const runResult = await runTask({
      driver,
      task: taskResult.task,
      verifier: new MockAiVerifier(),
    });

    await closeContext();
    if (!runResult.ok) {
      snapshot = idleSnapshot();
      return errorResult(runResult.error);
    }

    snapshot = idleSnapshot();
    return { data: snapshot, ok: true };
  } catch (error) {
    await closeContext();
    snapshot = idleSnapshot();
    return errorResult({
      code: 'internal',
      message:
        error instanceof Error ? error.message : 'Failed to start browser',
    });
  } finally {
    startInFlight = false;
  }
}

async function handleRequest(request: PluginRequest): Promise<void> {
  if (request.method === 'ping') {
    respond(request, { data: { pong: true }, ok: true });
    return;
  }

  if (request.method === 'session.getState') {
    respond(request, { data: snapshot, ok: true });
    return;
  }

  if (request.method === 'session.stop') {
    snapshot = { ...snapshot, state: 'stopping' };
    emitProgress('Stopping browser session');
    await closeContext();
    snapshot = idleSnapshot();
    respond(request, { data: { stopped: true }, ok: true });
    return;
  }

  if (request.method === 'session.start') {
    const params = request.params as SessionStartParams;
    const result = await handleStart(params);
    respond(request, result);
  }
}

if (!parentPort) {
  throw new Error('browser plugin must run as an Electron utilityProcess');
}

parentPort.on('message', (event) => {
  const envelope = parseEnvelope(event.data);
  if (!envelope || envelope.kind !== 'request') return;
  void handleRequest(envelope);
});
