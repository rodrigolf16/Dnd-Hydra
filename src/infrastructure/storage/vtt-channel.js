import { VTT_CHANNEL_NAME } from './constants.js';

export function createVttChannel() {
  const channel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(VTT_CHANNEL_NAME)
    : null;

  return {
    post(message) {
      if (!channel) return;
      try { channel.postMessage(message); } catch {}
    },
    subscribe(handler) {
      if (!channel) return () => {};
      const listener = ev => handler(ev.data);
      channel.addEventListener('message', listener);
      return () => channel.removeEventListener('message', listener);
    }
  };
}
