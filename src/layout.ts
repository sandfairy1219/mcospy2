import { ipcRenderer } from "electron"

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

let keybindss:Keybinds = {}
let configg:Config = {}

ipcRenderer.on("init", (event, keybinds:Keybinds, config:Config) => {
    keybindss = keybinds
    configg = config
    const value = config['esp-color'] || 'red'
    ctx.fillStyle = value
    ctx.strokeStyle = value
    canvas.style.borderColor = value
})
ipcRenderer.on("keybind", (event, id:string, key:string) => {
    keybindss[id] = key
})
ipcRenderer.on("config", (event, id:string, value:any) => {
    configg[id] = value
    if(id === 'esp-color') {
        ctx.fillStyle = value
        ctx.strokeStyle = value
        canvas.style.borderColor = value
    }
})

const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    ipcRenderer.send("resize-layout")
}
resize()
window.addEventListener("resize", resize)