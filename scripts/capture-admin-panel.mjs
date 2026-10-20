import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome_showcase_admin_' + Date.now());
const SHOWCASE_DIR = path.resolve('public/showcase');

if (!fs.existsSync(SHOWCASE_DIR)) {
  fs.mkdirSync(SHOWCASE_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Iniciando captura de vistas del PANEL ADMINISTRATIVO...');
  
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1600,1050',
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

  const captureAdminTab = async ({ name, tab, waitFor = 3500 }) => {
    const url = `http://localhost:5173/admin?demo=1&tab=${tab}`;
    console.log(`\nCapturando Panel Admin: ${name} (tab=${tab})...`);
    
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
      }, 20000);

      ws.onopen = async () => {
        send('Page.enable');
        send('Runtime.enable');
        send('Emulation.setDeviceMetricsOverride', {
          width: 1600,
          height: 1050,
          deviceScaleFactor: 1.5,
          mobile: false
        });

        // Esperar render del layout administrativo y datos de ClubStore
        await sleep(waitFor);

        // Capturar pantalla completa en JPG de alta fidelidad
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

  // 1. Panel Admin: Sala & Concierge en Vivo (Plano cenital, métricas ejecutivas, ocupación y aforo)
  await captureAdminTab({
    name: 'panel-admin-sala-concierge.jpg',
    tab: 'MONITOR',
    waitFor: 4000
  });

  // 2. Panel Admin: Diseñador de Plano Cenital (Editor interactivo con cuadrícula y mesas)
  await captureAdminTab({
    name: 'panel-admin-disenador-plano.jpg',
    tab: 'LAYOUT_BUILDER',
    waitFor: 4000
  });

  // 3. Panel Admin: Bitácora Oficial de Reservas & Anticipos
  await captureAdminTab({
    name: 'panel-admin-reservas.jpg',
    tab: 'RESERVATIONS',
    waitFor: 4000
  });

  // 4. Panel Admin: Bitácora y Auditoría de Puerta (Control de accesos y colisiones)
  await captureAdminTab({
    name: 'panel-admin-bitacora-puerta.jpg',
    tab: 'DOOR_LOG',
    waitFor: 4000
  });

  // 5. Panel Admin: Tarifario & Anticipos (Precios por mesa, mínimos de consumo y capacidad)
  await captureAdminTab({
    name: 'panel-admin-tarifario-precios.jpg',
    tab: 'PRICING',
    waitFor: 4000
  });

  // 6. Panel Admin: Gestión de Personal & Colaboradores
  await captureAdminTab({
    name: 'panel-admin-personal-staff.jpg',
    tab: 'STAFF',
    waitFor: 4000
  });

  console.log('\n✓ Todas las capturas del PANEL ADMINISTRATIVO fueron tomadas y guardadas en public/showcase/');
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
