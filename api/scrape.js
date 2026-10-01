module.exports = async (req, res) => {
  try {
    // Usamos un proxy para que EPEC no nos bloquee
    const target = encodeURIComponent('https://www.epec.com.ar/actualidad/trabajos-mejoras');
    const proxyUrl = `https://api.allorigins.win/get?url=${target}`;

    const data = await fetch(proxyUrl).then(r => r.json());
    const html = data.contents || "";

    // Parseo simple sin cheerio para no fallar
    const cortes = [];
    const regex = /De\s+\d{1,2}:\d{2}[^<]{0,300}Motivo:[^<]{0,200}Zona[^:]*:[^<]{0,300}/gi;
    let m;
    while ((m = regex.exec(html))!== null) {
      // Limpia tags
      let t = m[0].replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim();
      if (t.length > 20) cortes.push(t.slice(0,500));
    }

    // Plan B: si aún no encuentra, busca líneas sueltas
    if (cortes.length === 0 && html.length > 0) {
      html.split('\n').forEach(line => {
        if (line.includes('De ') && line.includes('Motivo')) {
          cortes.push(line.replace(/<[^>]*>/g,'').trim().slice(0,500));
        }
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      ok: true,
      total: cortes.length,
      cortes: cortes.slice(0,50),
      actualizado: new Date().toISOString(),
      debug_len: html.length,
      debug_preview: html.slice(0,200)
    });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
