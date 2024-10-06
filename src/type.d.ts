
interface Token{
    key:string;
    expiration:number;
    perms:string[];
}

type Cheats = {[key:string]:boolean}
type Config = {[key:string]:any}
type Keybinds = {[key:string]:string}