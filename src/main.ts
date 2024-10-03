import { ipcRenderer } from "electron";
import { IGlobalKey } from "node-global-key-listener";

const keymap:{[key:string]:IGlobalKey} = {
    'KeyQ': 'Q','KeyW': 'W','KeyE': 'E','KeyR': 'R','KeyT': 'T','KeyY': 'Y','KeyU': 'U','KeyI': 'I','KeyO': 'O','KeyP': 'P','KeyA': 'A','KeyS': 'S','KeyD': 'D','KeyF': 'F','KeyG': 'G','KeyH': 'H','KeyJ': 'J','KeyK': 'K','KeyL': 'L','KeyZ': 'Z','KeyX': 'X','KeyC': 'C','KeyV': 'V','KeyB': 'B','KeyN': 'N','KeyM': 'M',
    'Digit1': '1','Digit2': '2','Digit3': '3','Digit4': '4','Digit5': '5','Digit6': '6','Digit7': '7','Digit8': '8','Digit9': '9','Digit0': '0',
    'ArrowUp': 'UP ARROW','ArrowDown': 'DOWN ARROW','ArrowLeft': 'LEFT ARROW','ArrowRight': 'RIGHT ARROW',
    'Numpad0': 'NUMPAD 0','Numpad1': 'NUMPAD 1','Numpad2': 'NUMPAD 2','Numpad3': 'NUMPAD 3','Numpad4': 'NUMPAD 4','Numpad5': 'NUMPAD 5','Numpad6': 'NUMPAD 6','Numpad7': 'NUMPAD 7','Numpad8': 'NUMPAD 8','Numpad9': 'NUMPAD 9',
    'NumpadAdd': 'NUMPAD PLUS','NumpadSubtract': 'NUMPAD MINUS','NumpadMultiply': 'NUMPAD MULTIPLY','NumpadDivide': 'NUMPAD DIVIDE','NumpadEnter': 'NUMPAD RETURN','NumpadDecimal': 'NUMPAD DOT',
    'ControlLeft': 'LEFT CTRL','ControlRight': 'RIGHT CTRL','AltLeft': 'LEFT ALT','AltRight': 'RIGHT ALT','ShiftLeft': 'LEFT SHIFT','ShiftRight': 'RIGHT SHIFT',
    'MetaLeft': 'LEFT META','MetaRight': 'RIGHT META',
    'CapsLock': 'CAPS LOCK','NumLock': 'NUM LOCK','ScrollLock': 'SCROLL LOCK','Fn': 'FN',
    'F1': 'F1','F2': 'F2','F3': 'F3','F4': 'F4','F5': 'F5','F6': 'F6','F7': 'F7','F8': 'F8','F9': 'F9','F10': 'F10','F11': 'F11','F12': 'F12','F13': 'F13','F14': 'F14','F15': 'F15','F16': 'F16','F17': 'F17','F18': 'F18','F19': 'F19','F20': 'F20','F21': 'F21','F22': 'F22','F23': 'F23','F24': 'F24',
    'Equal': 'EQUALS','Minus': 'MINUS','BracketLeft': 'SQUARE BRACKET OPEN','BracketRight': 'SQUARE BRACKET CLOSE','Semicolon': 'SEMICOLON','Quote': 'QUOTE','Backslash': 'BACKSLASH','Comma': 'COMMA','Period': 'DOT','Slash': 'FORWARD SLASH',
    'Space': 'SPACE','Backspace': 'BACKSPACE','Enter': 'RETURN','Escape': 'ESCAPE','Backquote': 'SECTION','Delete': 'DELETE','Tab': 'TAB',
    'Insert': 'INS','Clear': 'NUMPAD CLEAR','PrintScreen': 'PRINT SCREEN', 'PageUp': 'PAGE UP','PageDown': 'PAGE DOWN','Home': 'HOME','End': 'END',
    'MouseLeft': 'MOUSE LEFT','MouseRight': 'MOUSE RIGHT','MouseMiddle': 'MOUSE MIDDLE','MouseX1': 'MOUSE X1','MouseX2': 'MOUSE X2',
}

