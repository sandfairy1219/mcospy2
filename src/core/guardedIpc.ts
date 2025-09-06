import { ipcMain } from "electron";
import { hasPermission, PermissionLevel, isDeveloperMode } from "./permissions";

export type RemoveListener = () => void;
export type GetTokenFn = () => any;

interface Options {
  devOnly?: boolean;
}

export function createGuardedIpc(getToken: GetTokenFn) {
  const disposers: RemoveListener[] = [];

  function on(channel: string, required: PermissionLevel, handler: (event: Electron.IpcMainEvent, ...args: any[]) => void, opts: Options = {}): RemoveListener {
    const wrapped = (event: Electron.IpcMainEvent, ...args: any[]) => {
      const token = getToken();
      if (opts.devOnly && !isDeveloperMode()) return;
      if (!hasPermission(token, required)) return;
      handler(event, ...args);
    };
    ipcMain.on(channel, wrapped);
    const dispose = () => ipcMain.removeListener(channel, wrapped);
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
