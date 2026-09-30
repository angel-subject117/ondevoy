import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';

async function run() {
  console.log('EPEC Scraper V-FINAL iniciando...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(7000);

  const rawText = await page.evaluate(() => document.body.innerText);

  // Limpieza y estructura
  const lineas = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 10);

  const lineasUtiles = lineas.filter(l => {
    const lower = l.toLowerCase();
    return!lower.includes('sustentabilidad') &&
          !lower.includes('oficina virtual') &&
          !lower.includes('epec.com.ar') &&
          !lower.includes('home') &&
           l.length < 300;
  });

  const cortes = [];
  // Cada bloque de EPEC suele tener fecha + barrio + horario
  for (let i = 0; i < lineasUtiles.length; i++) {
    const t = lineasUtiles[i];
    if (t.toLowerCase().includes('mantenimiento') || t.toLowerCase().includes('mejoras') || t.toLowerCase().includes('corte') || t.toLowerCase().includes('barrio')) {
      cortes.push({
        fecha: new Date().toLocaleDateString('es-AR'),
        barrio: t.substring(0, 120),
        horario: lineasUtiles[i+1]? lineasUtiles[i+1].substring(0, 120) : 'A confirmar en web EPEC',
        motivo: lineasUtiles[i+2]? lineasUtiles[i+2].substring(0, 200) : t
      });
    }
  }

  const dataFinal = {
    fuente: URL,
    actualizado: new Date().toISOString(),
    actualizadoAR: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Cordoba' }),
    total: cortes.length || 1,
    cortes: cortes.length > 0? cortes.slice(0, 20) : [{
      fecha: new Date().toLocaleDateString('es-AR'),
      barrio: 'Información general',
      horario: 'Consultar web oficial',
      motivo: lineasUtiles.slice(0, 5).join(' | ').substring(0, 400)
    }],
    estado: 'OK_FINAL'
  };

  fs.mkdirSync('public/data', { recursive: true });
  fs.writeFileSync('public/data/epec.json', JSON.stringify(dataFinal, null, 2));

  console.log('LISTO:', JSON.stringify(dataFinal, null, 2));
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