const lan:{[key:string]:{[key:string]:string}} = {
    'checking-for-updates':{
        'en':'Checking for updates',
        'ko':'업데이트 확인 중',
        'ja':'更新を確認中',
        'zh':'检查更新中',
    },
    'key':{
        'en':'Key',
        'ko':'키',
        'ja':'キー',
        'zh':'键',
    },
    'login':{
        'en':'Login',
        'ko':'로그인',
        'ja':'ログイン',
        'zh':'登录',
    },
    'initialize':{
        'en':'Initialize',
        'ko':'초기화',
        'ja':'初期化',
        'zh':'初始化',
    },
    'cheats':{
        'en':'Cheats',
        'ko':'치트',
        'ja':'チート',
        'zh':'作弊',
    },
    'settings':{
        'en':'Settings',
        'ko':'설정',
        'ja':'設定',
        'zh':'设置',
    },
    'dev-mode':{
        'en':'Developer Mode',
        'ko':'개발자 모드',
        'ja':'開発者モード',
        'zh':'开发者模式',
    },
    'serial':{
        'en':'Serial',
        'ko':'시리얼',
        'ja':'シリアル',
        'zh':'序列号',
    },
    'adb':{
        'en':'ADB',
        'ko':'ADB',
        'ja':'ADB',
        'zh':'ADB',
    },
    'server':{
        'en':'Server',
        'ko':'서버',
        'ja':'サーバ',
        'zh':'服务器',
    },
    'frida':{
        'en':'Frida',
        'ko':'프리다',
        'ja':'フリダ',
        'zh':'Frida',
    },
    'session':{
        'en':'Session',
        'ko':'세션',
        'ja':'セッション',
        'zh':'会话',
    },
    'connect-adb':{
        'en':'Connect ADB',
        'ko':'ADB 연결',
        'ja':'ADB接続',
        'zh':'连接ADB',
    },
    'start-server':{
        'en':'Start Server',
        'ko':'서버 시작',
        'ja':'サーバ起動',
        'zh':'启动服务器',
    },
    'download-server':{
        'en':'Download Server',
        'ko':'서버 다운로드',
        'ja':'サーバダウンロード',
        'zh':'下载服务器',
    },
    'upload-server':{
        'en':'Upload Server',
        'ko':'서버 업로드',
        'ja':'サーバアップロード',
        'zh':'上传服务器',
    },
    'connect-frida':{
        'en':'Connect Frida',
        'ko':'프리다 연결',
        'ja':'フリダ接続',
        'zh':'连接Frida',
    },
    'cookie':{
        'en':'Cookie',
        'ko':'쿠키',
        'ja':'クッキー',
        'zh':'Cookie',
    },
    'get-cookie':{
        'en':'Get Cookie',
        'ko':'쿠키 가져오기',
        'ja':'クッキー取得',
        'zh':'获取Cookie',
    },
    'start-agent':{
        'en':'Start Agent',
        'ko':'에이전트 시작',
        'ja':'エージェント起動',
        'zh':'启动代理',
    },
    'keybind':{
        'en':'Keybind',
        'ko':'단축키',
        'ja':'キーバインド',
        'zh':'键绑定',
    },
}

function lng(la:string, str:string):string{
    return lan[str] ? lan[str][la] : str;
}

function keyOf(str: string): IGlobalKey {
    if (keymap[str]) return keymap[str];
    else return ""
}

const $ = (selector: string) => document.querySelector(selector);
const $$ = (selector: string) => document.querySelectorAll(selector);
const $_ = (selector: string) => document.getElementById(selector);
const $i = (selector: string):HTMLInputElement => document.getElementById(selector) as HTMLInputElement;
const $$_ = (selector: string) => Array.from($$(selector));
const log = (...args: any[]) => ipcRenderer.send("log", args);

let attached:boolean = false;
let cheats:{[key:string]:boolean} = {}; // cheats

// load local storage
let keybinds:{[key:string]:string} = {}; // keybinds
$$_('.keybind').forEach((el:HTMLElement) => {
    keybinds[el.id.split('key-')[1]] = '';
});
let ls = localStorage.getItem('keybinds');
if(ls) keybinds = JSON.parse(ls);
else localStorage.setItem('keybinds', JSON.stringify(keybinds));
for(const key in keybinds){
    const el:HTMLInputElement = $i(`key-${key}`) as HTMLInputElement;
    if(el) el.value = keybinds[key];
}

