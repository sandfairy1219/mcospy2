const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");
const { execFileSync } = require("child_process");

const FRIDA_VERSION = "16.4.10";
const PKG_NODE_ABI = "108";

const workspaceRoot = path.resolve(__dirname, "..");
const nodeModulesBinding = path.join(
  workspaceRoot,
  "node_modules",
  "frida",
  "build",
  "frida_binding.node"
);
const outputBinding = path.join(workspaceRoot, "src-tauri", "frida_binding.node");

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Prepared frida binding: ${dest}`);
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    const request = https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(destination);
        downloadFile(response.headers.location, destination).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });

    request.on("error", (err) => {
      file.close();
      try {
        fs.unlinkSync(destination);
      } catch {
        // ignore
      }
      reject(err);
    });
  });
}

async function main() {
  if (process.versions.modules === PKG_NODE_ABI && fs.existsSync(nodeModulesBinding)) {
    copyFile(nodeModulesBinding, outputBinding);
    return;
  }

  const archiveUrl = `https://github.com/frida/frida/releases/download/${FRIDA_VERSION}/frida-v${FRIDA_VERSION}-node-v${PKG_NODE_ABI}-win32-x64.tar.gz`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "frida-binding-"));
  const archivePath = path.join(tempDir, "frida.tar.gz");
  const extractDir = path.join(tempDir, "extract");
  fs.mkdirSync(extractDir, { recursive: true });

  console.log(`Downloading Node ABI ${PKG_NODE_ABI} frida binding...`);
  await downloadFile(archiveUrl, archivePath);

  try {
    execFileSync("tar", ["-xzf", path.basename(archivePath), "-C", path.basename(extractDir)], {
      cwd: tempDir,
      stdio: "inherit"
    });
  } catch (err) {
    throw new Error(
      `Failed to extract ${archivePath} with tar. Ensure tar is available. Original error: ${err.message}`
    );
  }

  const extractedBinding = path.join(extractDir, "build", "frida_binding.node");
  if (!fs.existsSync(extractedBinding)) {
    throw new Error(`Extracted binding not found at ${extractedBinding}`);
  }

  copyFile(extractedBinding, outputBinding);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
