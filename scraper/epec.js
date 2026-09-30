import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';

function parsearCortes(textoCrudo) {
  // EPEC pone los cortes como texto corrido, los separamos
  const lineas = textoCrudo.split('\n').map(l => l.trim()).filter(l => l.length > 15);
  const cortes = [];

  // Regex para detectar patrones de EPEC
  const regexFecha = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} de [a-z]+)/i;
  const regexHora = /(\d{1,2}:\d{2}|\d{1,2} hs)/i;

  let bloqueActual = {};

  for (const linea of lineas) {
    // Si es un título de trabajo / barrio
    if (linea.toLowerCase().includes('barrio') || linea.toLowerCase().includes('localidad') || linea.toLowerCase().includes('zona')) {
      if (bloqueActual.barrio) cortes.push(bloqueActual);
      bloqueActual = { barrio: linea, fecha: '', horario: '', motivo: '' };
    }

    if (regexFecha.test(linea) &&!bloqueActual.fecha) bloqueActual.fecha = linea.match(regexFecha)[0];
    if (regexHora.test(linea) &&!bloqueActual.horario) bloqueActual.horario = linea;
    if (linea.toLowerCase().includes('motivo') || linea.toLowerCase().includes('mantenimiento') || linea.toLowerCase().includes('mejora')) {
      bloqueActual.motivo = linea;
    }
  }
  if (bloqueActual.barrio) cortes.push(bloqueActual);

  // Si el parseo falla, devolvemos al menos el texto limpio
  if (cortes.length === 0) {
    const textoLimpio = lineas.filter(l =>
     !l.toLowerCase().includes('sustentabilidad') &&
     !l.toLowerCase().includes('oficina virtual') &&
     !l.toLowerCase().includes('home')
    ).join(' | ');
    return [{ fecha: new Date().toLocaleDateString('es-AR'), barrio: 'Varios sectores', horario: 'Ver detalle', motivo: textoLimpio.substring(0, 400) }];
  }

  return cortes.sort((a,b) => a.fecha.localeCompare(b.fecha));
}

async function run() {
  console.log('Iniciando scraper EPEC V2...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);

  const articulos = await page.evaluate(() => {
    // Intentamos agarrar los contenedores reales de noticias de EPEC
    const selectores = ['article', '.noticia', '.card', '.contenido', 'main'];
    for (const sel of selectores) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        return Array.from(els).map(e => e.innerText).join('\n---\n');
      }
    }
    return document.body.innerText;
  });

  const cortesOrdenados = parsearCortes(articulos);

  const data = {
    fuente: URL,
    actualizado: new Date().toISOString(),
    actualizadoAR: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Cordoba' }),
    total: cortesOrdenados.length,
    cortes: cortesOrdenados,
    estado: 'OK_V2'
  };

  fs.mkdirSync('public/data', { recursive: true });
  fs.writeFileSync('public/data/epec.json', JSON.stringify(data, null, 2));

  console.log(`Guardado V2 - ${cortesOrdenados.length} cortes ordenados`);
  console.log(JSON.stringify(cortesOrdenados.slice(0,2), null, 2));

  await browser.close();
}

run();
