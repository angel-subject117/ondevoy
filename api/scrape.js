const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const html = await fetch('https://www.epec.com.ar/actualidad/trabajos-mejoras', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }).then(r => r.text());
  
  const $ = cheerio.load(html);
  const cortes = [];
  $('p').each((i, el) => {
    const t = $(el).text();
    if(t.includes('Motivo:')) cortes.push(t.trim().slice(0,400));
  });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ ok: true, total: cortes.length, cortes, actualizado: new Date() });
};