let config:{[key:string]:any} = {}; // config
$$_('.config').forEach((el:HTMLElement) => {
    // check element is button or input
    if(el.tagName === 'BUTTON'){
        config[el.id] = el.classList.contains('selected');
    } else if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        const _el = el as HTMLInputElement;
        config[_el.id] = _el.type === 'checkbox' ? _el.checked : _el.value;
    } else {
        config[el.id] = '';
    }
});
let cs = localStorage.getItem('config');
if(cs) config = JSON.parse(cs);
else localStorage.setItem('config', JSON.stringify(config));
for(const key in config){
    const el:HTMLElement = $_(key);
    if(!el) continue;
    if(el.tagName === 'BUTTON'){
        el.classList.toggle('selected', config[key]);
    } else {
        const _el = el as HTMLInputElement;
        if(_el.type === 'checkbox') _el.checked = config[key];
        else _el.value = config[key];
    }
}
const toggleCheat = (e:Event) => {
    const _tar = e.currentTarget as HTMLInputElement;
    const [key, val] = [_tar.id.split('toggle-')[1], _tar.checked];
    cheats[key] = val;
    ipcRenderer.send('cheats', key, val);
}
// language
let lang:string = localStorage.getItem('lang') || 'en'; // language
localStorage.setItem('lang', lang);
const updateLang = () => {
    $$_('.toggle').forEach((el:HTMLInputElement) => {
        el.removeEventListener('change', toggleCheat);
    });
    ipcRenderer.send('lang', lang);
    $$_('*[data-lang-ph]').forEach((el:HTMLInputElement) => {
        el.placeholder = lng(lang, el.getAttribute('data-lang-ph'));
    });
    $$_('*[data-lang-v]').forEach((el:HTMLInputElement) => {
        el.value = lng(lang, el.getAttribute('data-lang-v'));
    });
    $$_('*[data-lang]').forEach((el:HTMLElement) => {
        if(el.tagName === "SUMMARY" && el.id) {
            el.innerHTML = `
                <input type="checkbox" class="toggle" id="toggle-${el.id}">
                <p>${lng(lang, el.getAttribute('data-lang'))}</p>
            `;
        } else el.textContent = lng(lang, el.getAttribute('data-lang'));
    });
    Object.keys(lan).forEach((key:string) => {
        const els = $$_(`#lang-${key}`)
        if(els.length) els.forEach((el:HTMLElement) => el.textContent = lng(lang, key));
    });
    $$_('.toggle').forEach((el:HTMLInputElement) => {
        const key = el.id.split('toggle-')[1];
        if(cheats[key] === undefined) cheats[key] = false;
        else el.checked = cheats[key];
        el.disabled = !attached;
        el.addEventListener('change', toggleCheat);
    });
};
$i('lang').value = lang;
updateLang();
$_('lang').addEventListener('change', (e) => {
    lang = (e.target as HTMLSelectElement).value;
    localStorage.setItem('lang', lang);
    updateLang();
})

// key binding
$$_('.keybind').forEach((el:HTMLInputElement) => {
    if(el.classList.contains('nocache')) return;
    el.onkeydown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        let keyCode = keyOf(e.code);
        if(keyCode === "") return;
        if(keyCode === "ESCAPE") keyCode = "";
        el.value = keyCode;
        const keyName:string = el.id.split('key-')[1];
        keybinds[keyName] = keyCode;
        localStorage.setItem('keybinds', JSON.stringify(keybinds));
        ipcRenderer.send('keybind', keyName, keyCode);
    };
})

// config events
$$_('.config').forEach((el:HTMLElement) => {
    if(el.tagName === 'BUTTON'){
        el.addEventListener('click', () => {
            el.classList.toggle('selected');
            config[el.id] = el.classList.contains('selected');
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('config', el.id, config[el.id]);
        });
    } else if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        el.addEventListener('change', () => {
            const _el = el as HTMLInputElement;
            config[_el.id] = _el.type === 'checkbox' ? _el.checked : _el.value;
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('config', el.id, config[el.id]);
        });
    }
});
ipcRenderer.send('init', keybinds, config);

// auto updater
ipcRenderer.on('update', () => {
    $_('updp').classList.add('hide');
    $_('updbar').classList.remove('hide');
})
ipcRenderer.on('download', (e, progress:number) => {
    $_('updprg').style.width = `${progress}%`;
})
ipcRenderer.on('login', () => {
    $_('updp').classList.add('hide');
    $_('logform').classList.remove('hide');
});

// login
const tryLogin = () => {
    $i('logbtn').disabled = true;
    $i('key').disabled = true;
    ipcRenderer.send('login', $i('key').value);
}
$_('logbtn').addEventListener('click', tryLogin);
$i('key').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') tryLogin();
});
ipcRenderer.on('token', (e, token:Token|string) => {
    $i('logbtn').disabled = false;
    $i('key').disabled = false;
    if(typeof token === 'string'){
        $_('logerr').textContent = token;
    } else {
        localStorage.setItem('token', JSON.stringify(token.key));
        $_('login').classList.add('hide');
        $_('app').classList.remove('hide');
    }
});

