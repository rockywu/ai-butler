export interface ReadinessGate {
  isReady(): boolean;
  markNotReady(): void;
}

export function createReadinessGate(): ReadinessGate {
  let ready = true;
  return {
    isReady: () => ready,
    markNotReady() {
      ready = false;
    },
  };
}
