
interface Token{
    code: string;
    type: string;
    using: boolean;
    expiration: number;
    created: number;
    tier: number;
    perms: string[];
    userid: string;
}

type Cheats = {[key:string]:boolean}
type Config = {[key:string]:any}
type Keybinds = {[key:string]:string}

interface Point{
    x:number;
    y:number;
}

interface DrawRect{
    upside:Point[];
    downside:Point[];
    number:number;
    nickname:string;
    hp:number;
    barrier:number;
    total:number;
    isTeam:boolean;
    isDead:boolean;
    isMark:boolean;
}