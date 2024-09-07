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
        config[el.id] = (el as HTMLInputElement).value;
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
        (el as HTMLInputElement).value = config[key];
    }
}

// language
let lang:string = localStorage.getItem('lang') || 'en'; // language
localStorage.setItem('lang', lang);
const updateLang = () => {
    ipcRenderer.send('lang', lang);
    $$_('*[data-lang-ph]').forEach((el:HTMLInputElement) => {
        el.placeholder = lng(lang, el.getAttribute('data-lang-ph'));
    });
    $$_('*[data-lang-v]').forEach((el:HTMLInputElement) => {
        el.value = lng(lang, el.getAttribute('data-lang-v'));
    });
    $$_('*[data-lang]').forEach((el:HTMLElement) => {
        el.textContent = lng(lang, el.getAttribute('data-lang'));
    });
    Object.keys(lan).forEach((key:string) => {
        const els = $$_(`#lang-${key}`)
        if(els.length) els.forEach((el:HTMLElement) => el.textContent = lng(lang, key));
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
            config[el.id] = (el as HTMLInputElement).value;
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('config', el.id, config[el.id]);
        });
    }
});

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
    if(el) el.classList.remove('active', 'error', 'pending');
    if(el) el.classList.add(state);
    if(elog) elog.textContent = log;
});
ipcRenderer.on('cookie', (e, cookie:string) => {
    $i('cookie').value = cookie;
});

ipcRenderer.send('host', $i('host').value);
ipcRenderer.send('port', $i('port').value);
$i('host').addEventListener('change', () => {ipcRenderer.send('host', $i('host').value);});
$i('port').addEventListener('change', () => {ipcRenderer.send('port', $i('port').value);});
$i('cookie').addEventListener('change', () => {ipcRenderer.send('cookie', $i('cookie').value);});

$_('connect-adb').addEventListener('click', () => {ipcRenderer.send('connect-adb', +$i('host').value, +$i('port').value);});
$_('start-server').addEventListener('click', () => {ipcRenderer.send('start-server');});
$_('download-server').addEventListener('click', () => {ipcRenderer.send('download-server');});
$_('upload-server').addEventListener('click', () => {ipcRenderer.send('upload-server');});
$_('connect-frida').addEventListener('click', () => {ipcRenderer.send('connect-frida', +$i('host').value, +$i('port').value);});
$_('get-cookie').addEventListener('click', () => {ipcRenderer.send('get-cookie');});
$_('start-agent').addEventListener('click', () => {ipcRenderer.send('start-agent');});