const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bump = process.argv[2] || 'patch';
const nsisDir = path.join('src-tauri', 'target', 'release', 'bundle', 'nsis');
const repo = 'sandfairy1219/mcospy2';

// 1. commit + version bump
execSync('git add -A && git commit -m "chore: pre-release" --allow-empty', { stdio: 'inherit' });
execSync(`npm version ${bump}`, { stdio: 'inherit' });

// 2. build
execSync('bun run build && bun run build:sidecar && npx tauri build', { stdio: 'inherit', env: { ...process.env } });

// 3. read version & signature
const v = require('../package.json').version;
const sig = fs.readFileSync(path.join(nsisDir, `mcospy_${v}_x64-setup.exe.sig`), 'utf8').trim();

// 4. generate latest.json
const latest = {
    version: v,
    notes: '',
    pub_date: new Date().toISOString(),
    platforms: {
        'windows-x86_64': {
            signature: sig,
            url: `https://github.com/${repo}/releases/download/v${v}/mcospy_${v}_x64-setup.exe`
        }
    }
};
fs.writeFileSync(path.join(nsisDir, 'latest.json'), JSON.stringify(latest, null, 2) + '\n');

// 5. push + release
execSync(`git push origin main && git push origin v${v}`, { stdio: 'inherit' });
execSync(`gh release create v${v} "${path.join(nsisDir, `mcospy_${v}_x64-setup.exe`)}" "${path.join(nsisDir, `mcospy_${v}_x64-setup.exe.sig`)}" "${path.join(nsisDir, 'latest.json')}" --title "v${v}" --generate-notes`, { stdio: 'inherit' });

console.log(`\nv${v} released!`);
