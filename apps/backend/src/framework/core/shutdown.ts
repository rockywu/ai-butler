export function createShutdown(options: {
  close: () => Promise<void>;
  timeoutMs: number;
}) {
  let running: Promise<void> | undefined;

  return function shutdown(): Promise<void> {
    running ??= Promise.race([
      options.close(),
      new Promise<never>((_resolve, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(`Shutdown timed out after ${options.timeoutMs}ms`),
            ),
          options.timeoutMs,
        ).unref();
      }),
    ]);
    return running;
  };
}
