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

  // dist/ui/devtools.js
  var require_devtools = __commonJS({
    "dist/ui/devtools.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.initDevTools = initDevTools;
      var ipc_1 = require_ipc();
      function initDevTools() {
        const devPerfEl = document.getElementById("dev-perf");
        if (devPerfEl) {
          devPerfEl.addEventListener("change", () => {
            (0, ipc_1.send)("dev-perf", devPerfEl.checked);
          });
        }
        (0, ipc_1.listen)("perf", (data) => {
          const out = document.getElementById("perf-out");
          if (out)
            out.textContent = JSON.stringify(data, null, 2);
        });
      }
    }
  });

  // dist/ui/dom.js
  var require_dom = __commonJS({
    "dist/ui/dom.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.$$_ = exports.$i = exports.$c = exports.$_ = exports.$$ = exports.$ = void 0;
      var $ = (selector) => document.querySelector(selector);
      exports.$ = $;
      var $$ = (selector) => document.querySelectorAll(selector);
      exports.$$ = $$;
      var $_ = (selector) => document.getElementById(selector);
      exports.$_ = $_;
      var $c = (selector) => document.querySelector(`details[data-cheat="${selector}"]`);
      exports.$c = $c;
      var $i = (selector) => document.getElementById(selector);
      exports.$i = $i;
      var $$_ = (selector) => Array.from((0, exports.$$)(selector));
      exports.$$_ = $$_;
    }
  });

  // dist/main.js
  var require_main = __commonJS({
    "dist/main.js"(exports) {
      Object.defineProperty(exports, "__esModule", { value: true });
      var ipc_1 = require_ipc();
      var devtools_1 = require_devtools();
      var dom_1 = require_dom();
      var tauriInvoke = (cmd, args) => {
        const internals = window.__TAURI_INTERNALS__;
        if (internals && internals.invoke) {
          return internals.invoke(cmd, args);
        }
        return Promise.reject(new Error("Tauri runtime not available"));
      };
      var keymap = {
        "KeyQ": "Q",
        "KeyW": "W",
        "KeyE": "E",
        "KeyR": "R",
        "KeyT": "T",
        "KeyY": "Y",
        "KeyU": "U",
        "KeyI": "I",
        "KeyO": "O",
        "KeyP": "P",
        "KeyA": "A",
        "KeyS": "S",
        "KeyD": "D",
        "KeyF": "F",
        "KeyG": "G",
        "KeyH": "H",
        "KeyJ": "J",
        "KeyK": "K",
        "KeyL": "L",
        "KeyZ": "Z",
        "KeyX": "X",
        "KeyC": "C",
        "KeyV": "V",
        "KeyB": "B",
        "KeyN": "N",
        "KeyM": "M",
        "Digit1": "1",
        "Digit2": "2",
        "Digit3": "3",
        "Digit4": "4",
        "Digit5": "5",
        "Digit6": "6",
        "Digit7": "7",
        "Digit8": "8",
        "Digit9": "9",
        "Digit0": "0",
        "ArrowUp": "UP ARROW",
        "ArrowDown": "DOWN ARROW",
        "ArrowLeft": "LEFT ARROW",
        "ArrowRight": "RIGHT ARROW",
        "Numpad0": "NUMPAD 0",
        "Numpad1": "NUMPAD 1",
        "Numpad2": "NUMPAD 2",
        "Numpad3": "NUMPAD 3",
        "Numpad4": "NUMPAD 4",
        "Numpad5": "NUMPAD 5",
        "Numpad6": "NUMPAD 6",
        "Numpad7": "NUMPAD 7",
        "Numpad8": "NUMPAD 8",
        "Numpad9": "NUMPAD 9",
        "NumpadAdd": "NUMPAD PLUS",
        "NumpadSubtract": "NUMPAD MINUS",
        "NumpadMultiply": "NUMPAD MULTIPLY",
        "NumpadDivide": "NUMPAD DIVIDE",
        "NumpadEnter": "NUMPAD RETURN",
        "NumpadDecimal": "NUMPAD DOT",
        "ControlLeft": "LEFT CTRL",
        "ControlRight": "RIGHT CTRL",
        "AltLeft": "LEFT ALT",
        "AltRight": "RIGHT ALT",
        "ShiftLeft": "LEFT SHIFT",
        "ShiftRight": "RIGHT SHIFT",
        "MetaLeft": "LEFT META",
        "MetaRight": "RIGHT META",
        "CapsLock": "CAPS LOCK",
        "NumLock": "NUM LOCK",
        "ScrollLock": "SCROLL LOCK",
        "Fn": "FN",
        "F1": "F1",
        "F2": "F2",
        "F3": "F3",
        "F4": "F4",
        "F5": "F5",
        "F6": "F6",
        "F7": "F7",
        "F8": "F8",
        "F9": "F9",
        "F10": "F10",
        "F11": "F11",
        "F12": "F12",
        "F13": "F13",
        "F14": "F14",
        "F15": "F15",
        "F16": "F16",
        "F17": "F17",
        "F18": "F18",
        "F19": "F19",
        "F20": "F20",
        "F21": "F21",
        "F22": "F22",
        "F23": "F23",
        "F24": "F24",
        "Equal": "EQUALS",
        "Minus": "MINUS",
        "BracketLeft": "SQUARE BRACKET OPEN",
        "BracketRight": "SQUARE BRACKET CLOSE",
        "Semicolon": "SEMICOLON",
        "Quote": "QUOTE",
        "Backslash": "BACKSLASH",
        "Comma": "COMMA",
        "Period": "DOT",
        "Slash": "FORWARD SLASH",
        "Space": "SPACE",
        "Backspace": "BACKSPACE",
        "Enter": "RETURN",
        "Escape": "ESCAPE",
        "Backquote": "SECTION",
        "Delete": "DELETE",
        "Tab": "TAB",
        "Insert": "INS",
        "Clear": "NUMPAD CLEAR",
        "PrintScreen": "PRINT SCREEN",
        "PageUp": "PAGE UP",
        "PageDown": "PAGE DOWN",
        "Home": "HOME",
        "End": "END",
        "MouseLeft": "MOUSE LEFT",
        "MouseRight": "MOUSE RIGHT",
        "MouseMiddle": "MOUSE MIDDLE",
        "MouseX1": "MOUSE X1",
        "MouseX2": "MOUSE X2"
      };
      var lan = {
        "checking-for-updates": {
          "en": "Checking for updates",
          "ko": "\uC5C5\uB370\uC774\uD2B8 \uD655\uC778 \uC911",
          "ja": "\u66F4\u65B0\u3092\u78BA\u8A8D\u4E2D",
          "zh": "\u68C0\u67E5\u66F4\u65B0\u4E2D"
        },
        "key": {
          "en": "Key",
          "ko": "\uD0A4",
          "ja": "\u30AD\u30FC",
          "zh": "\u952E"
        },
        "login": {
          "en": "Login",
          "ko": "\uB85C\uADF8\uC778",
          "ja": "\u30ED\u30B0\u30A4\u30F3",
          "zh": "\u767B\u5F55"
        },
        "initialize": {
          "en": "Initialize",
          "ko": "\uCD08\uAE30\uD654",
          "ja": "\u521D\u671F\u5316",
          "zh": "\u521D\u59CB\u5316"
        },
        "cheats": {
          "en": "Cheats",
          "ko": "\uCE58\uD2B8",
          "ja": "\u30C1\u30FC\u30C8",
          "zh": "\u4F5C\u5F0A"
        },
        "macros": {
          "en": "Macros",
          "ko": "\uB9E4\uD06C\uB85C",
          "ja": "\u30DE\u30AF\u30ED",
          "zh": "\u5B8F"
        },
        "settings": {
          "en": "Settings",
          "ko": "\uC124\uC815",
          "ja": "\u8A2D\u5B9A",
          "zh": "\u8BBE\u7F6E"
        },
        "plugins": {
          "en": "Plugins",
          "ko": "\uD50C\uB7EC\uADF8\uC778",
          "ja": "\u30D7\u30E9\u30B0\u30A4\u30F3",
          "zh": "\u63D2\u4EF6"
        },
        "dev-mode": {
          "en": "Developer Mode",
          "ko": "\uAC1C\uBC1C\uC790 \uBAA8\uB4DC",
          "ja": "\u958B\u767A\u8005\u30E2\u30FC\u30C9",
          "zh": "\u5F00\u53D1\u8005\u6A21\u5F0F"
        },
        "console": {
          "en": "Console",
          "ko": "\uCF58\uC194",
          "ja": "\u30B3\u30F3\u30BD\u30FC\u30EB",
          "zh": "\u63A7\u5236\u53F0"
        },
        "finder": {
          "en": "Finder",
          "ko": "\uD30C\uC778\uB354",
          "ja": "\u30D5\u30A1\u30A4\u30F3\u30C0\u30FC",
          "zh": "\u67E5\u627E"
        },
        "serial": {
          "en": "Serial",
          "ko": "\uC2DC\uB9AC\uC5BC",
          "ja": "\u30B7\u30EA\u30A2\u30EB",
          "zh": "\u5E8F\u5217\u53F7"
        },
        "adb": {
          "en": "ADB",
          "ko": "ADB",
          "ja": "ADB",
          "zh": "ADB"
        },
        "server": {
          "en": "Server",
          "ko": "\uC11C\uBC84",
          "ja": "\u30B5\u30FC\u30D0",
          "zh": "\u670D\u52A1\u5668"
        },
        "frida": {
          "en": "Frida",
          "ko": "\uD504\uB9AC\uB2E4",
          "ja": "\u30D5\u30EA\u30C0",
          "zh": "Frida"
        },
        "session": {
          "en": "Session",
          "ko": "\uC138\uC158",
          "ja": "\u30BB\u30C3\u30B7\u30E7\u30F3",
          "zh": "\u4F1A\u8BDD"
        },
        "connect-adb": {
          "en": "Connect ADB",
          "ko": "ADB \uC5F0\uACB0",
          "ja": "ADB\u63A5\u7D9A",
          "zh": "\u8FDE\u63A5ADB"
        },
        "connect-serial": {
          "en": "Connect Serial",
          "ko": "\uC2DC\uB9AC\uC5BC \uC5F0\uACB0",
          "ja": "\u30B7\u30EA\u30A2\u30EB\u63A5\u7D9A",
          "zh": "\u8FDE\u63A5\u5E8F\u5217\u53F7"
        },
        "start-server": {
          "en": "Start Server",
          "ko": "\uC11C\uBC84 \uC2DC\uC791",
          "ja": "\u30B5\u30FC\u30D0\u8D77\u52D5",
          "zh": "\u542F\u52A8\u670D\u52A1\u5668"
        },
        "download-server": {
          "en": "Download Server",
          "ko": "\uC11C\uBC84 \uB2E4\uC6B4\uB85C\uB4DC",
          "ja": "\u30B5\u30FC\u30D0\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
          "zh": "\u4E0B\u8F7D\u670D\u52A1\u5668"
        },
        "upload-server": {
          "en": "Upload Server",
          "ko": "\uC11C\uBC84 \uC5C5\uB85C\uB4DC",
          "ja": "\u30B5\u30FC\u30D0\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9",
          "zh": "\u4E0A\u4F20\u670D\u52A1\u5668"
        },
        "connect-frida": {
          "en": "Connect Frida",
          "ko": "\uD504\uB9AC\uB2E4 \uC5F0\uACB0",
          "ja": "\u30D5\u30EA\u30C0\u63A5\u7D9A",
          "zh": "\u8FDE\u63A5Frida"
        },
        "cookie": {
          "en": "Cookie",
          "ko": "\uCFE0\uD0A4",
          "ja": "\u30AF\u30C3\u30AD\u30FC",
          "zh": "Cookie"
        },
        "get-cookie": {
          "en": "Get Cookie",
          "ko": "\uCFE0\uD0A4 \uAC00\uC838\uC624\uAE30",
          "ja": "\u30AF\u30C3\u30AD\u30FC\u53D6\u5F97",
          "zh": "\u83B7\u53D6Cookie"
        },
        "start-agent": {
          "en": "Start Agent",
          "ko": "\uC5D0\uC774\uC804\uD2B8 \uC2DC\uC791",
          "ja": "\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u8D77\u52D5",
          "zh": "\u542F\u52A8\u4EE3\u7406"
        },
        "keybind": {
          "en": "Keybind",
          "ko": "\uB2E8\uCD95\uD0A4",
          "ja": "\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9",
          "zh": "\u952E\u7ED1\u5B9A"
        },
        "epos-number": {
          "en": "EPOS Number",
          "ko": "EPOS \uBC88\uD638",
          "ja": "EPOS\u756A\u53F7",
          "zh": "EPOS\u53F7\u7801"
        },
        "epos": {
          "en": "EPOS",
          "ko": "EPOS",
          "ja": "EPOS",
          "zh": "EPOS"
        },
        "entity": {
          "en": "Entity",
          "ko": "\uC5D4\uD2F0\uD2F0",
          "ja": "\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3",
          "zh": "\u5B9E\u4F53"
        },
        "except-number": {
          "en": "Except Number",
          "ko": "\uC81C\uC678 \uBC88\uD638",
          "ja": "\u9664\u5916\u756A\u53F7",
          "zh": "\u6392\u9664\u53F7\u7801"
        },
        "show-layout": {
          "en": "Show Layout",
          "ko": "\uB808\uC774\uC544\uC6C3 \uD45C\uC2DC",
          "ja": "\u30EC\u30A4\u30A2\u30A6\u30C8\u8868\u793A",
          "zh": "\u663E\u793A\u5E03\u5C40"
        },
        "lock-layout": {
          "en": "Lock Layout",
          "ko": "\uB808\uC774\uC544\uC6C3 \uC7A0\uAE08",
          "ja": "\u30EC\u30A4\u30A2\u30A6\u30C8\u30ED\u30C3\u30AF",
          "zh": "\u9501\u5B9A\u5E03\u5C40"
        },
        "scan-epos": {
          "en": "Scan EPOS",
          "ko": "EPOS \uC2A4\uCE94",
          "ja": "EPOS\u30B9\u30AD\u30E3\u30F3",
          "zh": "\u626B\u63CFEPOS"
        },
        "scan-entity": {
          "en": "Scan Entity",
          "ko": "\uC5D4\uD2F0\uD2F0 \uC2A4\uCE94",
          "ja": "\u30A8\u30F3\u30C6\u30A3\u30C6\u30A3\u30B9\u30AD\u30E3\u30F3",
          "zh": "\u626B\u63CF\u5B9E\u4F53"
        },
        "clear-all": {
          "en": "Clear All",
          "ko": "\uBAA8\uB450 \uC9C0\uC6B0\uAE30",
          "ja": "\u5168\u3066\u30AF\u30EA\u30A2",
          "zh": "\u5168\u90E8\u6E05\u9664"
        },
        "aimbot": {
          "en": "Aimbot",
          "ko": "\uC5D0\uC784\uBD07",
          "ja": "\u30A8\u30A4\u30E0\u30DC\u30C3\u30C8",
          "zh": "\u7784\u51C6\u8F85\u52A9"
        },
        "aimbot-mode": {
          "en": "Aimbot Mode",
          "ko": "\uC5D0\uC784\uBD07 \uBAA8\uB4DC",
          "ja": "\u30A8\u30A4\u30E0\u30DC\u30C3\u30C8\u30E2\u30FC\u30C9",
          "zh": "\u7784\u51C6\u8F85\u52A9\u6A21\u5F0F"
        },
        "normal": {
          "en": "Normal",
          "ko": "\uC77C\uBC18",
          "ja": "\u901A\u5E38",
          "zh": "\u6B63\u5E38"
        },
        "smooth": {
          "en": "Smooth",
          "ko": "\uBD80\uB4DC\uB7FD\uAC8C",
          "ja": "\u30B9\u30E0\u30FC\u30BA",
          "zh": "\u5E73\u6ED1"
        },
        "instant": {
          "en": "Instant",
          "ko": "\uC989\uC2DC",
          "ja": "\u5373\u6642",
          "zh": "\u77AC\u95F4"
        },
        "aimbot-speed": { "en": "Aimbot Speed", "ko": "\uC5D0\uC784\uBD07 \uC18D\uB3C4", "ja": "\u30A8\u30A4\u30E0\u30DC\u30C3\u30C8\u901F\u5EA6", "zh": "\u7784\u51C6\u8F85\u52A9\u901F\u5EA6" },
        "aimbot-limit": { "en": "Aimbot Angle Limit", "ko": "\uC5D0\uC784\uBD07 \uAC01\uB3C4 \uC81C\uD55C", "ja": "\u30A8\u30A4\u30E0\u30DC\u30C3\u30C8\u89D2\u5EA6\u5236\u9650", "zh": "\u7784\u51C6\u8F85\u52A9\u89D2\u5EA6\u9650\u5236" },
        "aimbot-pitch-offset": { "en": "Aimbot Pitch Offset", "ko": "\uC5D0\uC784\uBD07 \uD53C\uCE58 \uC624\uD504\uC14B", "ja": "\u30A8\u30A4\u30E0\u30DC\u30C3\u30C8\u30D4\u30C3\u30C1\u30AA\u30D5\u30BB\u30C3\u30C8", "zh": "\u7784\u51C6\u8F85\u52A9\u4FEF\u4EF0\u504F\u79FB" },
        "aimbot-acceleration": { "en": "Aimbot Acceleration", "ko": "\uC5D0\uC784\uBD07 \uAC00\uC18D\uB3C4", "ja": "\u30A8\u30A4\u30E0\u30DC\u30C3\u30C8\u52A0\u901F\u5EA6", "zh": "\u7784\u51C6\u8F85\u52A9\u52A0\u901F\u5EA6" },
        "aimbot-main-weapon-only": { "en": "Aimbot Main Weapon Only", "ko": "\uC5D0\uC784\uBD07 \uC8FC\uBB34\uAE30\uB9CC", "ja": "\u30A8\u30A4\u30E0\u30DC\u30C3\u30C8 \u30E1\u30A4\u30F3\u6B66\u5668\u306E\u307F", "zh": "\u81EA\u7784\u4EC5\u9650\u4E3B\u6B66\u5668" },
        "aimbot-ignore": { "en": "Ignore Marked", "ko": "\uB9C8\uD0B9 \uBB34\uC2DC", "ja": "\u30DE\u30FC\u30AF\u3092\u7121\u8996", "zh": "\u5FFD\u7565\u6807\u8BB0" },
        "aimbot-ignore-team": { "en": "Ignore Team", "ko": "\uD300 \uBB34\uC2DC", "ja": "\u30C1\u30FC\u30E0\u3092\u7121\u8996", "zh": "\u5FFD\u7565\u56E2\u961F" },
        "aimbot-ignore-death": { "en": "Ignore Death", "ko": "\uC2DC\uCCB4 \uBB34\uC2DC", "ja": "\u6B7B\u3092\u7121\u8996", "zh": "\u5FFD\u7565\u6B7B\u4EA1" },
        "aim-assist": { "en": "Aim Assist", "ko": "\uC5D0\uC784 \uC5B4\uC2DC\uC2A4\uD2B8", "ja": "\u30A8\u30A4\u30E0\u30A2\u30B7\u30B9\u30C8", "zh": "\u7784\u51C6\u8F85\u52A9" },
        "aim-assist-speed": { "en": "Aim Assist Speed", "ko": "\uC5D0\uC784 \uC5B4\uC2DC\uC2A4\uD2B8 \uC18D\uB3C4", "ja": "\u30A8\u30A4\u30E0\u30A2\u30B7\u30B9\u30C8\u901F\u5EA6", "zh": "\u7784\u51C6\u8F85\u52A9\u901F\u5EA6" },
        "aim-assist-limit": { "en": "Aim Assist Angle Limit", "ko": "\uC5D0\uC784 \uC5B4\uC2DC\uC2A4\uD2B8 \uAC01\uB3C4 \uC81C\uD55C", "ja": "\u30A8\u30A4\u30E0\u30A2\u30B7\u30B9\u30C8\u89D2\u5EA6\u5236\u9650", "zh": "\u7784\u51C6\u8F85\u52A9\u89D2\u5EA6\u9650\u5236" },
        "aim-assist-pitch-offset": { "en": "Aim Assist Pitch Offset", "ko": "\uC5D0\uC784 \uC5B4\uC2DC\uC2A4\uD2B8 \uD53C\uCE58 \uC624\uD504\uC14B", "ja": "\u30A8\u30A4\u30E0\u30A2\u30B7\u30B9\u30C8\u30D4\u30C3\u30C1\u30AA\u30D5\u30BB\u30C3\u30C8", "zh": "\u7784\u51C6\u8F85\u52A9\u4FEF\u4EF0\u504F\u79FB" },
        "aim-assist-decay": { "en": "Aim Assist Decay", "ko": "\uC5D0\uC784 \uC5B4\uC2DC\uC2A4\uD2B8 \uAC10\uC1E0", "ja": "\u30A8\u30A4\u30E0\u30A2\u30B7\u30B9\u30C8\u6E1B\u8870", "zh": "\u7784\u51C6\u8F85\u52A9\u8870\u51CF" },
        "aim-assist-ignore": { "en": "Ignore Marked", "ko": "\uB9C8\uD0B9 \uBB34\uC2DC", "ja": "\u30DE\u30FC\u30AF\u3092\u7121\u8996", "zh": "\u5FFD\u7565\u6807\u8BB0" },
        "aim-assist-ignore-team": { "en": "Ignore Team", "ko": "\uD300 \uBB34\uC2DC", "ja": "\u30C1\u30FC\u30E0\u3092\u7121\u8996", "zh": "\u5FFD\u7565\u56E2\u961F" },
        "aim-assist-ignore-death": { "en": "Ignore Death", "ko": "\uC2DC\uCCB4 \uBB34\uC2DC", "ja": "\u6B7B\u3092\u7121\u8996", "zh": "\u5FFD\u7565\u6B7B\u4EA1" },
        "esp": { "en": "ESP", "ko": "ESP", "ja": "ESP", "zh": "ESP" },
        "esp-tracer": { "en": "ESP Tracer", "ko": "ESP \uD2B8\uB808\uC774\uC11C", "ja": "ESP\u30C8\u30EC\u30FC\u30B5\u30FC", "zh": "ESP\u8DDF\u8E2A\u5668" },
        "esp-3d": { "en": "ESP 3D", "ko": "ESP 3D", "ja": "ESP 3D", "zh": "ESP 3D" },
        "esp-font-size": { "en": "ESP Font Size", "ko": "ESP \uD3F0\uD2B8 \uD06C\uAE30", "ja": "ESP\u30D5\u30A9\u30F3\u30C8\u30B5\u30A4\u30BA", "zh": "ESP\u5B57\u4F53\u5927\u5C0F" },
        "esp-tag": { "en": "ESP Tag", "ko": "ESP \uD0DC\uADF8", "ja": "ESP\u30BF\u30B0", "zh": "ESP\u6807\u7B7E" },
        "esp-tag-type": { "en": "ESP Tag Type", "ko": "ESP \uD0DC\uADF8 \uD0C0\uC785", "ja": "ESP\u30BF\u30B0\u30BF\u30A4\u30D7", "zh": "ESP\u6807\u7B7E\u7C7B\u578B" },
        "both": { "en": "Both", "ko": "\uBAA8\uB450", "ja": "\u4E21\u65B9", "zh": "\u5168\u90E8" },
        "number": { "en": "Number", "ko": "\uBC88\uD638", "ja": "\u756A\u53F7", "zh": "\u53F7\u7801" },
        "nickname": { "en": "Nickname", "ko": "\uB2C9\uB124\uC784", "ja": "\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0", "zh": "\u6635\u79F0" },
        "esp-bar": { "en": "ESP HP Bar", "ko": "ESP \uCCB4\uB825\uBC14", "ja": "ESP HP\u30D0\u30FC", "zh": "ESP \u751F\u547D\u503C\u6761" },
        "esp-color": { "en": "ESP Color", "ko": "ESP \uC0C9\uC0C1", "ja": "ESP\u8272", "zh": "ESP\u989C\u8272" },
        "esp-mark-color": { "en": "ESP Marked Color", "ko": "ESP \uB9C8\uD0B9 \uC0C9\uC0C1", "ja": "ESP\u30DE\u30FC\u30AF\u8272", "zh": "ESP\u6807\u8BB0\u989C\u8272" },
        "esp-team-color": { "en": "ESP Team Color", "ko": "ESP \uD300 \uC0C9\uC0C1", "ja": "ESP\u30C1\u30FC\u30E0\u8272", "zh": "ESP\u56E2\u961F\u989C\u8272" },
        "esp-dead-color": { "en": "ESP Dead Color", "ko": "ESP \uC0AC\uB9DD \uC0C9\uC0C1", "ja": "ESP\u6B7B\u4EA1\u8272", "zh": "ESP\u6B7B\u4EA1\u989C\u8272" },
        "esp-pitch-offset": { "en": "ESP Pitch Offset", "ko": "ESP \uD53C\uCE58 \uC624\uD504\uC14B", "ja": "ESP\u30D4\u30C3\u30C1\u30AA\u30D5\u30BB\u30C3\u30C8", "zh": "ESP\u4FEF\u4EF0\u504F\u79FB" },
        "esp-mark-keybind": { "en": "ESP Mark Keybind", "ko": "ESP \uB9C8\uD0B9 \uB2E8\uCD95\uD0A4", "ja": "ESP\u30DE\u30FC\u30AF\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9", "zh": "ESP\u6807\u8BB0\u952E\u7ED1\u5B9A" },
        "autoswap": { "en": "Auto Swap", "ko": "\uC624\uD1A0 \uC2A4\uC651", "ja": "\u30AA\u30FC\u30C8\u30B9\u30EF\u30C3\u30D7", "zh": "\u81EA\u52A8\u4EA4\u6362" },
        "autoswap-subweapon": { "en": "Sub Weapon", "ko": "\uBCF4\uC870 \uBB34\uAE30", "ja": "\u30B5\u30D6\u6B66\u5668", "zh": "\u526F\u6B66\u5668" },
        "autoswap-mainweapon": { "en": "Main Weapon", "ko": "\uC8FC \uBB34\uAE30", "ja": "\u30E1\u30A4\u30F3\u6B66\u5668", "zh": "\u4E3B\u6B66\u5668" },
        "autoswap-subweapon-listen": { "en": "Listen", "ko": "\uB9AC\uC2A4\uB2DD", "ja": "\u30EA\u30B9\u30CB\u30F3\u30B0", "zh": "\u76D1\u542C" },
        "autoswap-mainweapon-listen": { "en": "Listen", "ko": "\uB9AC\uC2A4\uB2DD", "ja": "\u30EA\u30B9\u30CB\u30F3\u30B0", "zh": "\u76D1\u542C" },
        "autoswap-main-keybind": { "en": "Main Weapon Keybind", "ko": "\uC8FC \uBB34\uAE30 \uB2E8\uCD95\uD0A4", "ja": "\u30E1\u30A4\u30F3\u6B66\u5668\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9", "zh": "\u4E3B\u6B66\u5668\u952E\u7ED1\u5B9A" },
        "autoswap-sub-keybind": { "en": "Sub Weapon Keybind", "ko": "\uBCF4\uC870 \uBB34\uAE30 \uB2E8\uCD95\uD0A4", "ja": "\u30B5\u30D6\u6B66\u5668\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9", "zh": "\u526F\u6B66\u5668\u952E\u7ED1\u5B9A" },
        "autoswap-zoom-keybind": { "en": "Zoom Keybind", "ko": "\uC90C \uB2E8\uCD95\uD0A4", "ja": "\u30BA\u30FC\u30E0\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9", "zh": "\u7F29\u653E\u952E\u7ED1\u5B9A" },
        "autoswap-use-zoom": { "en": "Use Zoom", "ko": "\uC90C \uC0AC\uC6A9", "ja": "\u30BA\u30FC\u30E0\u4F7F\u7528", "zh": "\u4F7F\u7528\u7F29\u653E" },
        "blackhole": { "en": "Blackhole", "ko": "\uBE14\uB799\uD640", "ja": "\u30D6\u30E9\u30C3\u30AF\u30DB\u30FC\u30EB", "zh": "\u9ED1\u6D1E" },
        "blackhole-target": { "en": "Blackhole Target", "ko": "\uBE14\uB799\uD640 \uD0C0\uAC9F", "ja": "\u30D6\u30E9\u30C3\u30AF\u30DB\u30FC\u30EB\u30BF\u30FC\u30B2\u30C3\u30C8", "zh": "\u9ED1\u6D1E\u76EE\u6807" },
        "crosshair": { "en": "Crosshair", "ko": "\uC870\uC900\uC120", "ja": "\u30AF\u30ED\u30B9\u30D8\u30A2", "zh": "\u51C6\u661F" },
        "position": { "en": "Position", "ko": "\uC704\uCE58", "ja": "\u4F4D\u7F6E", "zh": "\u4F4D\u7F6E" },
        "blackhole-distance": { "en": "Blackhole Distance", "ko": "\uBE14\uB799\uD640 \uAC70\uB9AC", "ja": "\u30D6\u30E9\u30C3\u30AF\u30DB\u30FC\u30EB\u8DDD\u96E2", "zh": "\u9ED1\u6D1E\u8DDD\u79BB" },
        "blackhole-position": { "en": "Blackhole Position", "ko": "\uBE14\uB799\uD640 \uC704\uCE58", "ja": "\u30D6\u30E9\u30C3\u30AF\u30DB\u30FC\u30EB\u4F4D\u7F6E", "zh": "\u9ED1\u6D1E\u4F4D\u7F6E" },
        "blackhole-ignore": { "en": "Ignore Marked", "ko": "\uB9C8\uD0B9 \uBB34\uC2DC", "ja": "\u30DE\u30FC\u30AF\u3092\u7121\u8996", "zh": "\u5FFD\u7565\u6807\u8BB0" },
        "blackhole-ignore-team": { "en": "Ignore Team", "ko": "\uD300 \uBB34\uC2DC", "ja": "\u30C1\u30FC\u30E0\u3092\u7121\u8996", "zh": "\u5FFD\u7565\u56E2\u961F" },
        "blackhole-ignore-death": { "en": "Ignore Death", "ko": "\uC2DC\uCCB4 \uBB34\uC2DC", "ja": "\u6B7B\u3092\u7121\u8996", "zh": "\u5FFD\u7565\u6B7B\u4EA1" },
        "blackhole-prevent-lagger": { "en": "Prevent Lagger", "ko": "\uACE0\uC758\uC9C0\uC5F0 \uBC29\uC9C0", "ja": "\u610F\u56F3\u7684\u306A\u9045\u5EF6\u9632\u6B62", "zh": "\u9632\u6B62\u6545\u610F\u5EF6\u8FDF" },
        "blackhole-force-drop": { "en": "Force Drop", "ko": "\uAC15\uC81C \uB4DC\uB78D", "ja": "\u5F37\u5236\u30C9\u30ED\u30C3\u30D7", "zh": "\u5F3A\u5236\u4E0B\u964D" },
        "shoot-speed": { "en": "Shoot Speed", "ko": "\uBC1C\uC0AC \uC18D\uB3C4", "ja": "\u30B7\u30E5\u30FC\u30C8\u901F\u5EA6", "zh": "\u5C04\u51FB\u901F\u5EA6" },
        "no-recoil": { "en": "No Recoil", "ko": "\uBB34\uBC18\uB3D9", "ja": "\u30EA\u30B3\u30A4\u30EB\u306A\u3057", "zh": "\u65E0\u540E\u5EA7\u529B" },
        "no-spread": { "en": "No Spread", "ko": "\uD0C4\uD37C\uC9D0 \uC5C6\uC74C", "ja": "\u30B9\u30D7\u30EC\u30C3\u30C9\u306A\u3057", "zh": "\u65E0\u6563\u5E03" },
        "infinite-ammo": { "en": "Infinite Ammo", "ko": "\uBB34\uD55C \uCD1D\uC54C", "ja": "\u7121\u9650\u5F3E\u85AC", "zh": "\u65E0\u9650\u5F39\u836F" },
        "no-reload": { "en": "No Reload", "ko": "\uC7AC\uC7A5\uC804 \uC5C6\uC74C", "ja": "\u30EA\u30ED\u30FC\u30C9\u306A\u3057", "zh": "\u65E0\u9700\u91CD\u65B0\u52A0\u8F7D" },
        "no-timer": { "en": "No Timer", "ko": "\uD0C0\uC774\uBA38 \uC81C\uAC70", "ja": "\u30BF\u30A4\u30DE\u30FC\u306A\u3057", "zh": "\u65E0\u8BA1\u65F6\u5668" },
        "no-timer-reload": { "en": "No Timer Reload", "ko": "\uC7AC\uC7A5\uC804 \uD0C0\uC774\uBA38 \uC81C\uAC70", "ja": "\u30EA\u30ED\u30FC\u30C9\u30BF\u30A4\u30DE\u30FC\u306A\u3057", "zh": "\u65E0\u91CD\u65B0\u52A0\u8F7D\u8BA1\u65F6\u5668" },
        "no-timer-grenade": { "en": "No Timer Grenade", "ko": "\uC218\uB958\uD0C4 \uD0C0\uC774\uBA38 \uC81C\uAC70", "ja": "\u30B0\u30EC\u30CD\u30FC\u30C9\u30BF\u30A4\u30DE\u30FC\u306A\u3057", "zh": "\u65E0\u624B\u69B4\u5F39\u8BA1\u65F6\u5668" },
        "no-timer-respawn": { "en": "No Timer Respawn", "ko": "\uBD80\uD65C \uD0C0\uC774\uBA38 \uC81C\uAC70", "ja": "\u30EA\u30B9\u30DD\u30FC\u30F3\u30BF\u30A4\u30DE\u30FC\u306A\u3057", "zh": "\u65E0\u91CD\u751F\u8BA1\u65F6\u5668" },
        "skill-cooldown": { "en": "Skill Cooldown", "ko": "\uC2A4\uD0AC \uCFE8\uD0C0\uC784", "ja": "\u30B9\u30AD\u30EB\u30AF\u30FC\u30EB\u30C0\u30A6\u30F3", "zh": "\u6280\u80FD\u51B7\u5374" },
        "instant-respawn": { "en": "Instant Respawn", "ko": "\uC989\uC2DC \uBD80\uD65C", "ja": "\u5373\u6642\u30EA\u30B9\u30DD\u30FC\u30F3", "zh": "\u5373\u65F6\u91CD\u751F" },
        "no-clip": { "en": "No Clip", "ko": "\uB178\uD074\uB9BD", "ja": "\u58C1\u901A\u904E", "zh": "\u65E0\u526A\u8F91" },
        "move-speed": { "en": "Move Speed", "ko": "\uC774\uB3D9 \uC18D\uB3C4", "ja": "\u79FB\u52D5\u901F\u5EA6", "zh": "\u79FB\u52A8\u901F\u5EA6" },
        "move-speed-value": { "en": "Move Speed Value", "ko": "\uC774\uB3D9 \uC18D\uB3C4 \uAC12", "ja": "\u79FB\u52D5\u901F\u5EA6\u5024", "zh": "\u79FB\u52A8\u901F\u5EA6\u503C" },
        "fly": { "en": "Fly", "ko": "\uD50C\uB77C\uC774", "ja": "\u30D5\u30E9\u30A4", "zh": "\u98DE\u884C" },
        "fly-up-keybind": { "en": "Fly Up Keybind", "ko": "\uD50C\uB77C\uC774 \uC5C5 \uB2E8\uCD95\uD0A4", "ja": "\u30D5\u30E9\u30A4\u30A2\u30C3\u30D7\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9", "zh": "\u98DE\u884C\u4E0A\u952E\u7ED1\u5B9A" },
        "fly-down-keybind": { "en": "Fly Down Keybind", "ko": "\uD50C\uB77C\uC774 \uB2E4\uC6B4 \uB2E8\uCD95\uD0A4", "ja": "\u30D5\u30E9\u30A4\u30C0\u30A6\u30F3\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9", "zh": "\u98DE\u884C\u4E0B\u952E\u7ED1\u5B9A" },
        "fly-speed": { "en": "Fly Speed", "ko": "\uD50C\uB77C\uC774 \uC18D\uB3C4", "ja": "\u30D5\u30E9\u30A4\u901F\u5EA6", "zh": "\u98DE\u884C\u901F\u5EA6" },
        "infinite-jump": { "en": "Infinite Jump", "ko": "\uBB34\uD55C \uC810\uD504", "ja": "\u7121\u9650\u30B8\u30E3\u30F3\u30D7", "zh": "\u65E0\u9650\u8DF3\u8DC3" },
        "infinite-jump-keybind": { "en": "Infinite Jump Keybind", "ko": "\uBB34\uD55C \uC810\uD504 \uB2E8\uCD95\uD0A4", "ja": "\u7121\u9650\u30B8\u30E3\u30F3\u30D7\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9", "zh": "\u65E0\u9650\u8DF3\u8DC3\u952E\u7ED1\u5B9A" },
        "one-kill": { "en": "One Kill", "ko": "\uC6D0 \uD0AC", "ja": "\u30EF\u30F3\u30AD\u30EB", "zh": "\u4E00\u6740" },
        "skill-damage": { "en": "Skill Damage", "ko": "\uC2A4\uD0AC \uB370\uBBF8\uC9C0", "ja": "\u30B9\u30AD\u30EB\u30C0\u30E1\u30FC\u30B8", "zh": "\u6280\u80FD\u4F24\u5BB3" },
        "upskill": { "en": "Upskill", "ko": "\uC5C5\uC2A4\uD0AC", "ja": "\u30A2\u30C3\u30D7\u30B9\u30AD\u30EB", "zh": "\u6280\u80FD\u5347\u7EA7" },
        "upskill-only-once": { "en": "Upskill Only Once", "ko": "\uC5C5\uC2A4\uD0AC \uC77C\uD68C\uC131", "ja": "\u30A2\u30C3\u30D7\u30B9\u30AD\u30EB\u4E00\u56DE", "zh": "\u6280\u80FD\u5347\u7EA7\u4E00\u6B21" },
        "grenade": { "en": "Grenade", "ko": "\uC218\uB958\uD0C4", "ja": "\u624B\u69B4\u5F3E", "zh": "\u624B\u69B4\u5F39" },
        "anti-hook": { "en": "Anti Hook", "ko": "\uC548\uD2F0 \uD6C4\uD06C", "ja": "\u30A2\u30F3\u30C1\u30D5\u30C3\u30AF", "zh": "\u53CD\u94A9" },
        "kicker": { "en": "Kicker", "ko": "\uD0A5", "ja": "\u30AD\u30C3\u30AB\u30FC", "zh": "\u8E22" },
        "auto-kick": { "en": "Auto Kick", "ko": "\uC790\uB3D9 \uD0A5", "ja": "\u81EA\u52D5\u30AD\u30C3\u30AF", "zh": "\u81EA\u52A8\u8E22" },
        "auto-kick-ignore": { "en": "Auto Kick Ignore Marked", "ko": "\uC790\uB3D9 \uD0A5 \uB9C8\uD06C \uBB34\uC2DC", "ja": "\u81EA\u52D5\u30AD\u30C3\u30AF\u30DE\u30FC\u30AF\u7121\u8996", "zh": "\u81EA\u52A8\u8E22\u5FFD\u7565\u6807\u8BB0" },
        "debuff": { "en": "Debuff", "ko": "\uB514\uBC84\uD504", "ja": "\u30C7\u30D0\u30D5", "zh": "\u51CF\u76CA\u6548\u679C" },
        "debuff-interval": { "en": "Debuff Interval", "ko": "\uB514\uBC84\uD504 \uAC04\uACA9", "ja": "\u30C7\u30D0\u30D5\u9593\u9694", "zh": "\u51CF\u76CA\u6548\u679C\u95F4\u9694" },
        "debuff-ignore": { "en": "Ignore Marked", "ko": "\uB9C8\uD06C \uBB34\uC2DC", "ja": "\u30DE\u30FC\u30AF\u7121\u8996", "zh": "\u5FFD\u7565\u6807\u8BB0" },
        "debuff-electric": { "en": "Electric Debuff", "ko": "\uC77C\uB809 \uB514\uBC84\uD504", "ja": "\u96FB\u6C17\u30C7\u30D0\u30D5", "zh": "\u7535\u51FB\u51CF\u76CA" },
        "debuff-mago": { "en": "Mago Debuff", "ko": "\uB9C8\uACE0 \uB514\uBC84\uD504", "ja": "\u30DE\u30B4\u30C7\u30D0\u30D5", "zh": "\u9A6C\u6208\u51CF\u76CA" },
        "hide-me": { "en": "Hide Player", "ko": "\uD50C\uB808\uC774\uC5B4 \uC228\uAE30\uAE30", "ja": "\u30D7\u30EC\u30A4\u30E4\u30FC\u3092\u96A0\u3059", "zh": "\u9690\u85CF\u73A9\u5BB6" },
        "electric": { "en": "Electric", "ko": "\uC77C\uB809", "ja": "\u96FB\u6C17", "zh": "\u7535\u51FB" },
        "mago": { "en": "Mago", "ko": "\uB9C8\uACE0", "ja": "\u30DE\u30B4", "zh": "\u9A6C\u6208" },
        "auto-end": { "en": "Auto End", "ko": "\uC790\uB3D9 \uC885\uB8CC", "ja": "\u81EA\u52D5\u7D42\u4E86", "zh": "\u81EA\u52A8\u7ED3\u675F" },
        "auto-end-type": { "en": "Auto End Type", "ko": "\uC790\uB3D9 \uC885\uB8CC \uD0C0\uC785", "ja": "\u81EA\u52D5\u7D42\u4E86\u30BF\u30A4\u30D7", "zh": "\u81EA\u52A8\u7ED3\u675F\u7C7B\u578B" },
        "cooker-buff": { "en": "Cooker Buff", "ko": "\uCFE0\uCEE4 \uBC84\uD504", "ja": "\u30AF\u30C3\u30AB\u30FC\u30D0\u30D5", "zh": "\u70F9\u996A\u5668BUFF" },
        "changer": { "en": "Changer", "ko": "\uCCB4\uC778\uC800", "ja": "\u30C1\u30A7\u30F3\u30B8\u30E3\u30FC", "zh": "\u66F4\u6539\u5668" },
        "reverse": { "en": "Reverse", "ko": "\uBC18\uC804", "ja": "\u30EA\u30D0\u30FC\u30B9", "zh": "\u53CD\u8F6C" },
        "reverse-keybind": { "en": "Reverse Keybind", "ko": "\uBC18\uC804 \uB2E8\uCD95\uD0A4", "ja": "\u30EA\u30D0\u30FC\u30B9\u30AD\u30FC\u30D0\u30A4\u30F3\u30C9", "zh": "\u53CD\u8F6C\u952E\u7ED1\u5B9A" },
        "skillcode": { "en": "Skill Code", "ko": "\uC2A4\uD0AC \uCF54\uB4DC", "ja": "\u30B9\u30AD\u30EB\u30B3\u30FC\u30C9", "zh": "\u6280\u80FD\u4EE3\u7801" },
        "change-NaN": { "en": "Change NaN", "ko": "NaN \uBCC0\uACBD", "ja": "NaN\u5909\u66F4", "zh": "\u66F4\u6539NaN" },
        "change-ads-reward": { "en": "Change Ads Reward", "ko": "\uAD11\uACE0 \uBCF4\uC0C1 \uBCC0\uACBD", "ja": "\u5E83\u544A\u5831\u916C\u5909\u66F4", "zh": "\u66F4\u6539\u5E7F\u544A\u5956\u52B1" },
        "match-maker": { "en": "Match Maker", "ko": "\uB9E4\uCE58 \uBA54\uC774\uCEE4", "ja": "\u30DE\u30C3\u30C1\u30E1\u30A4\u30AB\u30FC", "zh": "\u5339\u914D\u5668" },
        "match-end": { "en": "Match End", "ko": "\uB9E4\uCE58 \uC885\uB8CC", "ja": "\u30DE\u30C3\u30C1\u7D42\u4E86", "zh": "\u6BD4\u8D5B\u7ED3\u675F" },
        "win": { "en": "Win", "ko": "\uC2B9\uB9AC", "ja": "\u52DD\u5229", "zh": "\u80DC\u5229" },
        "lose": { "en": "Lose", "ko": "\uD328\uBC30", "ja": "\u6557\u5317", "zh": "\u5931\u8D25" },
        "draw": { "en": "Draw", "ko": "\uBB34\uC2B9\uBD80", "ja": "\u5F15\u304D\u5206\u3051", "zh": "\u5E73\u5C40" },
        "milk-win": { "en": "Milk Win", "ko": "\uBC00\uD06C \uC2B9\uB9AC", "ja": "\u30DF\u30EB\u30AF\u512A\u52DD", "zh": "\u725B\u5976\u83B7\u80DC" },
        "choco-win": { "en": "Choco Win", "ko": "\uCD08\uCF54 \uC2B9\uB9AC", "ja": "\u30C1\u30E7\u30B3\u30EC\u30FC\u30C8\u512A\u52DD", "zh": "\u5DE7\u514B\u529B\u83B7\u80DC" },
        "resource-hack": { "en": "Resource Hack", "ko": "\uC790\uC6D0 \uD575", "ja": "\u30EA\u30BD\u30FC\u30B9\u30CF\u30C3\u30AF", "zh": "\u8D44\u6E90\u9ED1\u5BA2" },
        "dia": { "en": "Diamond", "ko": "\uB2E4\uC774\uC544", "ja": "\u30C0\u30A4\u30E4", "zh": "\u94BB\u77F3" },
        "gold": { "en": "Gold", "ko": "\uACE8\uB4DC", "ja": "\u30B4\u30FC\u30EB\u30C9", "zh": "\u91D1\u5E01" },
        "xp": { "en": "XP", "ko": "\uACBD\uD5D8\uCE58", "ja": "\u7D4C\u9A13\u5024", "zh": "\u7ECF\u9A8C\u503C" },
        "clan-xp": { "en": "Clan XP", "ko": "\uD074\uB79C \uACBD\uD5D8\uCE58", "ja": "\u30AF\u30E9\u30F3\u7D4C\u9A13\u5024", "zh": "\u516C\u4F1A\u7ECF\u9A8C\u503C" },
        "sl-coin": { "en": "SL Coin", "ko": "\uC2BD\uB9AC \uCF54\uC778", "ja": "SL\u30B3\u30A4\u30F3", "zh": "SL\u5E01" },
        "sl-point": { "en": "SL Point", "ko": "\uC2BD\uB9AC \uD3EC\uC778\uD2B8", "ja": "SL\u30DD\u30A4\u30F3\u30C8", "zh": "SL\u70B9" },
        "receive": { "en": "Receive", "ko": "\uC218\uB839", "ja": "\u53D7\u3051\u53D6\u308A", "zh": "\u63A5\u6536" },
        "unlock-sl-medal": { "en": "Unlock SL Medal", "ko": "\uC2BD\uB9AC \uBA54\uB2EC \uD574\uAE08", "ja": "SL\u30E1\u30C0\u30EB\u30ED\u30C3\u30AF\u89E3\u9664", "zh": "\u89E3\u9501SL\u52CB\u7AE0" },
        "unlock-all-item": { "en": "Unlock All Item", "ko": "\uBAA8\uB4E0 \uD15C \uD574\uAE08", "ja": "\u3059\u3079\u3066\u306E\u30A2\u30A4\u30C6\u30E0\u30ED\u30C3\u30AF\u89E3\u9664", "zh": "\u89E3\u9501\u6240\u6709\u9879\u76EE" },
        "unlock-all-char": { "en": "Unlock All Character", "ko": "\uBAA8\uB4E0 \uCE90\uB9AD \uD574\uAE08", "ja": "\u3059\u3079\u3066\u306E\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u30ED\u30C3\u30AF\u89E3\u9664", "zh": "\u89E3\u9501\u6240\u6709\u89D2\u8272" },
        "buy-clan-gold": { "en": "Buy Clan Gold", "ko": "\uD074\uCF54 \uAD6C\uB9E4", "ja": "\u30AF\u30E9\u30F3\u30B4\u30FC\u30EB\u30C9\u8CFC\u5165", "zh": "\u8D2D\u4E70\u516C\u4F1A\u91D1\u5E01" },
        "get-daily-reward": { "en": "Get Daily", "ko": "\uC77C\uC77C \uBCF4\uC0C1 \uD68D\uB4DD", "ja": "\u65E5\u65E5\u5831\u916C\u7372\u5F97", "zh": "\u83B7\u53D6\u6BCF\u65E5\u5956\u52B1" },
        "buy-item": { "en": "Buy", "ko": "\uAD6C\uB9E4", "ja": "\u8CFC\u5165", "zh": "\u8D2D\u4E70" },
        "repeat-count": { "en": "Repeat Count", "ko": "\uBC18\uBCF5 \uD69F\uC218", "ja": "\u7E70\u308A\u8FD4\u3057\u56DE\u6570", "zh": "\u91CD\u590D\u6B21\u6570" },
        "char-id": { "en": "Character ID", "ko": "\uCE90\uB9AD\uD130 ID", "ja": "\u30AD\u30E3\u30E9\u30AF\u30BF\u30FCID", "zh": "\u89D2\u8272ID" },
        "utilities": { "en": "Utilities", "ko": "\uC720\uD2F8\uB9AC\uD2F0", "ja": "\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3", "zh": "\u5DE5\u5177" },
        "user-id": { "en": "User ID", "ko": "\uC720\uC800 ID", "ja": "\u30E6\u30FC\u30B6\u30FCID", "zh": "\u7528\u6237ID" },
        "kick": { "en": "Kick", "ko": "\uD0A5", "ja": "\u30AD\u30C3\u30AF", "zh": "\u8E22\u51FA" },
        "change": { "en": "Change", "ko": "\uBCC0\uACBD", "ja": "\u5909\u66F4", "zh": "\u66F4\u6539" },
        "vip-pass": { "en": "VIP Pass", "ko": "VIP \uD328\uC2A4", "ja": "VIP\u30D1\u30B9", "zh": "VIP\u901A\u884C\u8BC1" },
        "hero-pass": { "en": "Hero Pass", "ko": "\uD788\uC5B4\uB85C \uD328\uC2A4", "ja": "\u30D2\u30FC\u30ED\u30FC\u30D1\u30B9", "zh": "\u82F1\u96C4\u901A\u884C\u8BC1" },
        "purchase": { "en": "Purchase", "ko": "\uAD6C\uB9E4", "ja": "\u8CFC\u5165", "zh": "\u8D2D\u4E70" },
        "create-clan": { "en": "Create Clan", "ko": "\uD074\uB79C \uC0DD\uC131", "ja": "\u30AF\u30E9\u30F3\u4F5C\u6210", "zh": "\u521B\u5EFA\u516C\u4F1A" },
        "break-clan": { "en": "Break Clan", "ko": "\uD074\uB79C \uD574\uCCB4", "ja": "\u30AF\u30E9\u30F3\u89E3\u6563", "zh": "\u89E3\u6563\u516C\u4F1A" },
        "equip-spyra": { "en": "Equip Spyra", "ko": "\uC2A4\uD53C\uB77C \uC7A5\uCC29", "ja": "\u30B9\u30D1\u30A4\u30E9\u88C5\u5099", "zh": "\u88C5\u5907\u65AF\u76AE\u62C9" },
        "equip-mh9": { "en": "Equip MH9", "ko": "MH9 \uC7A5\uCC29", "ja": "MH9\u88C5\u5099", "zh": "\u88C5\u5907MH9" },
        "clanname": { "en": "Clan Name", "ko": "\uD074\uB79C \uC774\uB984", "ja": "\u30AF\u30E9\u30F3\u540D", "zh": "\u516C\u4F1A\u540D\u79F0" },
        "change-nickname": { "en": "Change Nickname", "ko": "\uB2C9\uB124\uC784 \uBCC0\uACBD", "ja": "\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0\u5909\u66F4", "zh": "\u66F4\u6539\u6635\u79F0" },
        "create": { "en": "Create", "ko": "\uC0DD\uC131", "ja": "\u4F5C\u6210", "zh": "\u521B\u5EFA" },
        "server-exploit": { "en": "Exploit Server", "ko": "\uC11C\uBC84 \uD3ED\uD30C", "ja": "\u30B5\u30FC\u30D0\u30FC\u30D5\u30A9\u30FC\u30EB\u30C8", "zh": "\u670D\u52A1\u5668\u7834\u574F" },
        "ctm": { "en": "Capture The Milk", "ko": "\uC6B0\uC720 \uBE8F\uAE30", "ja": "\u30DF\u30EB\u30AF\u3092\u53D6\u308B", "zh": "\u62A2\u5976" },
        "milk": { "en": "Milk", "ko": "\uBC00\uD06C", "ja": "\u30DF\u30EB\u30AF", "zh": "\u725B\u5976" },
        "choco": { "en": "Choco", "ko": "\uCD08\uCF54", "ja": "\u30C1\u30E7\u30B3", "zh": "\u5DE7\u514B\u529B" },
        "ctm-default": { "en": "Default Map", "ko": "\uAE30\uBCF8 \uC6B0\uBE8F", "ja": "\u30C7\u30D5\u30A9\u30EB\u30C8\u30DE\u30C3\u30D7", "zh": "\u9ED8\u8BA4\u5730\u56FE" },
        "ctm-desert": { "en": "Desert Map", "ko": "\uC0AC\uB9C9 \uC6B0\uBE8F", "ja": "\u7802\u6F20\u30DE\u30C3\u30D7", "zh": "\u6C99\u6F20\u5730\u56FE" },
        "ctm-castle": { "en": "Castle Map", "ko": "\uC131 \uC6B0\uBE8F", "ja": "\u57CE\u30DE\u30C3\u30D7", "zh": "\u57CE\u5821\u5730\u56FE" },
        "ctm-mountain": { "en": "Mountain Map", "ko": "\uC0B0 \uC6B0\uBE8F", "ja": "\u5C71\u30DE\u30C3\u30D7", "zh": "\u5C71\u5730\u56FE" },
        "macro": { "en": "Macro", "ko": "\uB9E4\uD06C\uB85C", "ja": "\u30DE\u30AF\u30ED", "zh": "\u5B8F" },
        "execute": { "en": "Execute", "ko": "\uC2E4\uD589", "ja": "\u5B9F\u884C", "zh": "\u6267\u884C" },
        "general": { "en": "General", "ko": "\uC77C\uBC18", "ja": "\u4E00\u822C", "zh": "\u4E00\u822C" },
        "frame": { "en": "Frame", "ko": "\uD504\uB808\uC784", "ja": "\u30D5\u30EC\u30FC\u30E0", "zh": "\u5E27" },
        "mobile-controller": { "en": "Mobile Controller", "ko": "\uBAA8\uBC14\uC77C \uCEE8\uD2B8\uB864\uB7EC", "ja": "\u30E2\u30D0\u30A4\u30EB\u30B3\u30F3\u30C8\u30ED\u30FC\u30E9", "zh": "\u79FB\u52A8\u63A7\u5236\u5668" },
        "utility": { "en": "Utility", "ko": "\uC720\uD2F8\uB9AC\uD2F0", "ja": "\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3", "zh": "\u6548\u7528" },
        "replay": { "en": "Replay", "ko": "\uB9AC\uD50C\uB808\uC774", "ja": "\u30EA\u30D7\u30EC\u30A4", "zh": "\u91CD\u64AD" },
        "manager": { "en": "Manager", "ko": "\uB9E4\uB2C8\uC800", "ja": "\u30DE\u30CD\u30FC\u30B8\u30E3", "zh": "\u7BA1\u7406\u8005" },
        "start": { "en": "Start", "ko": "\uC2DC\uC791", "ja": "\u30B9\u30BF\u30FC\u30C8", "zh": "\u5F00\u59CB" },
        "stop": { "en": "Stop", "ko": "\uC911\uC9C0", "ja": "\u30B9\u30C8\u30C3\u30D7", "zh": "\u505C\u6B62" },
        "port": { "en": "Port", "ko": "\uD3EC\uD2B8", "ja": "\u30DD\u30FC\u30C8", "zh": "\u7AEF\u53E3" },
        "gyro-scope": { "en": "Gyro Scope", "ko": "\uC790\uC774\uB85C \uC2A4\uCF54\uD504", "ja": "\u30B8\u30E3\u30A4\u30ED\u30B9\u30B3\u30FC\u30D7", "zh": "\u9640\u87BA\u4EEA" },
        "gyro-scope-use-gamma": { "en": "Gyro Scope Use Gamma", "ko": "\uC790\uC774\uB85C \uC2A4\uCF54\uD504 \uAC10\uB9C8 \uC0AC\uC6A9", "ja": "\u30B8\u30E3\u30A4\u30ED\u30B9\u30B3\u30FC\u30D7\u30AC\u30F3\u30DE\u4F7F\u7528", "zh": "\u9640\u87BA\u4EEA\u4F7F\u7528\u4F3D\u9A6C" },
        "gyro-scope-invert": { "en": "Gyro Scope Invert", "ko": "\uC790\uC774\uB85C \uC2A4\uCF54\uD504 \uBC18\uC804", "ja": "\u30B8\u30E3\u30A4\u30ED\u30B9\u30B3\u30FC\u30D7\u53CD\u8EE2", "zh": "\u9640\u87BA\u4EEA\u53CD\u8F6C" },
        "gyro-scope-sensitivity": { "en": "Gyro Scope Sensitivity", "ko": "\uC790\uC774\uB85C \uC2A4\uCF54\uD504 \uAC10\uB3C4", "ja": "\u30B8\u30E3\u30A4\u30ED\u30B9\u30B3\u30FC\u30D7\u611F\u5EA6", "zh": "\u9640\u87BA\u4EEA\u7075\u654F\u5EA6" },
        "search-player": { "en": "Search Player", "ko": "\uD50C\uB808\uC774\uC5B4 \uAC80\uC0C9", "ja": "\u30D7\u30EC\u30A4\u30E4\u30FC\u691C\u7D22", "zh": "\u641C\u7D22\u73A9\u5BB6" }
      };
      function lng(la, str) {
        return lan[str] ? lan[str][la] : str;
      }
      function keyOf(str) {
        if (keymap[str])
          return keymap[str];
        else
          return "";
      }
      var attached = false;
      var cheats = {};
      var keybinds = {};
      (0, dom_1.$$_)(".keybind").forEach((el) => {
        keybinds[el.id.split("key-")[1]] = "";
      });
      var ls = localStorage.getItem("keybinds");
      if (ls)
        keybinds = JSON.parse(ls);
      else
        localStorage.setItem("keybinds", JSON.stringify(keybinds));
      for (const key in keybinds) {
        const el = (0, dom_1.$i)(`key-${key}`);
        if (el)
          el.value = keybinds[key];
      }
      var config = {};
      (0, dom_1.$$_)(".config").forEach((el) => {
        if (el.tagName === "BUTTON") {
          config[el.id] = el.classList.contains("selected");
        } else if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
          const _el = el;
          config[_el.id] = _el.type === "checkbox" ? _el.checked : _el.value;
        } else {
          config[el.id] = "";
        }
      });
      var cs = localStorage.getItem("config");
      if (cs)
        config = JSON.parse(cs);
      else
        localStorage.setItem("config", JSON.stringify(config));
      for (const key in config) {
        const el = (0, dom_1.$_)(key);
        if (!el)
          continue;
        if (el.tagName === "BUTTON") {
          el.classList.toggle("selected", config[key]);
        } else {
          const _el = el;
          if (_el.type === "checkbox")
            _el.checked = config[key];
          else
            _el.value = config[key];
        }
      }
      var wpdata = {};
      var wps = localStorage.getItem("wpdata");
      if (wps)
        wpdata = JSON.parse(wps);
      else
        localStorage.setItem("wpdata", JSON.stringify(wpdata));
      (0, ipc_1.listen)("clear-wpdata", () => {
        wpdata = {};
        localStorage.setItem("wpdata", JSON.stringify(wpdata));
      });
      (0, ipc_1.listen)("wp-data", (_wpdata) => {
        wpdata = _wpdata;
        localStorage.setItem("wpdata", JSON.stringify(wpdata));
      });
      (0, dom_1.$_)("mobile-controller").classList.toggle("hide", !config["plugin-server-mobile-controller"]);
      var toggleCheat = (e) => {
        const _tar = e.currentTarget;
        const [key, val] = [_tar.id.split("toggle-")[1], _tar.checked];
        cheats[key] = val;
        (0, ipc_1.send)("cheats", key, val);
      };
      var macros = [];
      var ms = localStorage.getItem("macros");
      (0, ipc_1.listen)("macros", (_macros) => {
        macros = _macros;
        localStorage.setItem("macros", JSON.stringify(macros));
        const list = (0, dom_1.$_)("macro-list");
        list.innerHTML = "";
        for (const macro of macros) {
          const _id = macro.id;
          const el = document.createElement("main");
          el.id = _id;
          el.innerHTML = `
            <main id="${_id}">
                <div data-lang="${_id}" class="w-full"></div>
                <input type="text" id="key-${_id}" class="keybind" data-lang-ph="keybind">
                <button class="w-48 macro-button" id="${_id}" data-lang="execute"></button>
            </main>
        `;
          const button = el.querySelector("button");
          button.addEventListener("click", () => {
            (0, ipc_1.send)("execute-macro", _id);
          });
          list.appendChild(el);
        }
      });
      var lang = localStorage.getItem("lang") || "en";
      localStorage.setItem("lang", lang);
      var updateLang = () => {
        (0, dom_1.$$_)(".toggle").forEach((el) => {
          el.removeEventListener("change", toggleCheat);
        });
        (0, ipc_1.send)("lang", lang);
        (0, dom_1.$$_)("*[data-lang-ph]").forEach((el) => {
          el.placeholder = lng(lang, el.getAttribute("data-lang-ph"));
        });
        (0, dom_1.$$_)("*[data-lang-v]").forEach((el) => {
          el.value = lng(lang, el.getAttribute("data-lang-v"));
        });
        (0, dom_1.$$_)("*[data-lang]").forEach((el) => {
          if (el.tagName === "SUMMARY" && el.id) {
            el.innerHTML = `
                <input type="checkbox" class="toggle" id="toggle-${el.id}">
                <p>${lng(lang, el.getAttribute("data-lang"))}</p>
            `;
          } else
            el.textContent = lng(lang, el.getAttribute("data-lang"));
        });
        Object.keys(lan).forEach((key) => {
          const els = (0, dom_1.$$_)(`#lang-${key}`);
          if (els.length)
            els.forEach((el) => el.textContent = lng(lang, key));
        });
        (0, dom_1.$$_)(".toggle").forEach((el) => {
          const key = el.id.split("toggle-")[1];
          if (cheats[key] === void 0)
            cheats[key] = false;
          else
            el.checked = cheats[key];
          el.disabled = !attached;
          el.addEventListener("change", toggleCheat);
        });
      };
      (0, dom_1.$i)("lang").value = lang;
      updateLang();
      (0, dom_1.$_)("lang").addEventListener("change", (e) => {
        lang = e.target.value;
        localStorage.setItem("lang", lang);
        updateLang();
      });
      (0, dom_1.$$_)(".keybind").forEach((el) => {
        if (el.classList.contains("nocache"))
          return;
        el.onkeydown = (e) => {
          e.preventDefault();
          e.stopPropagation();
          let keyCode = keyOf(e.code);
          if (keyCode === "")
            return;
          if (keyCode === "ESCAPE")
            keyCode = "";
          el.value = keyCode;
          const keyName = el.id.split("key-")[1];
          keybinds[keyName] = keyCode;
          localStorage.setItem("keybinds", JSON.stringify(keybinds));
          (0, ipc_1.send)("keybind", keyName, keyCode);
        };
      });
      (0, dom_1.$$_)(".config").forEach((el) => {
        if (el.tagName === "BUTTON") {
          el.addEventListener("click", () => {
            el.classList.toggle("selected");
            config[el.id] = el.classList.contains("selected");
            localStorage.setItem("config", JSON.stringify(config));
            (0, ipc_1.send)("config", el.id, config[el.id]);
          });
        } else if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
          el.addEventListener("change", () => {
            const _el = el;
            if (_el.id === "plugin-server-mobile-controller")
              (0, dom_1.$_)("mobile-controller").classList.toggle("hide", !_el.checked);
            config[_el.id] = _el.type === "checkbox" ? _el.checked : _el.value;
            localStorage.setItem("config", JSON.stringify(config));
            (0, ipc_1.send)("config", el.id, config[el.id]);
          });
        }
      });
      var bounds = localStorage.getItem("layout");
      (0, ipc_1.send)("init", keybinds, config, wpdata, bounds ? JSON.parse(bounds) : null);
      (0, dom_1.$_)("login").classList.add("hide");
      (0, dom_1.$_)("app").classList.remove("hide");
      (0, dom_1.$_)("selector-dev-mode").classList.remove("hide");
      (0, dom_1.$_)("selector-console").classList.remove("hide");
      (0, dom_1.$_)("selector-finder").classList.remove("hide");
      (0, ipc_1.listen)("update-state", (id, _state, log2) => {
        const el = (0, dom_1.$_)(`state-${id}`);
        const elog = (0, dom_1.$_)(`state-${id}-log`);
        if (el)
          el.classList.remove("active", "error", "pending", "succeed", "clear", "null");
        if (el)
          el.classList.add(_state);
        if (elog)
          elog.textContent = log2;
      });
      (0, ipc_1.listen)("cookie", (cookie) => {
        (0, dom_1.$i)("cookie").value = cookie;
      });
      (0, ipc_1.send)("serial", (0, dom_1.$i)("serial").value);
      (0, dom_1.$i)("serial").addEventListener("change", () => {
        (0, ipc_1.send)("serial", (0, dom_1.$i)("serial").value);
      });
      (0, dom_1.$i)("cookie").addEventListener("change", () => {
        (0, ipc_1.send)("cookie", (0, dom_1.$i)("cookie").value);
      });
      (0, dom_1.$_)("connect-adb").addEventListener("click", () => {
        (0, ipc_1.send)("connect-adb", (0, dom_1.$i)("serial").value, true);
      });
      (0, dom_1.$_)("connect-serial").addEventListener("click", () => {
        (0, ipc_1.send)("connect-adb", (0, dom_1.$i)("serial").value, false);
      });
      (0, dom_1.$_)("start-server").addEventListener("click", () => {
        (0, ipc_1.send)("start-server");
      });
      (0, dom_1.$_)("download-server").addEventListener("click", () => {
        (0, ipc_1.send)("download-server");
      });
      (0, dom_1.$_)("upload-server").addEventListener("click", async () => {
        try {
          const selected = await tauriInvoke("plugin:dialog|open", {
            multiple: false,
            filters: [{ name: "Frida Server", extensions: ["*"] }]
          });
          if (selected) {
            (0, ipc_1.send)("upload-server", typeof selected === "string" ? selected : selected.path);
          }
        } catch (e) {
          console.error("File dialog error:", e);
        }
      });
      (0, dom_1.$_)("connect-frida").addEventListener("click", () => {
        (0, ipc_1.send)("connect-frida", (0, dom_1.$i)("serial").value);
      });
      (0, dom_1.$_)("get-cookie").addEventListener("click", () => {
        (0, ipc_1.send)("get-cookie");
      });
      (0, dom_1.$_)("start-agent").addEventListener("click", () => {
        (0, ipc_1.send)("start-agent");
      });
      (0, dom_1.$_)("back").addEventListener("click", () => {
        Array.from((0, dom_1.$_)("app").children).forEach((el) => el.classList.add("hide"));
        (0, dom_1.$_)("selector").classList.remove("hide");
        (0, dom_1.$_)("back").classList.add("hide");
      });
      (0, dom_1.$$_)(".selector").forEach((el) => {
        el.addEventListener("click", () => {
          (0, dom_1.$_)("selector").classList.add("hide");
          (0, dom_1.$_)(el.id.split("selector-")[1]).classList.remove("hide");
          (0, dom_1.$_)("back").classList.remove("hide");
        });
      });
      (0, ipc_1.listen)("init", (_b) => {
        attached = _b;
        (0, dom_1.$$_)(".toggle").forEach((el) => {
          el.disabled = !attached;
          if (!_b) {
            el.checked = _b;
          }
        });
        (0, dom_1.$$_)(".attached").forEach((el) => {
          el.disabled = !attached;
        });
      });
      var xel = (0, dom_1.$i)("pos-x");
      var yel = (0, dom_1.$i)("pos-y");
      var zel = (0, dom_1.$i)("pos-z");
      var sel = (0, dom_1.$i)("skillcode");
      (0, dom_1.$_)("pos-reverse").addEventListener("click", () => {
        (0, ipc_1.send)("reverse");
      });
      (0, ipc_1.listen)("pos", (pos) => {
        const [x, y, z] = pos;
        xel.value = x.toFixed(2);
        yel.value = y.toFixed(2);
        zel.value = z.toFixed(2);
      });
      (0, ipc_1.listen)("skillcode", (code) => {
        sel.value = code.toString();
      });
      (0, dom_1.$_)("change-NaN").addEventListener("click", () => {
        (0, ipc_1.send)("change-NaN");
      });
      var blurCurrent = () => {
        document.activeElement.blur();
      };
      var changePosition = () => {
        (0, ipc_1.send)("pos", [parseFloat(xel.value || "0"), parseFloat(yel.value || "0"), parseFloat(zel.value || "0")]);
      };
      xel.addEventListener("input", changePosition);
      yel.addEventListener("input", changePosition);
      zel.addEventListener("input", changePosition);
      sel.addEventListener("input", () => {
        (0, ipc_1.send)("skillcode", parseInt(sel.value || "0"));
      });
      xel.addEventListener("change", blurCurrent);
      yel.addEventListener("change", blurCurrent);
      zel.addEventListener("change", blurCurrent);
      sel.addEventListener("change", blurCurrent);
      (0, dom_1.$_)("match-win").addEventListener("click", () => {
        (0, ipc_1.send)("match-win");
      });
      (0, dom_1.$_)("match-lose").addEventListener("click", () => {
        (0, ipc_1.send)("match-lose");
      });
      (0, dom_1.$_)("match-draw").addEventListener("click", () => {
        (0, ipc_1.send)("match-draw");
      });
      (0, dom_1.$_)("match-milk").addEventListener("click", () => {
        (0, ipc_1.send)("match-milk");
      });
      (0, dom_1.$_)("match-choco").addEventListener("click", () => {
        (0, ipc_1.send)("match-choco");
      });
      (0, dom_1.$_)("receive-dia").addEventListener("click", () => {
        (0, ipc_1.send)("receive-dia", parseInt((0, dom_1.$i)("resource-hack-dia").value) || 0);
      });
      (0, dom_1.$_)("receive-gold").addEventListener("click", () => {
        (0, ipc_1.send)("receive-gold", parseInt((0, dom_1.$i)("resource-hack-gold").value) || 0);
      });
      (0, dom_1.$_)("receive-xp").addEventListener("click", () => {
        (0, ipc_1.send)("receive-xp", parseInt((0, dom_1.$i)("resource-hack-xp").value) || 0);
      });
      (0, dom_1.$_)("receive-clan-xp").addEventListener("click", () => {
        (0, ipc_1.send)("receive-clan-xp", parseInt((0, dom_1.$i)("resource-hack-clan-xp").value) || 0);
      });
      (0, dom_1.$_)("receive-sl-coin").addEventListener("click", () => {
        (0, ipc_1.send)("receive-sl-coin", parseInt((0, dom_1.$i)("resource-hack-sl-coin").value) || 0);
      });
      (0, dom_1.$_)("receive-sl-point").addEventListener("click", () => {
        (0, ipc_1.send)("receive-sl-point", parseInt((0, dom_1.$i)("resource-hack-sl-point").value) || 0);
      });
      (0, dom_1.$_)("unlock-sl-medal").addEventListener("click", () => {
        (0, ipc_1.send)("unlock-sl-medal");
      });
      (0, dom_1.$_)("unlock-all-item").addEventListener("click", () => {
        (0, ipc_1.send)("unlock-all-item", parseInt((0, dom_1.$i)("unlock-all-item-char-id").value) || 0);
      });
      (0, dom_1.$_)("unlock-all-char").addEventListener("click", () => {
        (0, ipc_1.send)("unlock-all-char");
      });
      (0, dom_1.$_)("get-daily-reward").addEventListener("click", () => {
        (0, ipc_1.send)("get-daily-reward", parseInt((0, dom_1.$i)("get-daily-reward-repeat").value) || 1);
      });
      (0, dom_1.$_)("kick-player").addEventListener("click", () => {
        (0, ipc_1.send)("kick-player", parseInt((0, dom_1.$i)("kick-player-number").value) || 0);
      });
      (0, dom_1.$_)("change-nickname").addEventListener("click", () => {
        (0, ipc_1.send)("change-nickname", (0, dom_1.$i)("nickname-value").value || "");
      });
      (0, dom_1.$_)("purchase-pass").addEventListener("click", () => {
        (0, ipc_1.send)("purchase-pass", parseInt((0, dom_1.$i)("purchase-player-number").value) || 0, parseInt((0, dom_1.$i)("purchase-item").value) || 1);
      });
      (0, dom_1.$_)("create-clan").addEventListener("click", () => {
        (0, ipc_1.send)("create-clan", (0, dom_1.$i)("clanname-value").value || "");
      });
      (0, dom_1.$_)("break-clan").addEventListener("click", () => {
        (0, ipc_1.send)("break-clan");
      });
      (0, dom_1.$_)("buy-clan-gold").addEventListener("click", () => {
        (0, ipc_1.send)("buy-clan-gold", parseInt((0, dom_1.$i)("buy-clan-gold-repeat").value) || 1);
      });
      (0, dom_1.$_)("equip-spyra").addEventListener("click", () => {
        (0, ipc_1.send)("equip-item", parseInt((0, dom_1.$i)("equip-char-number").value) || 1, 0, 24);
      });
      (0, dom_1.$_)("equip-mh9").addEventListener("click", () => {
        (0, ipc_1.send)("equip-item", parseInt((0, dom_1.$i)("equip-char-number").value) || 1, 1, 15);
      });
      updateExceptNumber();
      (0, dom_1.$_)("except-number").addEventListener("change", updateExceptNumber);
      function updateExceptNumber() {
        const val = (0, dom_1.$i)("except-number").value.split(",").filter((v) => v).map((v) => parseInt(v) || 0).filter((v) => v);
        (0, ipc_1.send)("except-number", val);
      }
      (0, ipc_1.listen)("except-number", (val) => {
        (0, dom_1.$i)("except-number").value = val.join(",");
        (0, dom_1.$i)("except-number").dispatchEvent(new Event("change"));
      });
      (0, dom_1.$_)("show-layout").addEventListener("change", () => {
        tauriInvoke("show_layout", { show: (0, dom_1.$i)("show-layout").checked });
      });
      (0, dom_1.$_)("lock-layout").addEventListener("change", () => {
        tauriInvoke("lock_layout", { lock: (0, dom_1.$i)("lock-layout").checked });
      });
      setInterval(async () => {
        try {
          const bounds2 = await tauriInvoke("resize_layout");
          if (bounds2)
            localStorage.setItem("layout", JSON.stringify(bounds2));
        } catch {
        }
      }, 5e3);
      (0, ipc_1.listen)("listen-sub", ([x, y]) => {
        (0, dom_1.$_)("listen-sub").classList.toggle("listening", false);
        (0, dom_1.$i)("autoswap-subweapon-x").value = x.toString();
        (0, dom_1.$i)("autoswap-subweapon-x").dispatchEvent(new Event("change"));
        (0, dom_1.$i)("autoswap-subweapon-y").value = y.toString();
        (0, dom_1.$i)("autoswap-subweapon-y").dispatchEvent(new Event("change"));
      });
      (0, ipc_1.listen)("listen-main", ([x, y]) => {
        (0, dom_1.$_)("listen-main").classList.toggle("listening", false);
        (0, dom_1.$i)("autoswap-mainweapon-x").value = x.toString();
        (0, dom_1.$i)("autoswap-mainweapon-x").dispatchEvent(new Event("change"));
        (0, dom_1.$i)("autoswap-mainweapon-y").value = y.toString();
        (0, dom_1.$i)("autoswap-mainweapon-y").dispatchEvent(new Event("change"));
      });
      (0, dom_1.$_)("get-ranges").addEventListener("click", () => {
        (0, ipc_1.send)("get-ranges", (0, dom_1.$i)("base").value);
      });
      (0, dom_1.$_)("find-ranges").addEventListener("click", () => {
        (0, ipc_1.send)("find-ranges", (0, dom_1.$i)("base").value);
      });
      (0, dom_1.$_)("search-pattern").addEventListener("click", () => {
        (0, ipc_1.send)("search-pattern", (0, dom_1.$i)("pattern").value);
      });
      (0, dom_1.$_)("execute-cmd").addEventListener("click", () => {
        (0, ipc_1.send)("execute-cmd", (0, dom_1.$i)("cmd").value);
      });
      (0, dom_1.$_)("server-start").addEventListener("click", () => {
        (0, ipc_1.send)("server-start", +(0, dom_1.$i)("server-port").value || 3e3);
      });
      (0, dom_1.$_)("server-stop").addEventListener("click", () => {
        (0, ipc_1.send)("server-stop");
      });
      (0, devtools_1.initDevTools)();
      (0, ipc_1.listen)("log", (...args) => {
        console.log(...args);
        const line = document.createElement("p");
        line.textContent = args.map((v) => {
          if (typeof v === "string")
            return v;
          if (typeof v === "number")
            return v.toString();
          if (typeof v === "boolean")
            return v.toString();
          return JSON.stringify(v);
        }).join(" ");
        (0, dom_1.$_)("console-out").appendChild(line);
        (0, dom_1.$_)("console-out").scrollTo({ top: (0, dom_1.$_)("console-out").scrollHeight });
      });
      (0, dom_1.$i)("console-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          (0, ipc_1.send)("console-cmd", (0, dom_1.$i)("console-input").value);
          (0, dom_1.$i)("console-input").value = "";
        }
      });
      (0, dom_1.$i)("search-wp").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          if ((0, dom_1.$i)("search-wp").value) {
            (0, dom_1.$_)("finder-out").innerHTML = "searching...";
            (0, ipc_1.send)("search-wp", (0, dom_1.$i)("search-wp").value, (0, dom_1.$i)("search-wp-type").value);
          }
        }
      });
      (0, ipc_1.listen)("search-wp", (wps2) => {
        const finderOut = (0, dom_1.$_)("finder-out");
        finderOut.innerHTML = "";
        if (wps2.length === 0) {
          finderOut.textContent = "No results";
          return;
        }
        wps2.forEach((wp) => {
          const wpOut = document.createElement("details");
          const summary = document.createElement("summary");
          summary.textContent = `[${wp.id}] ${wp.nicks.sort((a, b) => b.date - a.date)[0].nick}`;
          wpOut.appendChild(summary);
          const nicksDiv = document.createElement("div");
          nicksDiv.classList.add("nicks");
          wp.nicks.forEach((nick) => {
            const nickDiv = document.createElement("div");
            nickDiv.textContent = `${nick.nick} (${new Date(nick.date).toLocaleString()})`;
            nicksDiv.appendChild(nickDiv);
          });
          wpOut.appendChild(nicksDiv);
          Object.keys(wp.chars).forEach((char) => {
            const charWp = wp.chars[char];
            const charDiv = document.createElement("div");
            charDiv.textContent = `${char}: ${charWp.exp}XP ${charWp.totalkill}K ${charWp.totaldeath}D ${charWp.totalassist}A`;
            wpOut.appendChild(charDiv);
          });
          finderOut.appendChild(wpOut);
        });
      });
      async function initConnection() {
        try {
          const port = await tauriInvoke("get_ws_port");
          let retries = 0;
          const tryConnect = async () => {
            try {
              await (0, ipc_1.connect)(port);
              console.log(`Connected to sidecar on port ${port}`);
              (0, ipc_1.send)("init", keybinds, config, wpdata, bounds ? JSON.parse(bounds) : null);
              (0, ipc_1.send)("serial", (0, dom_1.$i)("serial").value);
            } catch (e) {
              if (retries < 10) {
                retries++;
                setTimeout(tryConnect, 500 * retries);
              } else {
                console.error("Failed to connect to sidecar after retries");
              }
            }
          };
          await tryConnect();
        } catch (e) {
          console.error("Failed to get WS port:", e);
        }
      }
      initConnection();
    }
  });
  require_main();
})();
