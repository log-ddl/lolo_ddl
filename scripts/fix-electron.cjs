const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const electronDir = path.join(rootDir, 'node_modules', 'electron');
const pathTxt = path.join(electronDir, 'path.txt');

if (!fs.existsSync(electronDir)) {
  process.exit(0);
}

let isOk = false;
if (fs.existsSync(pathTxt)) {
  const relPath = fs.readFileSync(pathTxt, 'utf-8').trim();
  const execPath = path.join(electronDir, 'dist', relPath);
  if (relPath && fs.existsSync(execPath)) {
    isOk = true;
  }
}

if (!isOk) {
  console.log('[fix-electron] Electron binary missing or invalid. Fixing...');
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(electronDir, 'package.json'), 'utf-8'));
    const version = pkg.version;
    
    const downloadScript = `
      const { downloadArtifact } = require('@electron/get');
      downloadArtifact({ version: '${version}', artifactName: 'electron', platform: process.platform, arch: process.arch })
        .then(zipPath => console.log('ZIP:' + zipPath))
        .catch(err => { console.error(err); process.exit(1); });
    `;
    const output = execSync(`node -e "${downloadScript.replace(/\n/g, ' ')}"`, { cwd: rootDir, encoding: 'utf-8' });
    const zipLine = output.split('\n').find(l => l.startsWith('ZIP:'));
    if (!zipLine) {
      throw new Error('Failed to locate downloaded zip artifact');
    }
    const zipPath = zipLine.substring(4).trim();
    const distDir = path.join(electronDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    if (process.platform === 'darwin') {
      execSync(`unzip -o "${zipPath}" -d "${distDir}"`, { stdio: 'ignore' });
      fs.writeFileSync(pathTxt, 'Electron.app/Contents/MacOS/Electron');
    } else if (process.platform === 'win32') {
      execSync(`powershell -NoProfile -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${distDir}'"`, { stdio: 'ignore' });
      fs.writeFileSync(pathTxt, 'electron.exe');
    } else {
      execSync(`unzip -o "${zipPath}" -d "${distDir}"`, { stdio: 'ignore' });
      fs.writeFileSync(pathTxt, 'electron');
    }
    console.log('[fix-electron] Electron binary successfully restored!');
  } catch (err) {
    console.error('[fix-electron] Failed to auto-fix Electron binary:', err.message);
  }
}
