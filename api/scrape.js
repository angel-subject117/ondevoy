module.exports = async (req, res) => {
  try {
    const url = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';
    let html = "";

    // Intento 1: proxy raw (devuelve HTML directo, no JSON)
    try {
      const r1 = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
      if (r1.ok) html = await r1.text();
    } catch {}

    // Intento 2: si falló, otro proxy
    if (!html || html.length < 500) {
      try {
        const r2 = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        if (r2.ok) html = await r2.text();
      } catch {}
    }

    // Intento 3: directo con headers de navegador real
    if (!html || html.length < 500) {
      const r3 = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-AR,es;q=0.9'
        }
      });
      html = await r3.text();
    }

    const cortes = [];
    const regex = /De\s+\d{1,2}:\d{2}[^<]{0,400}Motivo:[^<]{0,300}/gi;
    let m;
    while ((m = regex.exec(html))!== null) {
      let t = m[0].replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim();
      if (t.length > 15) cortes.push(t.slice(0,600));
    }

    // Si todavía no, buscamos líneas que parezcan cortes
    if (cortes.length === 0) {
      const lines = html.replace(/<[^>]*>/g, '\n').split('\n');
      lines.forEach(l => {
        l = l.trim();
        if (l.toLowerCase().includes('de ') && l.toLowerCase().includes('motivo') && l.length > 20) {
          cortes.push(l.slice(0,600));
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
      debug_preview: html.slice(0,300)
    });
  } catch(e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ ok: false, error: e.message });
  }
};
