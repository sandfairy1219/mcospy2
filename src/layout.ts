import { ipcRenderer } from "electron"

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let configg:Config = {};

ipcRenderer.on("init", (event, config:Config) => {
    configg = config;
    const value = config['esp-color'] || 'red'
    ctx.fillStyle = value;
    ctx.strokeStyle = value;
    canvas.style.borderColor = value;
});
ipcRenderer.on("config", (event, id:string, value:any) => {
    configg[id] = value;
    if(id === 'esp-color') {
        ctx.fillStyle = value;
        ctx.strokeStyle = value;
        canvas.style.borderColor = value;
    };
});
ipcRenderer.on("draw", (event, data:DrawRect[], tracer:boolean = false, threed:boolean = false) => {
    console.log(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(threed){
        for (const rect of data) {
            ctx.beginPath();
            if(tracer){
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(rect.upside[0].x, rect.upside[0].y);
            }
            const lastUpIdx = rect.upside.length - 1;
            ctx.moveTo(rect.upside[lastUpIdx].x, rect.upside[lastUpIdx].y);
            for (const point of rect.upside) {
                ctx.lineTo(point.x, point.y);
            }
            const lastDownIdx = rect.downside.length - 1;
            ctx.moveTo(rect.downside[lastDownIdx].x, rect.downside[lastDownIdx].y);
            for (const point of rect.downside) {
                ctx.lineTo(point.x, point.y);
            }
            rect.upside.forEach((point, idx) => {
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(rect.downside[idx].x, rect.downside[idx].y);
            });
            ctx.stroke();
            ctx.closePath();
        }
    } else {
        for (const rect of data) {
            const Xs = [...rect.upside.map(point => point.x), ...rect.downside.map(point => point.x)];
            const Ys = [...rect.upside.map(point => point.y), ...rect.downside.map(point => point.y)];
            const minX = Math.min(...Xs);
            const maxX = Math.max(...Xs);
            const minY = Math.min(...Ys);
            const maxY = Math.max(...Ys);
            ctx.beginPath();
            if(tracer){
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(minX, minY);
            }
            ctx.moveTo(minX, minY);
            ctx.lineTo(maxX, minY);
            ctx.lineTo(maxX, maxY);
            ctx.lineTo(minX, maxY);
            ctx.lineTo(minX, minY);
            ctx.stroke();
            ctx.closePath();
        }
    }
});

const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ipcRenderer.send("resize-layout");
};
resize();
window.addEventListener("resize", resize);
