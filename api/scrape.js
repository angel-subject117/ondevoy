const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const html = await fetch('https://www.epec.com.ar/actualidad/trabajos-mejoras', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      cache: 'no-store'
    }).then(r => r.text());

    const $ = cheerio.load(html);
    // Agarramos TODO el texto de la página
    const fullText = $('body').text();

    // Separamos por cada corte
    const cortes = [];
    // Busca patrones tipo "De 07:30 a..."
    const regex = /De\s+\d{1,2}:\d{2}[^M]*Motivo:[^Z]*Zona[^:]*:[^\n]*/gi;
    let match;
    while ((match = regex.exec(fullText))!== null) {
      cortes.push(match[0].trim().slice(0,500));
    }

    // Si no encontró con regex, devolvemos texto plano para no quedar en 0
    if (cortes.length === 0) {
      const limpio = fullText.split('\n').filter(l => l.includes('De ') && l.length > 10).slice(0,20);
      limpio.forEach(t => cortes.push(t.trim().slice(0,500)));
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      ok: true,
      total: cortes.length,
      cortes: cortes.slice(0,50),
      actualizado: new Date().toISOString(),
      debug_len: fullText.length
    });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
