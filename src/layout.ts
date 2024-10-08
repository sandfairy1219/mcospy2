import { ipcRenderer } from "electron"

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
ctx.textAlign = "center";
ctx.textBaseline = "bottom";
ctx.font = "20px sans-serif";

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
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const value = config['esp-color'] || 'red'
    ctx.fillStyle = value;
    ctx.strokeStyle = value;
    if(threed){
        for (const rect of data) {
            const upside = rect.upside.map(point => ({ x: halfWidth + point.x * halfWidth, y: halfHeight + point.y * halfHeight }));
            const downside = rect.downside.map(point => ({ x: halfWidth + point.x * halfWidth, y: halfHeight + point.y * halfHeight }));
            const Xs = [...upside.map(point => point.x), ...downside.map(point => point.x)];
            const Ys = [...upside.map(point => point.y), ...downside.map(point => point.y)];
            const minX = Math.min(...Xs), maxX = Math.max(...Xs), minY = Math.min(...Ys), maxY = Math.max(...Ys);
            ctx.fillText(`[${rect.number}] ${rect.nickname}`, minX + (maxX - minX) / 2, minY);
            ctx.beginPath();
            if(tracer){
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(minX, minY);
            }
            const lastUpIdx = upside.length - 1;
            ctx.moveTo(upside[lastUpIdx].x, upside[lastUpIdx].y);
            for (const point of upside) {
                ctx.lineTo(point.x, point.y);
            }
            const lastDownIdx = downside.length - 1;
            ctx.moveTo(downside[lastDownIdx].x, downside[lastDownIdx].y);
            for (const point of downside) {
                ctx.lineTo(point.x, point.y);
            }
            upside.forEach((point, idx) => {
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(downside[idx].x, downside[idx].y);
            });
            ctx.stroke();
            ctx.closePath();
        }
    } else {
        for (const rect of data) {
            const upside = rect.upside.map(point => ({ x: halfWidth + point.x * halfWidth, y: halfHeight + point.y * halfHeight }));
            const downside = rect.downside.map(point => ({ x: halfWidth + point.x * halfWidth, y: halfHeight + point.y * halfHeight }));
            const Xs = [...upside.map(point => point.x), ...downside.map(point => point.x)];
            const Ys = [...upside.map(point => point.y), ...downside.map(point => point.y)];
            const minX = Math.min(...Xs), maxX = Math.max(...Xs), minY = Math.min(...Ys), maxY = Math.max(...Ys);
            ctx.fillText(`[${rect.number}] ${rect.nickname}`, minX + (maxX - minX) / 2, minY);
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