ipcRenderer.on('update-state', (e, id:string, state:string, log:string) => {
    const el = $_(`state-${id}`);
    const elog = $_(`state-${id}-log`);
    if(el) el.classList.remove('active', 'error', 'pending', 'succeed', 'clear', 'null');
    if(el) el.classList.add(state);
    if(elog) elog.textContent = log;
});
ipcRenderer.on('cookie', (e, cookie:string) => {
    $i('cookie').value = cookie;
});

ipcRenderer.send('serial', $i('serial').value);
$i('serial').addEventListener('change', () => {ipcRenderer.send('serial', $i('serial').value);});
$i('cookie').addEventListener('change', () => {ipcRenderer.send('cookie', $i('cookie').value);});

$_('connect-adb').addEventListener('click', () => {ipcRenderer.send('connect-adb', $i('serial').value);});
$_('start-server').addEventListener('click', () => {ipcRenderer.send('start-server');});
$_('download-server').addEventListener('click', () => {ipcRenderer.send('download-server');});
$_('upload-server').addEventListener('click', () => {ipcRenderer.send('upload-server');});
$_('connect-frida').addEventListener('click', () => {ipcRenderer.send('connect-frida', $i('serial').value);});
$_('get-cookie').addEventListener('click', () => {ipcRenderer.send('get-cookie');});
$_('start-agent').addEventListener('click', () => {ipcRenderer.send('start-agent');});

$_('back').addEventListener('click', () => {
    Array.from($_('app').children).forEach((el:HTMLElement) => el.classList.add('hide'));
    $_('selector').classList.remove('hide');
    $_('back').classList.add('hide');
});

$$_('.selector').forEach((el:HTMLElement) => {
    el.addEventListener('click', () => {
        $_('selector').classList.add('hide');
        $_(el.id.split('selector-')[1]).classList.remove('hide');
        $_('back').classList.remove('hide');
    });
});

ipcRenderer.on('init', (e, _b:boolean) => {
    attached = _b;
    $$_('.toggle').forEach((el:HTMLInputElement) => {
        el.disabled = !attached;
        if(!_b){
            el.checked = _b;
        }
    });
})

const xel = $i('pos-x');
const yel = $i('pos-y');
const zel = $i('pos-z');
const sel = $i('skillcode');

$_('pos-reverse').addEventListener('click', () => {
    ipcRenderer.send('reverse');
});

ipcRenderer.on('pos', (e, pos:number[]) => {
    const [x, y, z] = pos;
    xel.value = x.toFixed(2);
    yel.value = y.toFixed(2);
    zel.value = z.toFixed(2);
})

ipcRenderer.on('skillcode', (e, code:number) => {
    sel.value = code.toString();
})

$_('change-ads-reward').addEventListener('click', () => {ipcRenderer.send('change-ads-reward');});

const blurCurrent = () => {(document.activeElement as HTMLInputElement).blur();}
const changePosition = () => {ipcRenderer.send('pos', [parseFloat(xel.value || "0"), parseFloat(yel.value || "0"), parseFloat(zel.value || "0")]);}

xel.addEventListener('input', changePosition);
yel.addEventListener('input', changePosition);
zel.addEventListener('input', changePosition);
sel.addEventListener('input', () => {ipcRenderer.send('skillcode', parseInt(sel.value || "0"));});
xel.addEventListener('change', blurCurrent);
yel.addEventListener('change', blurCurrent);
zel.addEventListener('change', blurCurrent);
sel.addEventListener('change', blurCurrent);

ipcRenderer.on('skillcode', (e, code:string) => {
    $i('skillcode').value = code;
})

$_('scan-epos').addEventListener('click', () => {ipcRenderer.send('scan-epos');});
$_('scan-entity').addEventListener('click', () => {ipcRenderer.send('scan-entity');});
$_('clear-all').addEventListener('click', () => {ipcRenderer.send('clear-all');});

updateExceptNumber();
$_('except-number').addEventListener('change', updateExceptNumber);

function updateExceptNumber(){
    const val = $i('except-number').value.split(',')
    .filter(v => v)
    .map((v:string) => parseInt(v) || 0)
    .filter(v => v);
    ipcRenderer.send('except-number', val);
}

$_('get-ranges').addEventListener('click', () => {ipcRenderer.send('get-ranges', $i('base').value);});
$_('find-ranges').addEventListener('click', () => {ipcRenderer.send('find-ranges', $i('base').value);});