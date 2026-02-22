"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // dist/ipc.js
  var require_ipc = __commonJS({
    "dist/ipc.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.connect = connect;
      exports.send = send;
      exports.invoke = invoke;
      exports.listen = listen;
      exports.removeAllListeners = removeAllListeners;
      var ws = null;
      var connected = false;
      var pendingRequests = /* @__PURE__ */ new Map();
      var eventListeners = /* @__PURE__ */ new Map();
      var reqId = 0;
      var connectPromise = null;
      var messageQueue = [];
      function connect(port) {
        if (connectPromise)
          return connectPromise;
        connectPromise = new Promise((resolve, reject) => {
          ws = new WebSocket(`ws://localhost:${port}`);
          ws.onopen = () => {
            connected = true;
            for (const msg of messageQueue) {
              ws.send(msg);
            }
            messageQueue = [];
            resolve();
          };
          ws.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === "response" && msg.id !== void 0) {
                const pending = pendingRequests.get(msg.id);
                if (pending) {
                  pendingRequests.delete(msg.id);
                  if (msg.error)
                    pending.reject(new Error(msg.error));
                  else
                    pending.resolve(msg.data);
                }
              } else if (msg.type === "event") {
                const listeners = eventListeners.get(msg.channel);
                if (listeners) {
                  for (const handler of listeners) {
                    handler(msg.data);
                  }
                }
              }
            } catch (e) {
              console.error("IPC message parse error:", e);
            }
          };
          ws.onclose = () => {
            connected = false;
            connectPromise = null;
            for (const [, pending] of pendingRequests) {
              pending.reject(new Error("WebSocket closed"));
            }
            pendingRequests.clear();
          };
          ws.onerror = (err) => {
            reject(err);
          };
        });
        return connectPromise;
      }
      function send(channel, ...args) {
        const msg = JSON.stringify({ type: "invoke", channel, args });
        if (connected && ws) {
          ws.send(msg);
        } else {
          messageQueue.push(msg);
        }
      }
      function invoke(channel, ...args) {
        return new Promise((resolve, reject) => {
          const id = reqId++;
          pendingRequests.set(id, { resolve, reject });
          const msg = JSON.stringify({ type: "invoke", channel, args, id });
          if (connected && ws) {
            ws.send(msg);
          } else {
            messageQueue.push(msg);
          }
        });
      }
      function listen(channel, handler) {
        if (!eventListeners.has(channel)) {
          eventListeners.set(channel, /* @__PURE__ */ new Set());
        }
        const wrappedHandler = (data) => {
          if (Array.isArray(data))
            handler(...data);
          else
            handler(data);
        };
        eventListeners.get(channel).add(wrappedHandler);
        return () => {
          eventListeners.get(channel)?.delete(wrappedHandler);
        };
      }
      function removeAllListeners(channel) {
        eventListeners.delete(channel);
      }
    }
  });

  // dist/layout.js
  var require_layout = __commonJS({
    "dist/layout.js"(exports) {
      Object.defineProperty(exports, "__esModule", { value: true });
      var ipc_1 = require_ipc();
      var canvas = document.getElementById("canvas");
      var ctx = canvas.getContext("2d");
      var tauriInvoke = (cmd, args) => {
        const internals = window.__TAURI_INTERNALS__;
        if (internals && internals.invoke) {
          return internals.invoke(cmd, args);
        }
        return Promise.reject(new Error("Tauri runtime not available"));
      };
      var configg = {};
      (0, ipc_1.listen)("get-config-response", (config) => {
        configg = config;
      });
      (0, ipc_1.listen)("init-config", (config) => {
        configg = config;
      });
      canvas.style.borderColor = configg["esp-color"] || "red";
      (0, ipc_1.listen)("config", (id, value) => {
        configg[id] = value;
        if (id === "esp-color") {
          canvas.style.borderColor = value;
        }
        ;
      });
      (0, ipc_1.listen)("clear", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
      (0, ipc_1.listen)("draw", (data) => {
        const halfWidth = canvas.width / 2;
        const halfHeight = canvas.height / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const tracer = configg["esp-tracer"] || false;
        const threed = configg["esp-3d"] || false;
        const fontSize = +configg["esp-font-size"] || 16;
        const showTag = configg["esp-tag"] || false;
        const showBar = configg["esp-bar"] || false;
        const tagType = configg["esp-tag-type"] || "both";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.font = `${fontSize}px sans-serif`;
        for (const rect of data) {
          const value = (rect.isDead ? configg["esp-dead-color"] : rect.isMark ? configg["esp-mark-color"] : rect.isTeam ? configg["esp-team-color"] : configg["esp-color"]) || "red";
          ctx.fillStyle = value;
          ctx.strokeStyle = value;
          const upside = rect.upside.map((point) => ({ x: halfWidth + point.x * halfWidth, y: halfHeight + point.y * halfHeight }));
          const downside = rect.downside.map((point) => ({ x: halfWidth + point.x * halfWidth, y: halfHeight + point.y * halfHeight }));
          const Xs = [...upside.map((point) => point.x), ...downside.map((point) => point.x)];
          const Ys = [...upside.map((point) => point.y), ...downside.map((point) => point.y)];
          const minX = Math.min(...Xs), maxX = Math.max(...Xs), minY = Math.min(...Ys), maxY = Math.max(...Ys);
          const barHeight = showBar ? 10 : 0;
          if (showTag) {
            const onNumber = tagType === "number" || tagType === "both";
            const onNickname = tagType === "nickname" || tagType === "both";
            const tagText = `${onNumber ? `[${rect.number}]` : ""} ${onNickname ? rect.nickname : ""}`;
            ctx.fillText(tagText, minX + (maxX - minX) / 2, minY - barHeight);
          }
          if (showBar) {
            const hpPerc = rect.hp / rect.total;
            const barPerc = rect.barrier / rect.total;
            const barWidth = maxX - minX;
            const barY = minY - barHeight;
            const hpWidth = barWidth * hpPerc;
            const barrerWidth = barWidth * barPerc;
            ctx.strokeRect(minX, barY, barWidth, barHeight);
            ctx.fillRect(minX, barY, hpWidth, barHeight);
            ctx.globalAlpha = 0.8;
            ctx.fillRect(minX + hpWidth, barY, barrerWidth, barHeight);
            ctx.globalAlpha = 1;
          }
          ctx.beginPath();
          if (tracer) {
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(minX + (maxX - minX) / 2, minY);
          }
          if (threed) {
            const lastUpIdx = upside.length - 1;
            ctx.moveTo(upside[lastUpIdx].x, upside[lastUpIdx].y);
            for (const point of upside) {
              ctx.lineTo(point.x, point.y);
            }
            const lastDownIdx = downside.length - 1;
            ctx.moveTo(downside[lastDownIdx].x, downside[lastDownIdx].y);
            for (const point of downside) {
              ctx.lineTo(point.x, point.y);
            }
            upside.forEach((point, idx) => {
              ctx.moveTo(point.x, point.y);
              ctx.lineTo(downside[idx].x, downside[idx].y);
            });
          } else {
            ctx.moveTo(minX, minY);
            ctx.lineTo(maxX, minY);
            ctx.lineTo(maxX, maxY);
            ctx.lineTo(minX, maxY);
            ctx.lineTo(minX, minY);
          }
          ctx.stroke();
          ctx.closePath();
        }
      });
      var resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener("resize", resize);
      async function initLayout() {
        try {
          const port = await tauriInvoke("get_ws_port");
          let retries = 0;
          const tryConnect = async () => {
            try {
              await (0, ipc_1.connect)(port);
              (0, ipc_1.send)("get-config");
            } catch (e) {
              if (retries < 10) {
                retries++;
                setTimeout(tryConnect, 500 * retries);
              }
            }
          };
          await tryConnect();
        } catch (e) {
          console.error("Layout: Failed to get WS port:", e);
        }
      }
      initLayout();
    }
  });
  require_layout();
})();
