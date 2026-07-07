const CHANNEL_NAME = "vfx-pulse-live-sync";

export function emitDataSync(module: string) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    module,
    timestamp: Date.now(),
  };

  window.dispatchEvent(new CustomEvent(CHANNEL_NAME, { detail: payload }));

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(payload);
    channel.close();
  }
}

export function subscribeDataSync(onSync: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleWindowEvent = () => onSync();
  window.addEventListener(CHANNEL_NAME, handleWindowEvent as EventListener);

  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => onSync();
  }

  return () => {
    window.removeEventListener(CHANNEL_NAME, handleWindowEvent as EventListener);
    channel?.close();
  };
}
