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
    'plugins':{
        'en':'Plugins',
        'ko':'플러그인',
        'ja':'プラグイン',
        'zh':'插件',
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
    'connect-serial':{
        'en':'Connect Serial',
        'ko':'시리얼 연결',
        'ja':'シリアル接続',
        'zh':'连接序列号',
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
    'epos':{
        'en':'EPOS',
        'ko':'EPOS',
        'ja':'EPOS',
        'zh':'EPOS',
    },
    'entity':{
        'en':'Entity',
        'ko':'엔티티',
        'ja':'エンティティ',
        'zh':'实体',
    },
    'except-number':{
        'en':'Except Number',
        'ko':'제외 번호',
        'ja':'除外番号',
        'zh':'排除号码',
    },
    'show-layout':{
        'en':'Show Layout',
        'ko':'레이아웃 표시',
        'ja':'レイアウト表示',
        'zh':'显示布局',
    },
    'lock-layout':{
        'en':'Lock Layout',
        'ko':'레이아웃 잠금',
        'ja':'レイアウトロック',
        'zh':'锁定布局',
    },
    'scan-epos':{
        'en':'Scan EPOS',
        'ko':'EPOS 스캔',
        'ja':'EPOSスキャン',
        'zh':'扫描EPOS',
    },
    'scan-entity':{
        'en':'Scan Entity',
        'ko':'엔티티 스캔',
        'ja':'エンティティスキャン',
        'zh':'扫描实体',
    },
    'clear-all':{
        'en':'Clear All',
        'ko':'모두 지우기',
        'ja':'全てクリア',
        'zh':'全部清除',
    },
    'aimbot':{
        'en':'Aimbot',
        'ko':'에임봇',
        'ja':'エイムボット',
        'zh':'瞄准辅助',
    },
    'aimbot-mode':{
        'en':'Aimbot Mode',
        'ko':'에임봇 모드',
        'ja':'エイムボットモード',
        'zh':'瞄准辅助模式',
    },
    'normal':{
        'en':'Normal',
        'ko':'일반',
        'ja':'通常',
        'zh':'正常',
    },
    'smooth':{
        'en':'Smooth',
        'ko':'부드럽게',
        'ja':'スムーズ',
        'zh':'平滑',
    },
    'instant':{
        'en':'Instant',
        'ko':'즉시',
        'ja':'即時',
        'zh':'瞬间',
    },
    'aimbot-speed':{
        'en':'Aimbot Speed',
        'ko':'에임봇 속도',
        'ja':'エイムボット速度',
        'zh':'瞄准辅助速度',
    },
    'aimbot-limit':{
        'en':'Aimbot Angle Limit',
        'ko':'에임봇 각도 제한',
        'ja':'エイムボット角度制限',
        'zh':'瞄准辅助角度限制',
    },
    'aimbot-pitch-offset':{
        'en':'Aimbot Pitch Offset',
        'ko':'에임봇 피치 오프셋',
        'ja':'エイムボットピッチオフセット',
        'zh':'瞄准辅助俯仰偏移',
    },
    'aimbot-ignore':{
        'en':'Ignore Team',
        'ko':'팀 무시',
        'ja':'チームを無視',
        'zh':'忽略团队',
    },
    'aimbot-ignore-death':{
        'en':'Ignore Death',
        'ko':'시체 무시',
        'ja':'死を無視',
        'zh':'忽略死亡',
    },
    'aim-assist':{
        'en':'Aim Assist',
        'ko':'에임 어시스트',
        'ja':'エイムアシスト',
        'zh':'瞄准辅助',
    },
    'aim-assist-speed':{
        'en':'Aim Assist Speed',
        'ko':'에임 어시스트 속도',
        'ja':'エイムアシスト速度',
        'zh':'瞄准辅助速度',
    },
    'aim-assist-limit':{
        'en':'Aim Assist Angle Limit',
        'ko':'에임 어시스트 각도 제한',
        'ja':'エイムアシスト角度制限',
        'zh':'瞄准辅助角度限制',
    },
    'aim-assist-pitch-offset':{
        'en':'Aim Assist Pitch Offset',
        'ko':'에임 어시스트 피치 오프셋',
        'ja':'エイムアシストピッチオフセット',
        'zh':'瞄准辅助俯仰偏移',
    },
    'aim-assist-ignore':{
        'en':'Ignore Team',
        'ko':'팀 무시',
        'ja':'チームを無視',
        'zh':'忽略团队',
    },
    'aim-assist-ignore-death':{
        'en':'Ignore Death',
        'ko':'시체 무시',
        'ja':'死を無視',
        'zh':'忽略死亡',
    },
    'esp':{
        'en':'ESP',
        'ko':'ESP',
        'ja':'ESP',
        'zh':'ESP',
    },
    'esp-tracer':{
        'en':'ESP Tracer',
        'ko':'ESP 트레이서',
        'ja':'ESPトレーサー',
        'zh':'ESP跟踪器',
    },
    'esp-3d':{
        'en':'ESP 3D',
        'ko':'ESP 3D',
        'ja':'ESP 3D',
        'zh':'ESP 3D',
    },
    'esp-font-size':{
        'en':'ESP Font Size',
        'ko':'ESP 폰트 크기',
        'ja':'ESPフォントサイズ',
        'zh':'ESP字体大小',
    },
    'esp-tag':{
        'en':'ESP Tag',
        'ko':'ESP 태그',
        'ja':'ESPタグ',
        'zh':'ESP标签',
    },
    'esp-tag-type':{
        'en':'ESP Tag Type',
        'ko':'ESP 태그 타입',
        'ja':'ESPタグタイプ',
        'zh':'ESP标签类型',
    },
    'both':{
        'en':'Both',
        'ko':'모두',
        'ja':'両方',
        'zh':'全部',
    },
    'number':{
        'en':'Number',
        'ko':'번호',
        'ja':'番号',
        'zh':'号码',
    },
    'nickname':{
        'en':'Nickname',
        'ko':'닉네임',
        'ja':'ニックネーム',
        'zh':'昵称',
    },
    'esp-color':{
        'en':'ESP Color',
        'ko':'ESP 색상',
        'ja':'ESP色',
        'zh':'ESP颜色',
    },
    'esp-mark-color':{
        'en':'ESP Marked Color',
        'ko':'ESP 마킹 색상',
        'ja':'ESPマーク色',
        'zh':'ESP标记颜色',
    },
    'esp-dead-color':{
        'en':'ESP Dead Color',
        'ko':'ESP 사망 색상',
        'ja':'ESP死亡色',
        'zh':'ESP死亡颜色',
    },
    'esp-pitch-offset':{
        'en':'ESP Pitch Offset',
        'ko':'ESP 피치 오프셋',
        'ja':'ESPピッチオフセット',
        'zh':'ESP俯仰偏移',
    },
    'esp-mark-keybind':{
        'en':'ESP Mark Keybind',
        'ko':'ESP 마킹 단축키',
        'ja':'ESPマークキーバインド',
        'zh':'ESP标记键绑定',
    },
    'blackhole':{
        'en':'Blackhole',
        'ko':'블랙홀',
        'ja':'ブラックホール',
        'zh':'黑洞',
    },
    'blackhole-distance':{
        'en':'Blackhole Distance',
        'ko':'블랙홀 거리',
        'ja':'ブラックホール距離',
        'zh':'黑洞距离',
    },
    'blackhole-ignore':{
        'en':'Ignore Team',
        'ko':'팀 무시',
        'ja':'チームを無視',
        'zh':'忽略团队',
    },
    'blackhole-ignore-death':{
        'en':'Ignore Death',
        'ko':'시체 무시',
        'ja':'死を無視',
        'zh':'忽略死亡',
    },
    'blackhole-prevent-lagger':{
        'en':'Prevent Lagger',
        'ko': '고의지연 방지',
        'ja': '',
        'zh': '',
    },
    'shoot-speed':{
        'en':'Shoot Speed',
        'ko':'발사 속도',
        'ja':'シュート速度',
        'zh':'射击速度',
    },
    'no-recoil':{
        'en':'No Recoil',
        'ko':'무반동',
        'ja':'リコイルなし',
        'zh':'无后座力',
    },
    'no-spread':{
        'en':'No Spread',
        'ko':'탄퍼짐 없음',
        'ja':'スプレッドなし',
        'zh':'无散布',
    },
    'no-reload':{
        'en':'No Reload',
        'ko':'재장전 없음',
        'ja':'リロードなし',
        'zh':'无需重新加载',
    },
    'skill-cooldown':{
        'en':'Skill Cooldown',
        'ko':'스킬 쿨타임',
        'ja':'スキルクールダウン',
        'zh':'技能冷却',
    },
    'instant-respawn':{
        'en':'Instant Respawn',
        'ko':'즉시 부활',
        'ja':'即時リスポーン',
        'zh':'即时重生',
    },
    'no-clip':{
        'en':'No Clip',
        'ko':'노클립',
        'ja':'壁通過',
        'zh':'无剪辑',
    },
    'move-speed':{
        'en':'Move Speed',
        'ko':'이동 속도',
        'ja':'移動速度',
        'zh':'移动速度',
    },
    'move-speed-value':{
        'en':'Move Speed Value',
        'ko':'이동 속도 값',
        'ja':'移動速度値',
        'zh':'移动速度值',
    },
    'fly':{
        'en':'Fly',
        'ko':'플라이',
        'ja':'フライ',
        'zh':'飞行',
    },
    'fly-up-keybind':{
        'en':'Fly Up Keybind',
        'ko':'플라이 업 단축키',
        'ja':'フライアップキーバインド',
        'zh':'飞行上键绑定',
    },
    'fly-down-keybind':{
        'en':'Fly Down Keybind',
        'ko':'플라이 다운 단축키',
        'ja':'フライダウンキーバインド',
        'zh':'飞行下键绑定',
    },
    'fly-speed':{
        'en':'Fly Speed',
        'ko':'플라이 속도',
        'ja':'フライ速度',
        'zh':'飞行速度',
    },
    'infinite-jump':{
        'en':'Infinite Jump',
        'ko':'무한 점프',
        'ja':'無限ジャンプ',
        'zh':'无限跳跃',
    },
    'infinite-jump-keybind':{
        'en':'Infinite Jump Keybind',
        'ko':'무한 점프 단축키',
        'ja':'無限ジャンプキーバインド',
        'zh':'无限跳跃键绑定',
    },
    'one-kill':{
        'en':'One Kill',
        'ko':'원 킬',
        'ja':'ワンキル',
        'zh':'一杀',
    },
    'skill-damage':{
        'en':'Skill Damage',
        'ko':'스킬 데미지',
        'ja':'スキルダメージ',
        'zh':'技能伤害',
    },
    'upskill':{
        'en':'Upskill',
        'ko':'업스킬',
        'ja':'アップスキル',
        'zh':'技能升级',
    },
    'upskill-value':{
        'en':'Upskill Value',
        'ko':'업스킬 값',
        'ja':'アップスキル値',
        'zh':'技能升级值',
    },
    'upskill-except-timer':{
        'en':'Upskill Except Timer',
        'ko':'업스킬 타이머 제외',
        'ja':'アップスキルタイマー除外',
        'zh':'技能升级除计时器',
    },
    'grenade':{
        'en':'Grenade',
        'ko':'수류탄',
        'ja':'手榴弾',
        'zh':'手榴弹',
    },
    'hide-me':{
        'en':'Hide Player',
        'ko':'플레이어 숨기기',
        'ja':'プレイヤーを隠す',
        'zh':'隐藏玩家',
    },
    'cooker-buff':{
        'en':'Cooker Buff',
        'ko':'쿠커 버프',
        'ja':'クッカーバフ',
        'zh':'烹饪器BUFF',
    },
    'changer':{
        'en':'Changer',
        'ko':'체인저',
        'ja':'チェンジャー',
        'zh':'更改器',
    },
    'reverse':{
        'en':'Reverse',
        'ko':'반전',
        'ja':'リバース',
        'zh':'反转',
    },
    'reverse-keybind':{
        'en':'Reverse Keybind',
        'ko':'반전 단축키',
        'ja':'リバースキーバインド',
        'zh':'反转键绑定',
    },
    'skillcode':{
        'en':'Skill Code',
        'ko':'스킬 코드',
        'ja':'スキルコード',
        'zh':'技能代码',
    },
    'change-ads-reward':{
        'en':'Change Ads Reward',
        'ko':'광고 보상 변경',
        'ja':'広告報酬変更',
        'zh':'更改广告奖励',
    },
    'general':{
        'en':'General',
        'ko':'일반',
        'ja':'一般',
        'zh':'一般',
    },
    'frame':{
        'en':'Frame',
        'ko':'프레임',
        'ja':'フレーム',
        'zh':'帧',
    },
    "mobile-controller": {
        "en": "Mobile Controller",
        "ko": "모바일 컨트롤러",
        "ja": "モバイルコントローラ",
        "zh": "移动控制器"
    },
    "utility": {
        "en": "Utility",
        "ko": "유틸리티",
        "ja": "ユーティリティ",
        "zh": "效用"
    },
    "replay": {
        "en": "Replay",
        "ko": "리플레이",
        "ja": "リプレイ",
        "zh": "重播"
    },
    'manager':{
        'en':'Manager',
        'ko':'매니저',
        'ja':'マネージャ',
        'zh':'管理者',
    },
    'start':{
        'en':'Start',
        'ko':'시작',
        'ja':'スタート',
        'zh':'开始',
    },
    'stop':{
        'en':'Stop',
        'ko':'중지',
        'ja':'ストップ',
        'zh':'停止',
    },
    'port':{
        'en':'Port',
        'ko':'포트',
        'ja':'ポート',
        'zh':'端口',
    },
    "gyro-scope": {
        "en": "Gyro Scope",
        "ko": "자이로 스코프",
        "ja": "ジャイロスコープ",
        "zh": "陀螺仪"
    },
    'gyro-scope-use-gamma':{
        'en':'Gyro Scope Use Gamma',
        'ko':'자이로 스코프 감마 사용',
        'ja':'ジャイロスコープガンマ使用',
        'zh':'陀螺仪使用伽马',
    },
    "gyro-scope-invert":{
        "en": "Gyro Scope Invert",
        "ko": "자이로 스코프 반전",
        "ja": "ジャイロスコープ反転",
        "zh": "陀螺仪反转"
    },
    "gyro-scope-sensitivity": {
        "en": "Gyro Scope Sensitivity",
        "ko": "자이로 스코프 감도",
        "ja": "ジャイロスコープ感度",
        "zh": "陀螺仪灵敏度"
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
$_('mobile-controller').classList.toggle('hide', !config['plugin-server-mobile-controller']);
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
            if(_el.id === 'plugin-server-mobile-controller') $_('mobile-controller').classList.toggle('hide', !_el.checked);
            config[_el.id] = _el.type === 'checkbox' ? _el.checked : _el.value;
            localStorage.setItem('config', JSON.stringify(config));
            ipcRenderer.send('config', el.id, config[el.id]);
        });
    }
});
const bounds = localStorage.getItem('layout');
ipcRenderer.send('init', keybinds, config, bounds ? JSON.parse(bounds) : null);

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
        if(token.perms.includes('dev')) $_('selector-dev-mode').classList.remove('hide');
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

$_('connect-adb').addEventListener('click', () => {ipcRenderer.send('connect-adb', $i('serial').value, true);});
$_('connect-serial').addEventListener('click', () => {ipcRenderer.send('connect-adb', $i('serial').value, false);});
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

ipcRenderer.on('except-number', (e, val:number[]) => {
    $i('except-number').value = val.join(',');
    $i('except-number').dispatchEvent(new Event('change'));
})

$_('show-layout').addEventListener('change', () => {ipcRenderer.send('show-layout', $i('show-layout').checked);});
$_('lock-layout').addEventListener('change', () => {ipcRenderer.send('lock-layout', $i('lock-layout').checked);});

ipcRenderer.on('resize-layout', (e, bounds:Electron.Rectangle) => {
    localStorage.setItem('layout', JSON.stringify(bounds));
});

$_('get-ranges').addEventListener('click', () => {ipcRenderer.send('get-ranges', $i('base').value);});
$_('find-ranges').addEventListener('click', () => {ipcRenderer.send('find-ranges', $i('base').value);});

$_('server-start').addEventListener('click', () => {ipcRenderer.send('server-start', +$i('server-port').value || 3000);});
$_('server-stop').addEventListener('click', () => {ipcRenderer.send('server-stop');});