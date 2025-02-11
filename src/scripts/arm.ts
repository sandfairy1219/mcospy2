const mod = Module.findBaseAddress("libMyGame.so")

const offsets:Record<string, string> = {
    setClanExp: "0x334F480",
    setStarLeagueCoin: "0x334FD64",
    setStarLeaguePoint: "0x334FBE8",
    setGold: "0x3354838",
    setMoney: "0x3354A88",
    setBMoney: "0x3354960",
    setSkill: "0x3355124",
    setLatency: "0x334FD64",
    getStarMedal: "0x3355C70",
    setGP: "0x3353E34",
    endgame: "0x334F564",
    electric: "0x335B9C",
    assist: "0x3350984",
    isassist: "0x311BD0C"
}

const excludes = ["setSkill", "endgame", "getStarMedal", "electric", "assist", "isassist"]

const setClanExp = new NativeFunction(mod.add(offsets.setClanExp), "int", ["uint"])
const setStarLeagueCoin = new NativeFunction(mod.add(offsets.setStarLeagueCoin), "int", ["uint"])
const setStarLeaguePoint = new NativeFunction(mod.add(offsets.setStarLeaguePoint), "int", ["uint16"])
const setGold = new NativeFunction(mod.add(offsets.setGold), "int", ["int", "int"])
const setMoney = new NativeFunction(mod.add(offsets.setMoney), "int", ["int", "int"])
const setBMoney = new NativeFunction(mod.add(offsets.setBMoney), "int", ["int", "int"])
const setSkill = new NativeFunction(mod.add(offsets.setSkill), "int", ["bool"])
const setLatency = new NativeFunction(mod.add(offsets.setLatency), "int", ["uint"])
const getStarMedal = new NativeFunction(mod.add(offsets.getStarMedal), "int", ["uchar", "ulong"])
const setGP = new NativeFunction(mod.add(offsets.setGP), "int", ["uchar", "uint"])
const endgame = new NativeFunction(mod.add(offsets.endgame), "void", ["int"])
const electric = new NativeFunction(mod.add(offsets.electric), "void", ["pointer", "uint", "uint"])
const assist = new NativeFunction(mod.add(offsets.assist), "void", ["bool"])
const isassist = new NativeFunction(mod.add(offsets.assist), "bool", ["void"])

Interceptor.attach(mod.add(offsets.assist), {
    onEnter: (args) => {
        console.log("1ASE", ...args)
    },
    onLeave: (retval) => {
        console.log("1ASL", retval)
    }
})
Interceptor.attach(mod.add(offsets.isassist), {
    onEnter: (args) => {
        console.log("ASE", ...args)
    },
    onLeave: (retval) => {
        console.log("ASL", retval)
    }
})

Object.keys(offsets).forEach(offsetName => {
    if(excludes.includes(offsetName)) return;
    const offset = offsets[offsetName];
    Interceptor.attach(mod.add(offset), {
        onEnter: (args) => {
            console.log(offsetName, "Entered", ...args)
        },
        onLeave: (retval) => {
            console.log(offsetName, "Leaved", offset, retval.toInt32())
            retval.replace(9999 as any)
        }
    })
})

const ex = () => {
    setGold(99999999, 0)
    setMoney(9999999, 0)
    setStarLeagueCoin(999999)
    getStarMedal(1, 4)
    getStarMedal(2, 4)
    getStarMedal(3, 4)
    getStarMedal(4, 4)
    getStarMedal(5, 4)
    getStarMedal(6, 4)
    getStarMedal(7, 4)
    getStarMedal(8, 4)
    getStarMedal(9, 4)
    getStarMedal(10, 4)
    getStarMedal(11, 4)
    getStarMedal(12, 4)
}