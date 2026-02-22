import { hasPermission, PermissionLevel, isDeveloperMode } from "./permissions";

export type RemoveListener = () => void;
export type GetTokenFn = () => any;
export type MessageHandler = (...args: any[]) => void;

interface Options {
  devOnly?: boolean;
}

// Message router for WebSocket-based IPC (replaces Electron's ipcMain)
export interface MessageRouter {
  on(channel: string, handler: MessageHandler): void;
  removeListener(channel: string, handler: MessageHandler): void;
  removeAllListeners(channel: string): void;
}

export function createGuardedIpc(getToken: GetTokenFn, router: MessageRouter) {
  const disposers: RemoveListener[] = [];

  function on(channel: string, required: PermissionLevel, handler: (...args: any[]) => void, opts: Options = {}): RemoveListener {
    const wrapped = (...args: any[]) => {
      const token = getToken();
      if (opts.devOnly && !isDeveloperMode()) return;
      if (!hasPermission(token, required)) return;
      handler(...args);
    };
    router.on(channel, wrapped);
    const dispose = () => router.removeListener(channel, wrapped);
    disposers.push(dispose);
    return dispose;
  }

  function removeAll() {
    while (disposers.length) {
      try { (disposers.pop() as RemoveListener)(); } catch { /* ignore */ }
    }
  }

  return { on, removeAll };
}

export { PermissionLevel };
