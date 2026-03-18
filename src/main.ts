import { connect, send, listen } from "./ipc";
import { initDevTools } from "./ui/devtools";
import { $, $$, $_, $c, $i, $$_ } from "./ui/dom";

import type { IGlobalKey } from "node-global-key-listener";

type DeathmatchState = 'running' | 'stopped';

// Tauri API - uses window.__TAURI_INTERNALS__ provided by Tauri runtime
const tauriInvoke = (cmd: string, args?: any): Promise<any> => {
    const internals = (window as any).__TAURI_INTERNALS__;
    if (internals && internals.invoke) {
        return internals.invoke(cmd, args);
    }
    return Promise.reject(new Error('Tauri runtime not available'));
};

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
        'en':'Checking for updates...',
        'ko':'업데이트 확인 중...',
        'ja':'更新を確認中...',
        'zh':'检查更新中...',
    },
    'updating-to':{
        'en':'Updating to',
        'ko':'업데이트 중',
        'ja':'更新中',
        'zh':'更新到',
    },
    'update-failed':{
        'en':'Update check failed',
        'ko':'업데이트 확인 실패',
        'ja':'更新確認に失敗しました',
        'zh':'检查更新失败',
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
    'authenticating':{
        'en':'Authenticating...',
        'ko':'인증 중...',
        'ja':'認証中...',
        'zh':'认证中...',
    },
    'auth-failed':{
        'en':'Authentication failed',
        'ko':'인증 실패',
        'ja':'認証失敗',
        'zh':'认证失败',
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
    'macros':{
        'en':'Macros',
        'ko':'매크로',
        'ja':'マクロ',
        'zh':'宏',
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
    'console':{
        'en':'Console',
        'ko':'콘솔',
        'ja':'コンソール',
        'zh':'控制台',
    },
    'finder':{
        'en':'Finder',
        'ko':'파인더',
        'ja':'ファインダー',
        'zh':'查找',
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
    'epos-number':{
        'en':'EPOS Number',
        'ko':'EPOS 번호',
        'ja':'EPOS番号',
        'zh':'EPOS号码',
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
    'reset-layout':{
        'en':'Reset Layout Size',
        'ko':'레이아웃 크기 초기화',
        'ja':'レイアウトサイズリセット',
        'zh':'重置布局大小',
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
    'aimbot-speed':{ 'en':'Aimbot Speed', 'ko':'에임봇 속도', 'ja':'エイムボット速度', 'zh':'瞄准辅助速度', },
    'aimbot-limit':{ 'en':'Aimbot Angle Limit', 'ko':'에임봇 각도 제한', 'ja':'エイムボット角度制限', 'zh':'瞄准辅助角度限制', },
    'aimbot-pitch-offset':{ 'en':'Aimbot Pitch Offset', 'ko':'에임봇 피치 오프셋', 'ja':'エイムボットピッチオフセット', 'zh':'瞄准辅助俯仰偏移', },
    'aimbot-acceleration':{ 'en':'Aimbot Acceleration', 'ko':'에임봇 가속도', 'ja':'エイムボット加速度', 'zh':'瞄准辅助加速度', },
    'aimbot-main-weapon-only':{ 'en':'Aimbot Main Weapon Only', 'ko':'에임봇 주무기만', 'ja':'エイムボット メイン武器のみ', 'zh':'自瞄仅限主武器', },
    'aimbot-ignore':{ 'en':'Ignore Marked', 'ko':'마킹 무시', 'ja':'マークを無視', 'zh':'忽略标记', },
    'aimbot-ignore-team':{ 'en':'Ignore Team', 'ko':'팀 무시', 'ja':'チームを無視', 'zh':'忽略团队', },
    'aimbot-ignore-death':{ 'en':'Ignore Death', 'ko':'시체 무시', 'ja':'死を無視', 'zh':'忽略死亡', },
    'aim-assist':{ 'en':'Aim Assist', 'ko':'에임 어시스트', 'ja':'エイムアシスト', 'zh':'瞄准辅助', },
    'aim-assist-speed':{ 'en':'Aim Assist Speed', 'ko':'에임 어시스트 속도', 'ja':'エイムアシスト速度', 'zh':'瞄准辅助速度', },
    'aim-assist-limit':{ 'en':'Aim Assist Angle Limit', 'ko':'에임 어시스트 각도 제한', 'ja':'エイムアシスト角度制限', 'zh':'瞄准辅助角度限制', },
    'aim-assist-pitch-offset':{ 'en':'Aim Assist Pitch Offset', 'ko':'에임 어시스트 피치 오프셋', 'ja':'エイムアシストピッチオフセット', 'zh':'瞄准辅助俯仰偏移', },
    'aim-assist-decay':{ 'en':'Aim Assist Decay', 'ko':'에임 어시스트 감쇠', 'ja':'エイムアシスト減衰', 'zh':'瞄准辅助衰减', },
    'aim-assist-ignore':{ 'en':'Ignore Marked', 'ko':'마킹 무시', 'ja':'マークを無視', 'zh':'忽略标记', },
    'aim-assist-ignore-team':{ 'en':'Ignore Team', 'ko':'팀 무시', 'ja':'チームを無視', 'zh':'忽略团队', },
    'aim-assist-ignore-death':{ 'en':'Ignore Death', 'ko':'시체 무시', 'ja':'死を無視', 'zh':'忽略死亡', },
    'esp':{ 'en':'ESP', 'ko':'ESP', 'ja':'ESP', 'zh':'ESP', },
    'esp-tracer':{ 'en':'ESP Tracer', 'ko':'ESP 트레이서', 'ja':'ESPトレーサー', 'zh':'ESP跟踪器', },
    'esp-3d':{ 'en':'ESP 3D', 'ko':'ESP 3D', 'ja':'ESP 3D', 'zh':'ESP 3D', },
    'esp-font-size':{ 'en':'ESP Font Size', 'ko':'ESP 폰트 크기', 'ja':'ESPフォントサイズ', 'zh':'ESP字体大小', },
    'esp-tag':{ 'en':'ESP Tag', 'ko':'ESP 태그', 'ja':'ESPタグ', 'zh':'ESP标签', },
    'esp-tag-type':{ 'en':'ESP Tag Type', 'ko':'ESP 태그 타입', 'ja':'ESPタグタイプ', 'zh':'ESP标签类型', },
    'both':{ 'en':'Both', 'ko':'모두', 'ja':'両方', 'zh':'全部', },
    'number':{ 'en':'Number', 'ko':'번호', 'ja':'番号', 'zh':'号码', },
    'nickname':{ 'en':'Nickname', 'ko':'닉네임', 'ja':'ニックネーム', 'zh':'昵称', },
    'esp-bar':{ 'en':'ESP HP Bar', 'ko':'ESP 체력바', 'ja':'ESP HPバー', 'zh':'ESP 生命值条', },
    'esp-color':{ 'en':'ESP Color', 'ko':'ESP 색상', 'ja':'ESP色', 'zh':'ESP颜色', },
    'esp-mark-color':{ 'en':'ESP Marked Color', 'ko':'ESP 마킹 색상', 'ja':'ESPマーク色', 'zh':'ESP标记颜色', },
    'esp-team-color':{ 'en':'ESP Team Color', 'ko':'ESP 팀 색상', 'ja':'ESPチーム色', 'zh':'ESP团队颜色', },
    'esp-dead-color':{ 'en':'ESP Dead Color', 'ko':'ESP 사망 색상', 'ja':'ESP死亡色', 'zh':'ESP死亡颜色', },
    'esp-pitch-offset':{ 'en':'ESP Pitch Offset', 'ko':'ESP 피치 오프셋', 'ja':'ESPピッチオフセット', 'zh':'ESP俯仰偏移', },
    'esp-mark-keybind':{ 'en':'ESP Mark Keybind', 'ko':'ESP 마킹 단축키', 'ja':'ESPマークキーバインド', 'zh':'ESP标记键绑定', },
    'autoswap':{ 'en':'Auto Swap', 'ko':'오토 스왑', 'ja':'オートスワップ', 'zh':'自动交换', },
    'autoswap-subweapon':{ 'en':'Sub Weapon', 'ko':'보조 무기', 'ja':'サブ武器', 'zh':'副武器', },
    'autoswap-mainweapon':{ 'en':'Main Weapon', 'ko':'주 무기', 'ja':'メイン武器', 'zh':'主武器', },
    'autoswap-subweapon-listen':{ 'en':'Listen', 'ko':'리스닝', 'ja':'リスニング', 'zh':'监听', },
    'autoswap-mainweapon-listen':{ 'en':'Listen', 'ko':'리스닝', 'ja':'リスニング', 'zh':'监听', },
    'autoswap-main-keybind':{ 'en':'Main Weapon Keybind', 'ko':'주 무기 단축키', 'ja':'メイン武器キーバインド', 'zh':'主武器键绑定', },
    'autoswap-sub-keybind':{ 'en':'Sub Weapon Keybind', 'ko':'보조 무기 단축키', 'ja':'サブ武器キーバインド', 'zh':'副武器键绑定', },
    'autoswap-zoom-keybind':{ 'en':'Zoom Keybind', 'ko':'줌 단축키', 'ja':'ズームキーバインド', 'zh':'缩放键绑定', },
    'autoswap-use-zoom':{ 'en':'Use Zoom', 'ko':'줌 사용', 'ja':'ズーム使用', 'zh':'使用缩放', },
    'blackhole':{ 'en':'Blackhole', 'ko':'블랙홀', 'ja':'ブラックホール', 'zh':'黑洞', },
    'blackhole-target':{ 'en':'Blackhole Target', 'ko':'블랙홀 타겟', 'ja':'ブラックホールターゲット', 'zh':'黑洞目标', },
    'crosshair':{ 'en':'Crosshair', 'ko':'조준선', 'ja':'クロスヘア', 'zh':'准星', },
    'position':{ 'en':'Position', 'ko':'위치', 'ja':'位置', 'zh':'位置', },
    'blackhole-distance':{ 'en':'Blackhole Distance', 'ko':'블랙홀 거리', 'ja':'ブラックホール距離', 'zh':'黑洞距离', },
    'blackhole-position':{ 'en':'Blackhole Position', 'ko':'블랙홀 위치', 'ja':'ブラックホール位置', 'zh':'黑洞位置', },
    'blackhole-ignore':{ 'en':'Ignore Marked', 'ko':'마킹 무시', 'ja':'マークを無視', 'zh':'忽略标记', },
    'blackhole-ignore-team':{ 'en':'Ignore Team', 'ko':'팀 무시', 'ja':'チームを無視', 'zh':'忽略团队', },
    'blackhole-ignore-death':{ 'en':'Ignore Death', 'ko':'시체 무시', 'ja':'死を無視', 'zh':'忽略死亡', },
    'blackhole-prevent-lagger':{ 'en':'Prevent Lagger', 'ko': '고의지연 방지', 'ja': '意図的な遅延防止', 'zh': '防止故意延迟', },
    'blackhole-force-drop':{ 'en':'Force Drop', 'ko':'강제 드랍', 'ja':'強制ドロップ', 'zh':'强制下降', },
    'shoot-speed':{ 'en':'Shoot Speed', 'ko':'발사 속도', 'ja':'シュート速度', 'zh':'射击速度', },
    'no-recoil':{ 'en':'No Recoil', 'ko':'무반동', 'ja':'リコイルなし', 'zh':'无后座力', },
    'no-spread':{ 'en':'No Spread', 'ko':'탄퍼짐 없음', 'ja':'スプレッドなし', 'zh':'无散布', },
    'infinite-ammo':{ 'en':'Infinite Ammo', 'ko':'무한 총알', 'ja':'無限弾薬', 'zh':'无限弹药', },
    'no-reload':{ 'en':'No Reload', 'ko':'재장전 없음', 'ja':'リロードなし', 'zh':'无需重新加载', },
    'no-timer':{ 'en':'No Timer', 'ko':'타이머 제거', 'ja':'タイマーなし', 'zh':'无计时器', },
    'no-timer-reload':{ 'en':'No Timer Reload', 'ko':'재장전 타이머 제거', 'ja':'リロードタイマーなし', 'zh':'无重新加载计时器', },
    'no-timer-grenade':{ 'en':'No Timer Grenade', 'ko':'수류탄 타이머 제거', 'ja':'グレネードタイマーなし', 'zh':'无手榴弹计时器', },
    'no-timer-respawn':{ 'en':'No Timer Respawn', 'ko':'부활 타이머 제거', 'ja':'リスポーンタイマーなし', 'zh':'无重生计时器', },
    'skill-cooldown':{ 'en':'Skill Cooldown', 'ko':'스킬 쿨타임', 'ja':'スキルクールダウン', 'zh':'技能冷却', },
    'instant-respawn':{ 'en':'Instant Respawn', 'ko':'즉시 부활', 'ja':'即時リスポーン', 'zh':'即时重生', },
    'no-clip':{ 'en':'No Clip', 'ko':'노클립', 'ja':'壁通過', 'zh':'无剪辑', },
    'move-speed':{ 'en':'Move Speed', 'ko':'이동 속도', 'ja':'移動速度', 'zh':'移动速度', },
    'move-speed-value':{ 'en':'Move Speed Value', 'ko':'이동 속도 값', 'ja':'移動速度値', 'zh':'移动速度值', },
    'fly':{ 'en':'Fly', 'ko':'플라이', 'ja':'フライ', 'zh':'飞行', },
    'fly-up-keybind':{ 'en':'Fly Up Keybind', 'ko':'플라이 업 단축키', 'ja':'フライアップキーバインド', 'zh':'飞行上键绑定', },
    'fly-down-keybind':{ 'en':'Fly Down Keybind', 'ko':'플라이 다운 단축키', 'ja':'フライダウンキーバインド', 'zh':'飞行下键绑定', },
    'fly-speed':{ 'en':'Fly Speed', 'ko':'플라이 속도', 'ja':'フライ速度', 'zh':'飞行速度', },
    'infinite-jump':{ 'en':'Infinite Jump', 'ko':'무한 점프', 'ja':'無限ジャンプ', 'zh':'无限跳跃', },
    'infinite-jump-keybind':{ 'en':'Infinite Jump Keybind', 'ko':'무한 점프 단축키', 'ja':'無限ジャンプキーバインド', 'zh':'无限跳跃键绑定', },
    'one-kill':{ 'en':'One Kill', 'ko':'원 킬', 'ja':'ワンキル', 'zh':'一杀', },
    'skill-damage':{ 'en':'Skill Damage', 'ko':'스킬 데미지', 'ja':'スキルダメージ', 'zh':'技能伤害', },
    'upskill':{ 'en':'Upskill', 'ko':'업스킬', 'ja':'アップスキル', 'zh':'技能升级', },
    'upskill-only-once':{ 'en':'Upskill Only Once', 'ko':'업스킬 일회성', 'ja':'アップスキル一回', 'zh':'技能升级一次', },
    'grenade':{ 'en':'Grenade', 'ko':'수류탄', 'ja':'手榴弾', 'zh':'手榴弹', },
    'anti-hook':{ 'en':'Anti Hook', 'ko':'안티 후크', 'ja':'アンチフック', 'zh':'反钩', },
    'kicker':{ 'en':'Kicker', 'ko':'킥', 'ja':'キッカー', 'zh':'踢', },
    'auto-kick':{ 'en':'Auto Kick', 'ko':'자동 킥', 'ja':'自動キック', 'zh':'自动踢', },
    'auto-kick-ignore':{ 'en':'Auto Kick Ignore Marked', 'ko':'자동 킥 마크 무시', 'ja':'自動キックマーク無視', 'zh':'自动踢忽略标记', },
    'debuff': { 'en':'Debuff', 'ko':'디버프', 'ja':'デバフ', 'zh':'减益效果', },
    'debuff-interval': { 'en':'Debuff Interval', 'ko':'디버프 간격', 'ja':'デバフ間隔', 'zh':'减益效果间隔', },
    'debuff-ignore': { 'en':'Ignore Marked', 'ko':'마크 무시', 'ja':'マーク無視', 'zh':'忽略标记', },
    'debuff-electric': { 'en':'Electric Debuff', 'ko':'일렉 디버프', 'ja':'電気デバフ', 'zh':'电击减益', },
    'debuff-mago': { 'en':'Mago Debuff', 'ko':'마고 디버프', 'ja':'マゴデバフ', 'zh':'马戈减益', },
    'hide-me':{ 'en':'Hide Player', 'ko':'플레이어 숨기기', 'ja':'プレイヤーを隠す', 'zh':'隐藏玩家', },
    'electric':{ 'en':'Electric', 'ko':'일렉', 'ja':'電気', 'zh':'电击', },
    'mago':{ 'en':'Mago', 'ko':'마고', 'ja':'マゴ', 'zh':'马戈', },
    'auto-end':{ 'en':'Auto End', 'ko':'자동 종료', 'ja':'自動終了', 'zh':'自动结束', },
    'auto-end-type':{ 'en':'Auto End Type', 'ko':'자동 종료 타입', 'ja':'自動終了タイプ', 'zh':'自动结束类型', },
    'cooker-buff':{ 'en':'Cooker Buff', 'ko':'쿠커 버프', 'ja':'クッカーバフ', 'zh':'烹饪器BUFF', },
    'changer':{ 'en':'Changer', 'ko':'체인저', 'ja':'チェンジャー', 'zh':'更改器', },
    'reverse':{ 'en':'Reverse', 'ko':'반전', 'ja':'リバース', 'zh':'反转', },
    'reverse-keybind':{ 'en':'Reverse Keybind', 'ko':'반전 단축키', 'ja':'リバースキーバインド', 'zh':'反转键绑定', },
    'skillcode':{ 'en':'Skill Code', 'ko':'스킬 코드', 'ja':'スキルコード', 'zh':'技能代码', },
    'change-NaN':{ 'en':'Change NaN', 'ko':'NaN 변경', 'ja':'NaN変更', 'zh':'更改NaN', },
    'change-ads-reward':{ 'en':'Change Ads Reward', 'ko':'광고 보상 변경', 'ja':'広告報酬変更', 'zh':'更改广告奖励', },
    'match-maker':{ 'en':'Match Maker', 'ko':'매치 메이커', 'ja':'マッチメイカー', 'zh':'匹配器' },
    'match-end':{ 'en':'Match End', 'ko':'매치 종료', 'ja':'マッチ終了', 'zh':'比赛结束' },
    'win':{ 'en':'Win', 'ko':'승리', 'ja':'勝利', 'zh':'胜利' },
    'lose':{ 'en':'Lose', 'ko':'패배', 'ja':'敗北', 'zh':'失败' },
    'draw':{ 'en':'Draw', 'ko':'무승부', 'ja':'引き分け', 'zh':'平局' },
    'milk-win':{ 'en':'Milk Win', 'ko':'밀크 승리', 'ja':'ミルク優勝', 'zh':'牛奶获胜' },
    'choco-win':{ 'en':'Choco Win', 'ko':'초코 승리', 'ja':'チョコレート優勝', 'zh':'巧克力获胜' },
    'resource-hack':{ 'en':'Resource Hack', 'ko':'자원 핵', 'ja':'リソースハック', 'zh':'资源黑客', },
    'dia': { 'en':'Diamond', 'ko':'다이아', 'ja':'ダイヤ', 'zh':'钻石', },
    'gold': { 'en':'Gold', 'ko':'골드', 'ja':'ゴールド', 'zh':'金币', },
    'xp': { 'en':'XP', 'ko':'경험치', 'ja':'経験値', 'zh':'经验值', },
    'clan-xp': { 'en':'Clan XP', 'ko':'클랜 경험치', 'ja':'クラン経験値', 'zh':'公会经验值', },
    'sl-coin': { 'en':'SL Coin', 'ko':'슽리 코인', 'ja':'SLコイン', 'zh':'SL币', },
    'sl-point': { 'en':'SL Point', 'ko':'슽리 포인트', 'ja':'SLポイント', 'zh':'SL点', },
    'receive': { 'en':'Receive', 'ko':'수령', 'ja':'受け取り', 'zh':'接收', },
    'unlock-sl-medal': { 'en':'Unlock SL Medal', 'ko':'슽리 메달 해금', 'ja':'SLメダルロック解除', 'zh':'解锁SL勋章', },
    'unlock-all-item': { 'en':'Unlock All Item', 'ko':'모든 템 해금', 'ja':'すべてのアイテムロック解除', 'zh':'解锁所有项目', },
    'unlock-all-char': { 'en':'Unlock All Character', 'ko':'모든 캐릭 해금', 'ja':'すべてのキャラクターロック解除', 'zh':'解锁所有角色', },
    'buy-clan-gold': { 'en':'Buy Clan Gold', 'ko':'클코 구매', 'ja':'クランゴールド購入', 'zh':'购买公会金币', },
    'get-daily-reward': { 'en':'Get Daily', 'ko':'일일 보상 획득', 'ja':'日日報酬獲得', 'zh':'获取每日奖励', },
    'get-guide-reward': { 'en':'Guide Reward', 'ko':'가이드 보상', 'ja':'ガイド報酬', 'zh':'指南奖励', },
    'ads-reward': { 'en':'AD Reward', 'ko':'광고 보상', 'ja':'広告報酬', 'zh':'广告奖励', },
    'ads-shop-dia': { 'en':'AD Dia', 'ko':'광고 다이아', 'ja':'広告ダイヤ', 'zh':'广告钻石', },
    'ads-shop-gold': { 'en':'AD Gold', 'ko':'광고 골드', 'ja':'広告ゴールド', 'zh':'广告金币', },
    'request-br-reward': { 'en':'BR Reward', 'ko':'배틀로얄 보상', 'ja':'バトルロイヤル報酬', 'zh':'大逃杀奖励', },
    'buy-item': { 'en':'Buy', 'ko':'구매', 'ja':'購入', 'zh':'购买', },
    'repeat-count': { 'en':'Repeat Count', 'ko':'반복 횟수', 'ja':'繰り返し回数', 'zh':'重复次数', },
    'char-id': { 'en':'Character ID', 'ko':'캐릭터 ID', 'ja':'キャラクターID', 'zh':'角色ID', },
    'utilities': { 'en':'Utilities', 'ko':'유틸리티', 'ja':'ユーティリティ', 'zh':'工具', },
    'user-id': { 'en':'User ID', 'ko':'유저 ID', 'ja':'ユーザーID', 'zh':'用户ID', },
    'kick': { 'en':'Kick', 'ko':'킥', 'ja':'キック', 'zh':'踢出', },
    'change': { 'en':'Change', 'ko':'변경', 'ja':'変更', 'zh':'更改', },
    'vip-pass': { 'en':'VIP Pass', 'ko':'VIP 패스', 'ja':'VIPパス', 'zh':'VIP通行证', },
    'hero-pass': { 'en':'Hero Pass', 'ko':'히어로 패스', 'ja':'ヒーローパス', 'zh':'英雄通行证', },
    'purchase': { 'en':'Purchase', 'ko':'구매', 'ja':'購入', 'zh':'购买', },
    'create-clan': { 'en':'Create Clan', 'ko':'클랜 생성', 'ja':'クラン作成', 'zh':'创建公会', },
    'break-clan': { 'en':'Break Clan', 'ko':'클랜 해체', 'ja':'クラン解散', 'zh':'解散公会', },
    'equip-spyra': { 'en':'Equip Spyra', 'ko':'스피라 장착', 'ja':'スパイラ装備', 'zh':'装备斯皮拉', },
    'equip-mh9': { 'en':'Equip MH9', 'ko':'MH9 장착', 'ja':'MH9装備', 'zh':'装备MH9', },
    'clanname': { 'en':'Clan Name', 'ko':'클랜 이름', 'ja':'クラン名', 'zh':'公会名称', },
    'change-nickname': { 'en':'Change Nickname', 'ko':'닉네임 변경', 'ja':'ニックネーム変更', 'zh':'更改昵称', },
    'create': { 'en':'Create', 'ko':'생성', 'ja':'作成', 'zh':'创建', },
    'server-exploit': { 'en':'Exploit Server', 'ko':'서버 폭파', 'ja':'サーバーフォールト', 'zh':'服务器破坏', },
    'claim-supply-1': { 'en':'Claim Supply 1', 'ko':'보급품1 수령', 'ja':'補給品1受取', 'zh':'领取补给1', },
    'claim-supply-2': { 'en':'Claim Supply 2', 'ko':'보급품2 수령', 'ja':'補給品2受取', 'zh':'领取补给2', },
    'ctm':{ 'en':'Capture The Milk', 'ko':'우유 뺏기', 'ja':'ミルクを取る', 'zh':'抢奶', },
    'milk':{ 'en':'Milk', 'ko':'밀크', 'ja':'ミルク', 'zh':'牛奶', },
    'choco':{ 'en':'Choco', 'ko':'초코', 'ja':'チョコ', 'zh':'巧克力', },
    'ctm-default':{ 'en':'Default Map', 'ko':'기본 우뺏', 'ja':'デフォルトマップ', 'zh':'默认地图', },
    'ctm-desert':{ 'en':'Desert Map', 'ko':'사막 우뺏', 'ja':'砂漠マップ', 'zh':'沙漠地图', },
    'ctm-castle':{ 'en':'Castle Map', 'ko':'성 우뺏', 'ja':'城マップ', 'zh':'城堡地图', },
    'ctm-mountain':{ 'en':'Mountain Map', 'ko':'산 우뺏', 'ja':'山マップ', 'zh':'山地图', },
    'deathmatch':{ 'en':'Deathmatch', 'ko':'데스매치', 'ja':'デスマッチ', 'zh':'死亡竞赛', },
    'deathmatch-warning':{ 'en':'⚠ Bot match only', 'ko':'⚠ 봇전에서만 사용하세요', 'ja':'⚠ ボット戦専用', 'zh':'⚠ 仅限机器人战', },
    'deathmatch-start':{ 'en':'Start', 'ko':'시작', 'ja':'開始', 'zh':'开始', },
    'deathmatch-stop':{ 'en':'Stop', 'ko':'정지', 'ja':'停止', 'zh':'停止', },
    'deathmatch-status-label':{ 'en':'Status', 'ko':'상태', 'ja':'状態', 'zh':'状态', },
    'deathmatch-status-running':{ 'en':'Running', 'ko':'작동 중', 'ja':'稼働中', 'zh':'运行中', },
    'deathmatch-status-stopped':{ 'en':'Stopped', 'ko':'정지됨', 'ja':'停止中', 'zh':'已停止', },
    'deathmatch-hotkeys':{ 'en':'Quick Controls', 'ko':'빠른 제어', 'ja':'クイック操作', 'zh':'快捷控制', },
    'deathmatch-hotkey-start':{ 'en':'Start Shortcut', 'ko':'시작 단축키', 'ja':'開始ショートカット', 'zh':'开始快捷键', },
    'deathmatch-hotkey-stop':{ 'en':'Stop Shortcut', 'ko':'정지 단축키', 'ja':'停止ショートカット', 'zh':'停止快捷键', },
    'macro':{ 'en':'Macro', 'ko':'매크로', 'ja':'マクロ', 'zh':'宏', },
    'execute':{ 'en':'Execute', 'ko':'실행', 'ja':'実行', 'zh':'执行', },
    'general':{ 'en':'General', 'ko':'일반', 'ja':'一般', 'zh':'一般', },
    'frame':{ 'en':'Frame', 'ko':'프레임', 'ja':'フレーム', 'zh':'帧', },
    "mobile-controller": { "en": "Mobile Controller", "ko": "모바일 컨트롤러", "ja": "モバイルコントローラ", "zh": "移动控制器" },
    "utility": { "en": "Utility", "ko": "유틸리티", "ja": "ユーティリティ", "zh": "效用" },
    "replay": { "en": "Replay", "ko": "리플레이", "ja": "リプレイ", "zh": "重播" },
    'manager':{ 'en':'Manager', 'ko':'매니저', 'ja':'マネージャ', 'zh':'管理者', },
    'start':{ 'en':'Start', 'ko':'시작', 'ja':'スタート', 'zh':'开始', },
    'stop':{ 'en':'Stop', 'ko':'중지', 'ja':'ストップ', 'zh':'停止', },
    'port':{ 'en':'Port', 'ko':'포트', 'ja':'ポート', 'zh':'端口', },
    "gyro-scope": { "en": "Gyro Scope", "ko": "자이로 스코프", "ja": "ジャイロスコープ", "zh": "陀螺仪" },
    'gyro-scope-use-gamma':{ 'en':'Gyro Scope Use Gamma', 'ko':'자이로 스코프 감마 사용', 'ja':'ジャイロスコープガンマ使用', 'zh':'陀螺仪使用伽马', },
    "gyro-scope-invert":{ "en": "Gyro Scope Invert", "ko": "자이로 스코프 반전", "ja": "ジャイロスコープ反転", "zh": "陀螺仪反转" },
    "gyro-scope-sensitivity": { "en": "Gyro Scope Sensitivity", "ko": "자이로 스코프 감도", "ja": "ジャイロスコープ感度", "zh": "陀螺仪灵敏度" },
    'search-player':{ 'en':'Search Player', 'ko':'플레이어 검색', 'ja':'プレイヤー検索', 'zh':'搜索玩家', },
    'cheat-settings':{ 'en':'Presets', 'ko':'프리셋', 'ja':'プリセット', 'zh':'预设', },
    // info start
    'info-aimbot':{ 'en':'Auto-aim at enemies', 'ko':'적에게 자동 조준', 'ja':'敵に自動照準', 'zh':'自动瞄准敌人', },
    'info-aim-assist':{ 'en':'Auto-aim while shooting', 'ko':'사격 시 적에게 자동 조준', 'ja':'射撃中に自動照準', 'zh':'射击时自动瞄准', },
    'info-esp':{ 'en':'See enemy positions through walls', 'ko':'벽 너머 적 위치 표시', 'ja':'壁越しに敵の位置を表示', 'zh':'透视墙壁显示敌人位置', },
    'info-blackhole':{ 'en':'Pull enemies to a single point', 'ko':'적을 한 지점으로 끌어모음', 'ja':'敵を一点に引き寄せる', 'zh':'将敌人拉到一个点', },
    'info-shoot-speed':{ 'en':'Increase firing rate', 'ko':'발사 속도 증가', 'ja':'発射速度を上げる', 'zh':'提高射击速度', },
    'info-no-recoil':{ 'en':'Remove weapon recoil', 'ko':'무기 반동 제거', 'ja':'武器の反動を除去', 'zh':'消除武器后座力', },
    'info-no-spread':{ 'en':'Remove bullet spread', 'ko':'탄 퍼짐 제거', 'ja':'弾の拡散を除去', 'zh':'消除子弹散布', },
    'no-spread-moving':{ 'en':'Moving', 'ko':'이동', 'ja':'移動中', 'zh':'移动', },
    'no-spread-shooting':{ 'en':'Shooting', 'ko':'사격', 'ja':'射撃中', 'zh':'射击', },
    'no-spread-idle':{ 'en':'Idle', 'ko':'대기', 'ja':'待機中', 'zh':'待机', },
    'no-spread-jump':{ 'en':'Jump', 'ko':'점프', 'ja':'ジャンプ中', 'zh':'跳跃', },
    'info-infinite-ammo':{ 'en':'Unlimited ammunition', 'ko':'무제한 탄약', 'ja':'無制限の弾薬', 'zh':'无限弹药', },
    'info-no-timer':{ 'en':'Remove reload/grenade/respawn timers', 'ko':'재장전/수류탄/부활 타이머 제거', 'ja':'リロード/グレネード/リスポーンタイマー除去', 'zh':'移除装弹/手雷/重生计时器', },
    'info-skill-cooldown':{ 'en':'Warning : this feature can potentially ban your account. disabled for safety issues', 'ko':'경고 : 이 기능은 계정을 차단할 수 있습니다. 안전상의 문제로 인해 비활성화되었습니다.', 'ja':'警告 : この機能はアカウントを禁止する可能性があります。安全上の問題で無効化されています。', 'zh':'警告：此功能可能导致您的账户被封禁。出于安全考虑已禁用。', },
    'info-no-clip':{ 'en':'Walk through walls', 'ko':'벽 통과', 'ja':'壁をすり抜ける', 'zh':'穿墙', },
    'info-fly':{ 'en':'Fly freely in any direction', 'ko':'자유 비행', 'ja':'自由に飛行', 'zh':'自由飞行', },
    'info-move-speed':{ 'en':'Change movement speed', 'ko':'이동 속도 변경', 'ja':'移動速度を変更', 'zh':'更改移动速度', },
    'info-infinite-jump':{ 'en':'Jump unlimited times in air', 'ko':'공중에서 무한 점프', 'ja':'空中で無限ジャンプ', 'zh':'空中无限跳跃', },
    'info-upskill':{ 'en':'Boost skill power', 'ko':'스킬 위력 강화', 'ja':'スキルパワー強化', 'zh':'提升技能威力', },
    'info-grenade':{ 'en':'Instant grenade throw', 'ko':'즉시 수류탄 투척', 'ja':'即時グレネード投擲', 'zh':'即时投掷手雷', },
    'info-anti-hook':{ 'en':'Prevent hook-based detection', 'ko':'후크 기반 탐지 방지', 'ja':'フックベースの検出を防止', 'zh':'防止钩子检测', },
    'info-kicker':{ 'en':'Kick players from the match', 'ko':'플레이어를 매치에서 킥', 'ja':'プレイヤーをマッチからキック', 'zh':'将玩家踢出比赛', },
    'info-one-kill':{ 'en':'Kill enemies in one hit', 'ko':'적을 한 방에 처치', 'ja':'敵を一撃で倒す', 'zh':'一击杀敌', },
    'info-skill-damage':{ 'en':'Increase skill damage', 'ko':'스킬 데미지 증가', 'ja':'スキルダメージ増加', 'zh':'增加技能伤害', },
    'info-debuff':{ 'en':'Apply debuffs to enemies', 'ko':'적에게 디버프 적용', 'ja':'敵にデバフを付与', 'zh':'对敌人施加减益', },
    'info-electric':{ 'en':'Apply electric effect to enemies', 'ko':'적에게 전기 효과 적용', 'ja':'敵に電気効果を付与', 'zh':'对敌人施加电击效果', },
    'info-mago':{ 'en':'Apply mago effect to enemies', 'ko':'적에게 마고 효과 적용', 'ja':'敵にマゴ効果を付与', 'zh':'对敌人施加马戈效果', },
    'info-hide-me':{ 'en':'Make yourself invisible to others', 'ko':'다른 플레이어에게 투명화', 'ja':'他のプレイヤーから透明化', 'zh':'对其他玩家隐身', },
    'info-changer':{ 'en':'Modify position, skill code, etc.', 'ko':'위치, 스킬코드 등 변경', 'ja':'位置、スキルコードなどを変更', 'zh':'修改位置、技能代码等', },
    'info-resource-hack':{ 'en':'Obtain resources and rewards', 'ko':'자원 및 보상 획득', 'ja':'リソースと報酬を取得', 'zh':'获取资源和奖励', },
    'info-utilities':{ 'en':'Nickname, clan, item utilities (some may not work)', 'ko':'닉네임, 클랜, 아이템 유틸 (일부 작동 안함)', 'ja':'ニックネーム、クラン、アイテムユーティリティ (一部動作しない)', 'zh':'昵称、公会、物品工具 (部分功能可能无法使用)', },
    'info-cheat-settings':{ 'en':'Save/load cheat presets', 'ko':'치트 프리셋 저장/불러오기', 'ja':'チートプリセットの保存/読み込み', 'zh':'保存/加载作弊预设', },
    'preset-name':{ 'en':'Preset Name', 'ko':'프리셋 이름', 'ja':'プリセット名', 'zh':'预设名称', },
    'preset-save':{ 'en':'Save', 'ko':'저장', 'ja':'保存', 'zh':'保存', },
    'preset-load':{ 'en':'Load', 'ko':'불러오기', 'ja':'読み込み', 'zh':'加载', },
    'preset-delete':{ 'en':'Delete', 'ko':'삭제', 'ja':'削除', 'zh':'删除', },
    'preset-export':{ 'en':'Export', 'ko':'내보내기', 'ja':'エクスポート', 'zh':'导出', },
    'preset-import':{ 'en':'Import', 'ko':'가져오기', 'ja':'インポート', 'zh':'导入', },
    'cheat-reset-all':{ 'en':'Reset All', 'ko':'전체 초기화', 'ja':'全てリセット', 'zh':'全部重置', },
    'exp-boost':{ 'en':'EXP Boost (doesn\'t work)', 'ko':'경험치 부스트 (작동 안함)', 'ja':'経験値ブースト(動作しない)', 'zh':'经验值加成(不工作)', },
    'exp-boost-multiplier':{ 'en':'Multiplier', 'ko':'배율', 'ja':'倍率', 'zh':'倍率', },
    'info-exp-boost':{ 'en':'Multiply EXP gain (1-31x)', 'ko':'경험치 획득량 증가 (1-31배)', 'ja':'経験値獲得量増加（1-31倍）', 'zh':'增加经验值获取量（1-31倍）', },
}

function lng(la:string, str:string):string{
    return lan[str] ? lan[str][la] : str;
}

function keyOf(str: string): IGlobalKey {
    if (keymap[str]) return keymap[str];
    else return ""
}

const log = (...args: any[]) => send("log", args);

let attached:boolean = false;
let cheats:{[key:string]:boolean} = {};

// load local storage
let keybinds:{[key:string]:string} = {};
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

let config:{[key:string]:any} = {};
$$_('.config').forEach((el:HTMLElement) => {
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

// world player data
let wpdata:{[key:string]:WPData} = {};
let wps = localStorage.getItem('wpdata');
if(wps) wpdata = JSON.parse(wps);
else localStorage.setItem('wpdata', JSON.stringify(wpdata));
listen("clear-wpdata", () => {
    wpdata = {};
    localStorage.setItem('wpdata', JSON.stringify(wpdata));
});
listen('wp-data', (_wpdata:{[key:string]:WPData}) => {
    wpdata = _wpdata;
    localStorage.setItem('wpdata', JSON.stringify(wpdata));
});

// mobile controller
$_('mobile-controller').classList.toggle('hide', !config['plugin-server-mobile-controller']);
const toggleCheat = (e:Event) => {
    const _tar = e.currentTarget as HTMLInputElement;
    const [key, val] = [_tar.id.split('toggle-')[1], _tar.checked];
    cheats[key] = val;
    send('cheats', key, val);
}
// macros
let macros:any[] = [];
let ms = localStorage.getItem('macros');
// macros loaded from localStorage only (no MongoDB)
listen('macros', (_macros:any[]) => {
    macros = _macros;
    localStorage.setItem('macros', JSON.stringify(macros));
    const list = $_('macro-list');
    list.innerHTML = '';
    for(const macro of macros){
        const _id = macro.id;
        const el = document.createElement('main');
        el.id = _id;
        el.innerHTML = `
            <main id="${_id}">
                <div data-lang="${_id}" class="w-full"></div>
                <input type="text" id="key-${_id}" class="keybind" data-lang-ph="keybind">
                <button class="w-48 macro-button" id="${_id}" data-lang="execute"></button>
            </main>
        `;
        const button = el.querySelector('button');
        button.addEventListener('click', () => {
            send('execute-macro', _id);
        });
        list.appendChild(el);
    }
});
// language
let lang:string = localStorage.getItem('lang') || 'en';
localStorage.setItem('lang', lang);

let deathmatchState:DeathmatchState = 'stopped';
const renderDeathmatchState = () => {
    const indicator = $_('deathmatch-status-indicator');
    const label = $_('deathmatch-status-text');
    const startBtn = $_('deathmatch-start') as HTMLButtonElement | null;
    const stopBtn = $_('deathmatch-stop') as HTMLButtonElement | null;
    const stateKey = deathmatchState === 'running' ? 'deathmatch-status-running' : 'deathmatch-status-stopped';
    if(indicator) indicator.setAttribute('data-state', deathmatchState);
    if(label) label.textContent = lng(lang, stateKey);
    if(startBtn) startBtn.disabled = deathmatchState === 'running';
    if(stopBtn) stopBtn.disabled = deathmatchState !== 'running';
};
const setDeathmatchState = (state:DeathmatchState) => {
    deathmatchState = state;
    renderDeathmatchState();
};

const updateLang = () => {
    $$_('.toggle').forEach((el:HTMLInputElement) => {
        el.removeEventListener('change', toggleCheat);
    });
    send('lang', lang);
    $$_('*[data-lang-ph]').forEach((el:HTMLInputElement) => {
        el.placeholder = lng(lang, el.getAttribute('data-lang-ph'));
    });
    $$_('*[data-lang-v]').forEach((el:HTMLInputElement) => {
        el.value = lng(lang, el.getAttribute('data-lang-v'));
    });
    $$_('*[data-lang]').forEach((el:HTMLElement) => {
        if(el.tagName === "SUMMARY" && el.id) {
            const cheatId = el.getAttribute('data-lang');
            const infoKey = `info-${cheatId}`;
            const infoText = lan[infoKey] ? lng(lang, infoKey) : '';
            el.innerHTML = `
                <input type="checkbox" class="toggle" id="toggle-${el.id}">
                <p>${lng(lang, cheatId)}</p>
                ${infoText ? `<span class="info-icon" data-tooltip="${infoText}">i</span>` : ''}
            `;
        } else if(el.tagName === "SUMMARY" && !el.id) {
            const cheatId = el.getAttribute('data-lang');
            const infoKey = `info-${cheatId}`;
            const infoText = lan[infoKey] ? lng(lang, infoKey) : '';
            el.innerHTML = `
                ${lng(lang, cheatId)}
                ${infoText ? `<span class="info-icon" data-tooltip="${infoText}">i</span>` : ''}
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
    renderDeathmatchState();
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
        send('keybind', keyName, keyCode);
    };
})

// config events
$$_('.config').forEach((el:HTMLElement) => {
    if(el.tagName === 'BUTTON'){
        el.addEventListener('click', () => {
            el.classList.toggle('selected');
            config[el.id] = el.classList.contains('selected');
            localStorage.setItem('config', JSON.stringify(config));
            send('config', el.id, config[el.id]);
        });
    } else if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        el.addEventListener('change', () => {
            const _el = el as HTMLInputElement;
            if(_el.id === 'plugin-server-mobile-controller') $_('mobile-controller').classList.toggle('hide', !_el.checked);
            config[_el.id] = _el.type === 'checkbox' ? _el.checked : _el.value;
            localStorage.setItem('config', JSON.stringify(config));
            send('config', el.id, config[el.id]);
        });
    }
});
const bounds = localStorage.getItem('layout');
send('init', keybinds, config, wpdata, bounds ? JSON.parse(bounds) : null);

// Auto-update check
function showApp() {
    $_('login').classList.add('hide');
    $_('app').classList.remove('hide');
    $_('selector-dev-mode').classList.remove('hide');
    $_('selector-console').classList.remove('hide');
    $_('selector-finder').classList.remove('hide');
}
(async () => {
    try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (update) {
            $_('updp').textContent = `${lan['updating-to'][lang]} v${update.version}...`;
            $_('updbar').classList.remove('hide');
            let total = 0, downloaded = 0;
            await update.downloadAndInstall((event) => {
                if (event.event === 'Started') {
                    total = event.data.contentLength || 0;
                } else if (event.event === 'Progress') {
                    downloaded += event.data.chunkLength;
                    if (total > 0) {
                        ($_('updprg') as HTMLElement).style.width = `${Math.round((downloaded / total) * 100)}%`;
                    }
                } else if (event.event === 'Finished') {
                    ($_('updprg') as HTMLElement).style.width = '100%';
                }
            });
            const { relaunch } = await import('@tauri-apps/plugin-process');
            await relaunch();
            return;
        }
    } catch (e) {
        console.warn('Update check failed:', e);
    }
    // Auth check
    $_('updp').textContent = lng(lang, 'authenticating');
    send('auth-verify');
})();

// Auth flow
listen('auth-status', (result: { ok: boolean; error?: string }) => {
    if (result.ok) {
        showApp();
    } else {
        $_('updp').textContent = lng(lang, 'auth-failed');
        $_('logform').classList.remove('hide');
        $_('logerr').textContent = result.error || '';
        $_('logbtn').removeAttribute('disabled');
    }
});

$_('logbtn').addEventListener('click', () => {
    const key = ($i('key') as HTMLInputElement).value.trim();
    if (!key) return;
    $_('logerr').textContent = '';
    $_('logbtn').setAttribute('disabled', 'true');
    $_('updp').textContent = lng(lang, 'authenticating');
    send('auth-activate', key);
});

$_('key').addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') $_('logbtn').click();
});

listen('update-state', (id:string, _state:string, log:string) => {
    const el = $_(`state-${id}`);
    const elog = $_(`state-${id}-log`);
    if(el) el.classList.remove('active', 'error', 'pending', 'succeed', 'clear', 'null');
    if(el) el.classList.add(_state);
    if(elog) elog.textContent = log;
});
listen('cookie', (cookie:string) => {
    $i('cookie').value = cookie;
});

send('serial', $i('serial').value);
$i('serial').addEventListener('change', () => {send('serial', $i('serial').value);});
$i('cookie').addEventListener('change', () => {send('cookie', $i('cookie').value);});

$_('connect-adb').addEventListener('click', () => {send('connect-adb', $i('serial').value, true);});
$_('connect-serial').addEventListener('click', () => {send('connect-adb', $i('serial').value, false);});
$_('start-server').addEventListener('click', () => {send('start-server');});
$_('download-server').addEventListener('click', () => {send('download-server');});
// Upload server: use Tauri dialog plugin via internals
$_('upload-server').addEventListener('click', async () => {
    try {
        // Use Tauri plugin-dialog via invoke
        const selected = await tauriInvoke('plugin:dialog|open', {
            multiple: false,
            filters: [{ name: 'Frida Server', extensions: ['*'] }]
        });
        if (selected) {
            send('upload-server', typeof selected === 'string' ? selected : (selected as any).path);
        }
    } catch (e) {
        console.error('File dialog error:', e);
    }
});
$_('connect-frida').addEventListener('click', () => {send('connect-frida', $i('serial').value);});
$_('get-cookie').addEventListener('click', () => {send('get-cookie');});
$_('start-agent').addEventListener('click', () => {send('start-agent');});

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

listen('init', (_b:boolean) => {
    attached = _b;
    $$_('.toggle').forEach((el:HTMLInputElement) => {
        el.disabled = !attached;
        if(!_b){
            el.checked = _b;
        }
    });
    $$_('.attached').forEach((el:HTMLButtonElement) => {
        el.disabled = !attached;
    })
})

const xel = $i('pos-x');
const yel = $i('pos-y');
const zel = $i('pos-z');
const sel = $i('skillcode');

$_('pos-reverse').addEventListener('click', () => {
    send('reverse');
});

listen('pos', (pos:number[]) => {
    const [x, y, z] = pos;
    xel.value = x.toFixed(2);
    yel.value = y.toFixed(2);
    zel.value = z.toFixed(2);
})

listen('skillcode', (code:number) => {
    sel.value = code.toString();
})

listen('deathmatch', (state:'started'|'stopped') => {
    setDeathmatchState(state === 'started' ? 'running' : 'stopped');
});

$_('change-NaN').addEventListener('click', () => {send('change-NaN');});

const blurCurrent = () => {(document.activeElement as HTMLInputElement).blur();}
const changePosition = () => {send('pos', [parseFloat(xel.value || "0"), parseFloat(yel.value || "0"), parseFloat(zel.value || "0")]);}

xel.addEventListener('input', changePosition);
yel.addEventListener('input', changePosition);
zel.addEventListener('input', changePosition);
sel.addEventListener('input', () => {send('skillcode', parseInt(sel.value || "0"));});
xel.addEventListener('change', blurCurrent);
yel.addEventListener('change', blurCurrent);
zel.addEventListener('change', blurCurrent);
sel.addEventListener('change', blurCurrent);

// $_('match-win').addEventListener('click', () => {send('match-win');});
// $_('match-lose').addEventListener('click', () => {send('match-lose');});
// $_('match-draw').addEventListener('click', () => {send('match-draw');});
// $_('match-milk').addEventListener('click', () => {send('match-milk');});
// $_('match-choco').addEventListener('click', () => {send('match-choco');});
// $_('receive-dia').addEventListener('click', () => {send('receive-dia', parseInt($i('resource-hack-dia').value) || 0);});
// $_('receive-gold').addEventListener('click', () => {send('receive-gold', parseInt($i('resource-hack-gold').value) || 0);});
// $_('receive-xp').addEventListener('click', () => {send('receive-xp', parseInt($i('resource-hack-xp').value) || 0);});
// $_('receive-clan-xp').addEventListener('click', () => {send('receive-clan-xp', parseInt($i('resource-hack-clan-xp').value) || 0);});
// $_('receive-sl-coin').addEventListener('click', () => {send('receive-sl-coin', parseInt($i('resource-hack-sl-coin').value) || 0);});
// $_('receive-sl-point').addEventListener('click', () => {send('receive-sl-point', parseInt($i('resource-hack-sl-point').value) || 0);});
// $_('unlock-sl-medal').addEventListener('click', () => {send('unlock-sl-medal');});
// $_('unlock-all-item').addEventListener('click', () => {send('unlock-all-item', parseInt($i('unlock-all-item-char-id').value) || 0);});
// $_('unlock-all-char').addEventListener('click', () => {send('unlock-all-char');});
$_('get-daily-reward').addEventListener('click', () => {send('get-daily-reward', parseInt($i('get-daily-reward-repeat').value) || 1);});
$_('get-guide-reward').addEventListener('click', () => {send('get-guide-reward');});
$_('ads-reward').addEventListener('click', () => {send('ads-reward');});
$_('ads-shop-dia').addEventListener('click', () => {send('ads-shop-dia');});
$_('ads-shop-gold').addEventListener('click', () => {send('ads-shop-gold');});
$_('request-br-reward').addEventListener('click', () => {send('request-br-reward');});

$_('kick-player').addEventListener('click', () => {send('kick-player', parseInt($i('kick-player-number').value) || 0);});
$_('change-nickname').addEventListener('click', () => {send('change-nickname', $i('nickname-value').value || '');});
$_('purchase-pass').addEventListener('click', () => {send('purchase-pass', parseInt($i('purchase-player-number').value) || 0, parseInt($i('purchase-item').value) || 1);});
$_('create-clan').addEventListener('click', () => {send('create-clan', $i('clanname-value').value || '');});
$_('break-clan').addEventListener('click', () => {send('break-clan');});
$_('buy-clan-gold').addEventListener('click', () => {send('buy-clan-gold', parseInt($i('buy-clan-gold-repeat').value) || 1);});
// equip
$_('equip-spyra').addEventListener('click', () => {send('equip-item', parseInt($i('equip-char-number').value) || 1, 0, 24);});
$_('equip-mh9').addEventListener('click', () => {send('equip-item', parseInt($i('equip-char-number').value) || 1, 1, 15);});
$_('claim-supply-1').addEventListener('click', () => {send('claim-supply', 1, 30);});
$_('claim-supply-2').addEventListener('click', () => {send('claim-supply', 2, 30);});
$_('ctm-default-milk').addEventListener('click', () => {send('ctm-default-milk');});
$_('ctm-default-choco').addEventListener('click', () => {send('ctm-default-choco');});
$_('ctm-desert-milk').addEventListener('click', () => {send('ctm-desert-milk');});
$_('ctm-desert-choco').addEventListener('click', () => {send('ctm-desert-choco');});
$_('ctm-castle-milk').addEventListener('click', () => {send('ctm-castle-milk');});
$_('ctm-castle-choco').addEventListener('click', () => {send('ctm-castle-choco');});
$_('ctm-mountain-milk').addEventListener('click', () => {send('ctm-mountain-milk');});
$_('ctm-mountain-choco').addEventListener('click', () => {send('ctm-mountain-choco');});
$_('deathmatch-start').addEventListener('click', () => {send('deathmatch-start');});
$_('deathmatch-stop').addEventListener('click', () => {send('deathmatch-stop');});

updateExceptNumber();
$_('except-number').addEventListener('change', updateExceptNumber);

function updateExceptNumber(){
    const val = $i('except-number').value.split(',')
    .filter(v => v)
    .map((v:string) => parseInt(v) || 0)
    .filter(v => v);
    send('except-number', val);
}

listen('except-number', (val:number[]) => {
    $i('except-number').value = val.join(',');
    $i('except-number').dispatchEvent(new Event('change'));
})

// Layout control via Tauri commands
$_('show-layout').addEventListener('change', async () => {
    const show = $i('show-layout').checked;
    if (show) {
        const saved = localStorage.getItem('layout');
        if (saved) {
            await tauriInvoke('restore_layout_bounds', { bounds: JSON.parse(saved) });
        }
    }
    tauriInvoke('show_layout', { show });
});
$_('lock-layout').addEventListener('change', () => {
    tauriInvoke('lock_layout', { lock: $i('lock-layout').checked });
});
$_('reset-layout').addEventListener('click', async () => {
    const bounds = { x: 0, y: 0, width: 800, height: 600 };
    await tauriInvoke('restore_layout_bounds', { bounds });
    localStorage.setItem('layout', JSON.stringify(bounds));
});

// Periodically save layout bounds (only when visible)
setInterval(async () => {
    if (!$i('show-layout').checked) return;
    try {
        const bounds = await tauriInvoke('resize_layout');
        if (bounds) localStorage.setItem('layout', JSON.stringify(bounds));
    } catch {}
}, 5000);

listen('listen-sub', ([x, y]: [number, number]) => {
    $_('listen-sub').classList.toggle('listening', false);
    $i('autoswap-subweapon-x').value = x.toString();
    $i('autoswap-subweapon-x').dispatchEvent(new Event('change'));
    $i('autoswap-subweapon-y').value = y.toString();
    $i('autoswap-subweapon-y').dispatchEvent(new Event('change'));
});
listen('listen-main', ([x, y]: [number, number]) => {
    $_('listen-main').classList.toggle('listening', false);
    $i('autoswap-mainweapon-x').value = x.toString();
    $i('autoswap-mainweapon-x').dispatchEvent(new Event('change'));
    $i('autoswap-mainweapon-y').value = y.toString();
    $i('autoswap-mainweapon-y').dispatchEvent(new Event('change'));
});

$_('get-ranges').addEventListener('click', () => {send('get-ranges', $i('base').value);});
$_('find-ranges').addEventListener('click', () => {send('find-ranges', $i('base').value);});
$_('search-pattern').addEventListener('click', () => {send('search-pattern', $i('pattern').value);});
$_('execute-cmd').addEventListener('click', () => {send('execute-cmd', $i('cmd').value);});

$_('server-start').addEventListener('click', () => {send('server-start', +$i('server-port').value || 3000);});
$_('server-stop').addEventListener('click', () => {send('server-stop');});

// Developer tools initialization (perf toggle and output)
initDevTools();

// console
listen('log', (...args:any[]) => {
    console.log(...args);
    const line = document.createElement('p');
    line.textContent = args.map(v => {
        if(typeof v === 'string') return v;
        if(typeof v === 'number') return v.toString();
        if(typeof v === 'boolean') return v.toString();
        return JSON.stringify(v);
    }).join(' ');
    $_('console-out').appendChild(line);
    $_('console-out').scrollTo({top: $_('console-out').scrollHeight});
});

$i('console-input').addEventListener('keydown', (e:KeyboardEvent) => {
    if(e.key === 'Enter'){
        send('console-cmd', $i('console-input').value);
        $i('console-input').value = '';
    }
});


$i('search-wp').addEventListener('keydown', (e:KeyboardEvent) => {
    if(e.key === 'Enter'){
        if($i('search-wp').value){
            $_('finder-out').innerHTML = 'searching...';
            send('search-wp', $i('search-wp').value, $i('search-wp-type').value);
        }
    }
});
listen('search-wp', (wps:(WPData&{id:number})[]) => {
    const finderOut = $_('finder-out');
    finderOut.innerHTML = '';
    if(wps.length === 0){
        finderOut.textContent = 'No results';
        return;
    }
    wps.forEach(wp => {
        const wpOut = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = `[${wp.id}] ${wp.nicks.sort((a, b) => b.date - a.date)[0].nick}`;
        wpOut.appendChild(summary);
        const nicksDiv = document.createElement('div');
        nicksDiv.classList.add('nicks');
        wp.nicks.forEach(nick => {
            const nickDiv = document.createElement('div');
            nickDiv.textContent = `${nick.nick} (${new Date(nick.date).toLocaleString()})`;
            nicksDiv.appendChild(nickDiv);
        });
        wpOut.appendChild(nicksDiv);
        Object.keys(wp.chars).forEach(char => {
            const charWp = wp.chars[char];
            const charDiv = document.createElement('div');
            charDiv.textContent = `${char}: ${charWp.exp}XP ${charWp.totalkill}K ${charWp.totaldeath}D ${charWp.totalassist}A`;
            wpOut.appendChild(charDiv);
        });
        finderOut.appendChild(wpOut);
    });
});

// Cheat settings: presets
type Preset = { config: {[key:string]:any}, keybinds: {[key:string]:string}, cheats: {[key:string]:boolean} };
let presets:{[name:string]:Preset} = {};
const presetStore = localStorage.getItem('presets');
if(presetStore) presets = JSON.parse(presetStore);

function updatePresetList(){
    const sel = $_('preset-list') as HTMLSelectElement;
    sel.innerHTML = '';
    for(const name of Object.keys(presets)){
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
    }
}
updatePresetList();

$_('preset-save').addEventListener('click', () => {
    const name = $i('preset-name').value.trim();
    if(!name) return;
    presets[name] = {
        config: {...config},
        keybinds: {...keybinds},
        cheats: {...cheats},
    };
    localStorage.setItem('presets', JSON.stringify(presets));
    updatePresetList();
    ($_ ('preset-list') as HTMLSelectElement).value = name;
});

$_('preset-load').addEventListener('click', () => {
    const sel = $_('preset-list') as HTMLSelectElement;
    const name = sel.value;
    if(!name || !presets[name]) return;
    const preset = presets[name];
    // restore config
    for(const key in preset.config){
        config[key] = preset.config[key];
        const el = $_(key);
        if(!el) continue;
        if(el.tagName === 'BUTTON'){
            el.classList.toggle('selected', config[key]);
        } else {
            const _el = el as HTMLInputElement;
            if(_el.type === 'checkbox') _el.checked = config[key];
            else _el.value = config[key];
        }
        send('config', key, config[key]);
    }
    localStorage.setItem('config', JSON.stringify(config));
    // restore keybinds
    for(const key in preset.keybinds){
        keybinds[key] = preset.keybinds[key];
        const el = $i(`key-${key}`);
        if(el) el.value = keybinds[key];
        send('keybind', key, keybinds[key]);
    }
    localStorage.setItem('keybinds', JSON.stringify(keybinds));
    // restore cheats
    for(const key in preset.cheats){
        cheats[key] = preset.cheats[key];
        const toggle = $i(`toggle-${key}`);
        if(toggle) toggle.checked = cheats[key];
        send('cheats', key, cheats[key]);
    }
});

$_('preset-delete').addEventListener('click', () => {
    const sel = $_('preset-list') as HTMLSelectElement;
    const name = sel.value;
    if(!name) return;
    delete presets[name];
    localStorage.setItem('presets', JSON.stringify(presets));
    updatePresetList();
});

$_('preset-export').addEventListener('click', () => {
    const data = JSON.stringify({ config, keybinds, cheats }, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cheat-config.json';
    a.click();
    URL.revokeObjectURL(url);
});

$_('preset-import').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
        const file = input.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result as string);
                if(data.config){
                    for(const key in data.config){
                        config[key] = data.config[key];
                        const el = $_(key);
                        if(!el) continue;
                        if(el.tagName === 'BUTTON') el.classList.toggle('selected', config[key]);
                        else {
                            const _el = el as HTMLInputElement;
                            if(_el.type === 'checkbox') _el.checked = config[key];
                            else _el.value = config[key];
                        }
                        send('config', key, config[key]);
                    }
                    localStorage.setItem('config', JSON.stringify(config));
                }
                if(data.keybinds){
                    for(const key in data.keybinds){
                        keybinds[key] = data.keybinds[key];
                        const el = $i(`key-${key}`);
                        if(el) el.value = keybinds[key];
                        send('keybind', key, keybinds[key]);
                    }
                    localStorage.setItem('keybinds', JSON.stringify(keybinds));
                }
                if(data.cheats){
                    for(const key in data.cheats){
                        cheats[key] = data.cheats[key];
                        const toggle = $i(`toggle-${key}`);
                        if(toggle) toggle.checked = cheats[key];
                        send('cheats', key, cheats[key]);
                    }
                }
            } catch(e){ console.error('Import error:', e); }
        };
        reader.readAsText(file);
    };
    input.click();
});

$_('cheat-reset-all').addEventListener('click', () => {
    // reset all cheats to off
    for(const key in cheats){
        cheats[key] = false;
        const toggle = $i(`toggle-${key}`);
        if(toggle) toggle.checked = false;
        send('cheats', key, false);
    }
    // reset config to defaults
    $$_('.config').forEach((el:HTMLElement) => {
        if(el.tagName === 'BUTTON'){
            el.classList.remove('selected');
            config[el.id] = false;
        } else if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
            const _el = el as HTMLInputElement;
            if(_el.type === 'checkbox'){
                _el.checked = false;
                config[_el.id] = false;
            } else {
                _el.value = _el.defaultValue;
                config[_el.id] = _el.defaultValue;
            }
        }
        send('config', el.id, config[el.id]);
    });
    localStorage.setItem('config', JSON.stringify(config));
    // reset keybinds
    for(const key in keybinds){
        keybinds[key] = '';
        const el = $i(`key-${key}`);
        if(el) el.value = '';
        send('keybind', key, '');
    }
    localStorage.setItem('keybinds', JSON.stringify(keybinds));
});

// Connect to WebSocket sidecar
async function initConnection() {
    try {
        const port = await tauriInvoke('get_ws_port');
        // Retry connection with backoff since sidecar may take a moment to start
        let retries = 0;
        const tryConnect = async () => {
            try {
                await connect(port);
                console.log(`Connected to sidecar on port ${port}`);
                // Re-send init data after connection
                send('init', keybinds, config, wpdata, bounds ? JSON.parse(bounds) : null);
                send('serial', $i('serial').value);
            } catch (e) {
                if (retries < 10) {
                    retries++;
                    setTimeout(tryConnect, 500 * retries);
                } else {
                    console.error('Failed to connect to sidecar after retries');
                }
            }
        };
        await tryConnect();
    } catch (e) {
        console.error('Failed to get WS port:', e);
    }
}

initConnection();
