import { chromium } from 'playwright';
import fs from 'fs';

const URL = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);

  const raw = await page.evaluate(() => document.body.innerText);

  // Cada corte en EPEC empieza con "MOTIVO:"
  const bloques = raw.split(/MOTIVO:/i).slice(1);

  const cortes = bloques.map(b => {
    const bloque = 'MOTIVO:' + b;

    const motivoMatch = bloque.match(/Motivo:\s*([^\n]+)/i);
    const localidadMatch = bloque.match(/Localidad:\s*([^\n]+)/i);
    const zonaMatch = bloque.match(/Zona afectada:\s*([^\n]+)/i);
    const horarioMatch = bloque.match(/De\s+\d{1,2}:\d{2}\s+a\s+\d{1,2}:\d{2}/i);
    const fechaMatch = bloque.match(/\d{1,2}\/\d{1,2}\/\d{4}/);

    const motivo = motivoMatch? motivoMatch[1].trim() : 'Mantenimiento programado';
    const localidad = localidadMatch? localidadMatch[1].trim() : 'CORDOBA';
    const zona = zonaMatch? zonaMatch[1].trim() : '';
    const horario = horarioMatch? horarioMatch[0].trim() : 'A confirmar';
    const fecha = fechaMatch? fechaMatch[0].trim() : new Date().toLocaleDateString('es-AR');

    // Barrio = Zona si existe, si no Localidad
    const barrio = zona? `${localidad} - ${zona}` : localidad;

    return {
      fecha: fecha,
      barrio: barrio.substring(0, 200),
      horario: horario,
      motivo: motivo
    };
  }).filter(c => c.barrio.length > 5);

  // Eliminar duplicados y ordenar
  const unicos = [...new Map(cortes.map(c => [c.barrio + c.horario, c])).values()];
  unicos.sort((a,b) => a.horario.localeCompare(b.horario));

  const data = {
    fuente: URL,
    actualizado: new Date().toISOString(),
    actualizadoAR: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Cordoba' }),
    total: unicos.length,
    cortes: unicos,
    estado: 'OK_FINAL_V3'
  };

  fs.mkdirSync('public/data', { recursive: true });
  fs.writeFileSync('public/data/epec.json', JSON.stringify(data, null, 2));
  console.log('V3 OK:', unicos.length, 'cortes');
  console.log(JSON.stringify(unicos.slice(0,3), null, 2));
  await browser.close();
}

run();
