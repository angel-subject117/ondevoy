import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';

async function run() {
  console.log('Iniciando scraper EPEC oficial...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(7000); // espera que pase Cloudflare

  const texto = await page.evaluate(() => document.body.innerText);

  console.log('Texto capturado:', texto.substring(0, 1000));

  const data = {
    fuente: URL,
    actualizado: new Date().toISOString(),
    cortes: texto,
    estado: texto.length > 500 ? 'OK' : 'FALLO'
  };

  fs.mkdirSync('public/data', { recursive: true });
  fs.writeFileSync('public/data/epec.json', JSON.stringify(data, null, 2));
  fs.writeFileSync('public/data/debug.html', await page.content());

  console.log('Guardado epec.json - Estado:', data.estado);
  await browser.close();

  if (data.estado === 'FALLO') throw new Error('Falló - EPEC no devolvió contenido');
}

run();