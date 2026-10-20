import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome_showcase_capture_' + Date.now());
const SHOWCASE_DIR = path.resolve('public/showcase');

if (!fs.existsSync(SHOWCASE_DIR)) {
  fs.mkdirSync(SHOWCASE_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Iniciando captura de alta definición de la consola operativa y módulos...');
  
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1600,1100',
    'about:blank'
  ], {
    stdio: 'ignore'
  });

  // Esperar a que CDP esté listo
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        console.log('CDP listo:', wsUrl);
        break;
      }
    } catch {
      await sleep(300);
    }
  }

  if (!wsUrl) {
    console.error('No se pudo conectar a Chrome CDP');
    chromeProc.kill();
    process.exit(1);
  }

  const captureTask = async ({ name, url, prepareScript, waitFor = 2000, width = 1600, height = 1100 }) => {
    console.log(`\nCapturando: ${name}...`);
    const newTabRes = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(url), { method: 'PUT' });
    const tabData = await newTabRes.json();
    const tabWsUrl = tabData.webSocketDebuggerUrl;

    await new Promise((resolve, reject) => {
      const ws = new WebSocket(tabWsUrl);
      let msgId = 1;

      function send(method, params = {}) {
        const id = msgId++;
        ws.send(JSON.stringify({ id, method, params }));
        return id;
      }

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error(`Timeout al capturar ${name}`));
      }, 18000);

      ws.onopen = async () => {
        send('Page.enable');
        send('Runtime.enable');
        send('Emulation.setDeviceMetricsOverride', {
          width,
          height,
          deviceScaleFactor: 1.5,
          mobile: false
        });

        // Esperar carga inicial
        await sleep(waitFor);

        // Ejecutar script de preparación (scroll o click de tab)
        if (prepareScript) {
          send('Runtime.evaluate', { expression: prepareScript });
          await sleep(1200);
        }

        // Tomar captura en JPG calidad 92
        const captureId = send('Page.captureScreenshot', {
          format: 'jpeg',
          quality: 92,
          captureBeyondViewport: false
        });

        ws.onmessage = (event) => {
          const resp = JSON.parse(event.data);
          if (resp.id === captureId) {
            clearTimeout(timeout);
            const base64Data = resp.result.data;
            const destPath = path.join(SHOWCASE_DIR, name);
            fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
            console.log(`✓ Guardada con éxito: ${destPath} (${Math.round(base64Data.length * 0.75 / 1024)} KB)`);
            ws.close();
            resolve();
          }
        };
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        console.error('Error en WebSocket:', err);
        reject(err);
      };
    });

    try {
      await fetch(`http://127.0.0.1:9222/json/close/${tabData.id}`);
    } catch {}
  };

  // 1. Módulo 1: Consola de Sala en Vivo (Plano interactivo, métricas de anticipos y aforo)
  await captureTask({
    name: 'consola-operativa-sala.jpg',
    url: 'http://localhost:5173/software/pantallas',
    prepareScript: `
      window.scrollTo(0, 160);
      const tab = document.querySelectorAll('.saas-screen-tab')[0];
      if (tab) tab.click();
    `,
    waitFor: 2500
  });

  // Guardar también como dashboard-preview.jpg para mantener paridad
  const salaSrc = path.join(SHOWCASE_DIR, 'consola-operativa-sala.jpg');
  const dashDest = path.join(SHOWCASE_DIR, 'dashboard-preview.jpg');
  if (fs.existsSync(salaSrc)) {
    fs.copyFileSync(salaSrc, dashDest);
    console.log('✓ Copiado como dashboard-preview.jpg');
  }

  // 2. Módulo 2: Terminal PWA de Puerta (Escáner de seguridad y control de acceso)
  await captureTask({
    name: 'consola-operativa-puerta.jpg',
    url: 'http://localhost:5173/software/pantallas',
    prepareScript: `
      window.scrollTo(0, 160);
      const tab = document.querySelectorAll('.saas-screen-tab')[1];
      if (tab) tab.click();
    `,
    waitFor: 2500
  });

  // 3. Módulo 3: Portal del Invitado (Selección de mesas y checkout VIP)
  await captureTask({
    name: 'consola-operativa-cliente.jpg',
    url: 'http://localhost:5173/software/pantallas',
    prepareScript: `
      window.scrollTo(0, 160);
      const tab = document.querySelectorAll('.saas-screen-tab')[2];
      if (tab) tab.click();
    `,
    waitFor: 2500
  });

  // 4. Módulo 4: Simulador Operativo Interactivo (Pase Dinámico + Escáner + Radar de Mesas)
  await captureTask({
    name: 'consola-operativa-simulador.jpg',
    url: 'http://localhost:5173/software/simulador',
    prepareScript: `
      const stage = document.querySelector('.saas-stage');
      if (stage) {
        stage.scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        window.scrollTo(0, 260);
      }
    `,
    waitFor: 3000
  });

  // 5. Módulo 5: Consola Operativa VIP (Hero Radar + Pase 3D interactivo en la landing)
  await captureTask({
    name: 'consola-operativa-radar.jpg',
    url: 'http://localhost:5173/software',
    prepareScript: `
      const mockup = document.querySelector('.vip-mockup-frame, .saas-hero__mockup, .vip-card-stage');
      if (mockup) {
        mockup.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo(0, 120);
      }
    `,
    waitFor: 3000
  });

  console.log('\nTodas las capturas de la consola operativa fueron generadas en public/showcase/*.jpg');
  chromeProc.kill();
  try {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  } catch {}
  process.exit(0);
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
