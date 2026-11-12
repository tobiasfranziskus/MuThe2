'use strict';

// Browser-Smoke-Test für den echten GitHub-Pages-Einstiegspunkt.
// Ohne npm-Abhängigkeiten: Chrome/Chromium ist auf ubuntu-latest vorhanden.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.join(__dirname, '..');
const browser = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find(bin => bin && fs.existsSync(bin));

if (!browser) {
  console.error('Chrome/Chromium nicht gefunden: Browser-Smoke-Test kann nicht ausgeführt werden.');
  process.exit(1);
}

const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/sw.js': ['sw.js', 'application/javascript; charset=utf-8'],
  '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json; charset=utf-8'],
  '/src/app.js': ['src/app.js', 'application/javascript; charset=utf-8'],
  '/src/music/notennamen.mjs': ['src/music/notennamen.mjs', 'application/javascript; charset=utf-8'],
  '/src/music/tonhoehen.mjs': ['src/music/tonhoehen.mjs', 'application/javascript; charset=utf-8'],
  '/src/music/intervalle.mjs': ['src/music/intervalle.mjs', 'application/javascript; charset=utf-8'],
  '/src/music/tonleitern.mjs': ['src/music/tonleitern.mjs', 'application/javascript; charset=utf-8'],
  '/src/music/akkorde.mjs': ['src/music/akkorde.mjs', 'application/javascript; charset=utf-8'],
  '/src/music/beispiel-audio.mjs': ['src/music/beispiel-audio.mjs', 'application/javascript; charset=utf-8'],
  '/src/music/bewertung.mjs': ['src/music/bewertung.mjs', 'application/javascript; charset=utf-8'],
  '/src/aufgaben/notennamen.mjs': ['src/aufgaben/notennamen.mjs', 'application/javascript; charset=utf-8'],
  '/src/aufgaben/intervalle.mjs': ['src/aufgaben/intervalle.mjs', 'application/javascript; charset=utf-8'],
  '/src/aufgaben/tonleitern.mjs': ['src/aufgaben/tonleitern.mjs', 'application/javascript; charset=utf-8'],
  '/src/aufgaben/akkorde.mjs': ['src/aufgaben/akkorde.mjs', 'application/javascript; charset=utf-8'],
  '/src/aufgaben/rhythmus.mjs': ['src/aufgaben/rhythmus.mjs', 'application/javascript; charset=utf-8'],
  '/src/aufgaben/quintenzirkel-vorzeichen.mjs': ['src/aufgaben/quintenzirkel-vorzeichen.mjs', 'application/javascript; charset=utf-8'],
  '/src/aufgaben/harmoniefunktionen.mjs': ['src/aufgaben/harmoniefunktionen.mjs', 'application/javascript; charset=utf-8'],
  '/src/aufgaben/kadenz-analyse.mjs': ['src/aufgaben/kadenz-analyse.mjs', 'application/javascript; charset=utf-8'],
  '/src/ui/notensystem.mjs': ['src/ui/notensystem.mjs', 'application/javascript; charset=utf-8'],
  '/src/ui/noteneingabe.mjs': ['src/ui/noteneingabe.mjs', 'application/javascript; charset=utf-8'],
  '/src/duell/spielregeln.mjs': ['src/duell/spielregeln.mjs', 'application/javascript; charset=utf-8'],
  '/src/duell/rundensteuerung.mjs': ['src/duell/rundensteuerung.mjs', 'application/javascript; charset=utf-8'],
  '/src/duell/aufgabenpool.mjs': ['src/duell/aufgabenpool.mjs', 'application/javascript; charset=utf-8'],
  '/src/duell/timer.mjs': ['src/duell/timer.mjs', 'application/javascript; charset=utf-8'],
  '/src/duell/ansicht.mjs': ['src/duell/ansicht.mjs', 'application/javascript; charset=utf-8'],
  '/src/duell/sitzung.mjs': ['src/duell/sitzung.mjs', 'application/javascript; charset=utf-8'],
  '/src/auswertung/duell-protokoll.mjs': ['src/auswertung/duell-protokoll.mjs', 'application/javascript; charset=utf-8'],
  '/src/unterricht/lernplan.mjs': ['src/unterricht/lernplan.mjs', 'application/javascript; charset=utf-8'],
  '/src/unterricht/oberflaeche.mjs': ['src/unterricht/oberflaeche.mjs', 'application/javascript; charset=utf-8'],
  '/src/unterricht/qr-code.mjs': ['src/unterricht/qr-code.mjs', 'application/javascript; charset=utf-8'],
  '/src/unterricht/vendor/qrcode.mjs': ['src/unterricht/vendor/qrcode.mjs', 'application/javascript; charset=utf-8'],
  '/src/unterricht/profile.mjs': ['src/unterricht/profile.mjs', 'application/javascript; charset=utf-8'],
  '/src/styles.css': ['src/styles.css', 'text/css; charset=utf-8'],
  '/src/unterricht/druck.css': ['src/unterricht/druck.css', 'text/css; charset=utf-8'],
};
const server = http.createServer((req, res) => {
  const asset = assets[(req.url || '/').split('?')[0]];
  if (!asset) { res.writeHead(404); res.end('Not found'); return; }
  const file = path.join(root, asset[0]);
  res.writeHead(200, { 'Content-Type': asset[1] });
  fs.createReadStream(file).pipe(res);
});

server.listen(0, '127.0.0.1', () => {
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const args = [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    '--disable-background-networking', '--no-first-run',
    '--virtual-time-budget=5000', '--window-size=1024,768', '--dump-dom', url,
  ];
  const child = spawn(browser, args);
  let dom = '', stderr = '';
  child.stdout.on('data', chunk => { dom += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const timer = setTimeout(() => {
    child.kill('SIGKILL');
    console.error('Browser-Smoke-Test überschritt 30 Sekunden.');
    process.exitCode = 1;
  }, 30000);
  child.on('error', err => {
    clearTimeout(timer);
    console.error(err);
    process.exitCode = 1;
    server.close();
  });
  child.on('close', code => {
    clearTimeout(timer);
    const rendered = /<div id="root">[\s\S]*Musiktheorie Interaktiv/.test(dom);
    const hasTasks = dom.includes('Notennamen');
    const ok = code === 0 && rendered && hasTasks;
    console.log(JSON.stringify({ browser, exitCode: code, appRendered: rendered, tasksVisible: hasTasks }));
    if (!ok) {
      console.error('Browser-Smoke-Test fehlgeschlagen.', stderr.slice(-2500));
      console.error('DOM-Anfang:', dom.slice(0, 1000));
      process.exitCode = 1;
    }
    server.close();
  });
});
