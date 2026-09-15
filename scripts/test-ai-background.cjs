// Isolated Electron smoke test: no access to the user's app session or projects.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
app.setPath('userData', path.join(os.tmpdir(), 'logdd-ai-background-test'));
const root = path.resolve(__dirname, '../out/renderer');
const worker = fs.readdirSync(path.join(root, 'assets')).find(name => /^ai-background\.worker-.*\.js$/.test(name));
if (!worker) throw new Error('Build the renderer first');
const server = http.createServer((req, res) => {
  if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><body>AI test</body></html>'); return; }
  if (req.url === '/input.png') { res.setHeader('Content-Type', 'image/png'); res.end(fs.readFileSync(path.resolve(__dirname, '../logo.png'))); return; }
  const file = path.resolve(root, '.' + req.url);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
app.whenReady().then(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const win = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false } });
  win.webContents.on('console-message', (_e, _level, message) => { if (message.startsWith('AI:')) console.log(message); });
  await win.loadURL(`http://127.0.0.1:${server.address().port}/`);
  try {
    const result = await win.webContents.executeJavaScript(`(async () => {
      const blob = await (await fetch('/input.png')).blob();
      const worker = new Worker('/assets/${worker}', { type: 'module' });
      const started = Date.now();
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { worker.terminate(); reject(new Error('Inference timeout')); }, 600000);
        worker.onerror = event => { clearTimeout(timer); reject(new Error(event.message)); };
        worker.onmessage = async event => {
          if (event.data.error) { clearTimeout(timer); worker.terminate(); reject(new Error(event.data.error)); }
          else if (event.data.blob) {
            clearTimeout(timer); worker.terminate();
            const image = await createImageBitmap(event.data.blob);
            const canvas = new OffscreenCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
            const rgba = ctx.getImageData(0,0,image.width,image.height).data;
            let clear = 0, opaque = 0;
            for(let p=3;p<rgba.length;p+=4) { if(rgba[p]<20)clear++; if(rgba[p]>235)opaque++; }
            resolve({ width:image.width,height:image.height,clear,opaque,ms:Date.now()-started,bytes:event.data.blob.size });
          } else if(event.data.progress === 100) console.log('AI: resource downloaded');
        };
        worker.postMessage({blob,device:'cpu'});
      });
    })()`);
    console.log(JSON.stringify(result));
    if (!result.clear || !result.opaque) throw new Error('Mask does not contain both foreground and background');
    console.log('AI background real CPU inference passed');
    app.exit(0);
  } catch (error) { console.error(error); app.exit(1); }
});
