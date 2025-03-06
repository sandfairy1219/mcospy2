
interface Token{
    key: string;
    expiration: number;
    perms: string[];
    using: boolean;
    tier: number;
    excs: number[];
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
    isTeam:boolean;
    isDead:boolean;
}