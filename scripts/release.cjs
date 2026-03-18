const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bump = process.argv[2] || 'patch';
const nsisDir = path.join('src-tauri', 'target', 'release', 'bundle', 'nsis');
const repo = 'sandfairy1219/mcospy2';

// 1. commit + version bump
execSync('git add -A && git commit -m "chore: pre-release" --allow-empty', { stdio: 'inherit' });
execSync(`npm version ${bump} --no-git-tag-version`, { stdio: 'inherit' });

// 2. sync version to tauri.conf.json & Cargo.toml
const v = require('../package.json').version;
const tauriConfPath = path.join('src-tauri', 'tauri.conf.json');
const cargoTomlPath = path.join('src-tauri', 'Cargo.toml');

const tc = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tc.version = v;
tc.app.windows[0].title = `mcospy v${v}`;
fs.writeFileSync(tauriConfPath, JSON.stringify(tc, null, 2) + '\n');

const ct = fs.readFileSync(cargoTomlPath, 'utf8');
fs.writeFileSync(cargoTomlPath, ct.replace(/^version\s*=\s*"[^"]*"/m, `version = "${v}"`));

// 3. commit version bump + tag
execSync(`git add -A && git commit -m "chore: bump version to v${v}" && git tag v${v}`, { stdio: 'inherit' });

// 4. build
execSync('bun run build && bun run build:sidecar && npx tauri build', { stdio: 'inherit', env: { ...process.env } });

// 5. read signature & generate latest.json
const sig = fs.readFileSync(path.join(nsisDir, `mcospy_${v}_x64-setup.exe.sig`), 'utf8').trim();
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

// 6. push + release
execSync(`git push origin main && git push origin v${v}`, { stdio: 'inherit' });
execSync(`gh release create v${v} "${path.join(nsisDir, `mcospy_${v}_x64-setup.exe`)}" "${path.join(nsisDir, `mcospy_${v}_x64-setup.exe.sig`)}" "${path.join(nsisDir, 'latest.json')}" --title "v${v}" --generate-notes`, { stdio: 'inherit' });

console.log(`\nv${v} released!`);
