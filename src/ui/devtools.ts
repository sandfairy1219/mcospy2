// Developer tools hooks for renderer
// - Wires the dev-perf checkbox to IPC
// - Displays perf metrics in the dev panel

import { send, listen } from "../ipc";

export function initDevTools() {
  const devPerfEl = document.getElementById('dev-perf') as HTMLInputElement | null;
  if (devPerfEl) {
    devPerfEl.addEventListener('change', () => {
      send('dev-perf', devPerfEl.checked);
    });
  }

  listen('perf', (data: any) => {
    const out = document.getElementById('perf-out');
    if (out) out.textContent = JSON.stringify(data, null, 2);
  });
}
