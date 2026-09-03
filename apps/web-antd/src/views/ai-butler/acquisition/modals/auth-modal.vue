<script lang="ts" setup>
import type { Ref } from 'vue';

import { inject, onBeforeUnmount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { acqPlatformLabels } from '../../_shared/mock-data';

const STEPS = [
  { desc: '点击开始，自动打开平台登录页', title: '打开浏览器' },
  { desc: '请在打开的窗口完成扫码或验证码登录', title: '扫码登录' },
  { desc: '正在同步登录态到云端…', title: '授权中' },
  { desc: '授权成功，可在账号管理中绑定智能体', title: '完成' },
] as const;

const activePlatform = inject<Ref<string> | undefined>('activePlatform');
const step = ref(0);
const running = ref(false);
let timers: number[] = [];

function platformLabel() {
  return acqPlatformLabels[activePlatform?.value ?? 'douyin'] ?? '某音';
}

function clearTimers() {
  for (const id of timers) {
    window.clearTimeout(id);
  }
  timers = [];
}

function reset() {
  clearTimers();
  step.value = 0;
  running.value = false;
  modalApi.setState({
    confirmDisabled: false,
    confirmText: '开始授权',
    title: `授权账号 · ${platformLabel()}`,
  });
}

function startAuth() {
  if (running.value) return;
  running.value = true;
  modalApi.setState({ confirmDisabled: true, confirmText: '授权中…' });
  for (let i = 1; i < STEPS.length; i += 1) {
    timers.push(
      window.setTimeout(() => {
        step.value = i;
        if (i === STEPS.length - 1) {
          running.value = false;
          message.success('授权成功，可在账号管理中绑定智能体');
          modalApi.close();
        }
      }, i * 800),
    );
  }
}

const [Modal, modalApi] = useVbenModal({
  cancelText: '取消',
  class: 'w-[calc(100%-32px)] sm:w-[520px]',
  confirmText: '开始授权',
  fullscreenButton: true,
  onClosed: reset,
  onConfirm: startAuth,
  onOpenChange(isOpen) {
    if (isOpen) reset();
  },
  title: '授权账号 · 某音',
});

onBeforeUnmount(clearTimers);

defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <div class="mb-5 flex items-start justify-center gap-2">
      <div
        v-for="(item, index) in STEPS"
        :key="item.title"
        class="flex items-start gap-2"
      >
        <div class="flex w-16 flex-col items-center gap-1.5">
          <span
            class="h-2.5 w-2.5 rounded-full"
            :class="
              index < step
                ? 'bg-[#16A34A]'
                : index === step
                  ? 'bg-[#111A38]'
                  : 'bg-[#D1D5DB]'
            "
          ></span>
          <span
            class="text-center text-[11px] leading-tight"
            :class="
              index === step ? 'font-semibold text-[#0A0A0A]' : 'text-[#6B7280]'
            "
          >
            {{ item.title }}
          </span>
        </div>
        <span
          v-if="index < STEPS.length - 1"
          class="mt-1 h-px w-5 shrink-0 bg-[#E5E7EB]"
        ></span>
      </div>
    </div>
    <div class="flex flex-col items-center gap-2 py-4 text-center">
      <b class="text-[13px] text-[#0A0A0A]">{{ STEPS[step]?.desc }}</b>
      <span class="max-w-[320px] text-[11.5px] text-[#6B7280]">
        授权全程在客户端内完成演示推进，不调用系统浏览器。
      </span>
    </div>
  </Modal>
</template>
