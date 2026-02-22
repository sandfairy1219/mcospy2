const fs = require("fs");
const path = require("path");

const workspaceRoot = path.resolve(__dirname, "..");
const source = path.join(workspaceRoot, "public", "scripts", "agent.js");
const target = path.join(workspaceRoot, "src-tauri", "agent.js");

if (!fs.existsSync(source)) {
  throw new Error(`Agent source not found: ${source}`);
}

fs.copyFileSync(source, target);
console.log(`Prepared agent resource: ${target}`);
