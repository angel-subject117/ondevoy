export default async function handler(req, res) {
  try {
    const URL_OFICIAL = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';
    const r = await fetch(URL_OFICIAL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0',
        'Accept': 'text/html',
        'Accept-Language': 'es-AR,es;q=0.9'
      }
    });
    const html = await r.text();

    // 1. EPEC guarda todo en __NEXT_DATA__ o en scripts JSON
    let textoCompleto = html;
    const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (nextMatch) {
      try {
        const j = JSON.parse(nextMatch[1]);
        textoCompleto = JSON.stringify(j);
      } catch {}
    }

    // 2. Buscamos también todos los scripts que tengan "De:" y "Zona"
    const scripts = [...html.matchAll(/<script[^>]*>(.*?)<\/script>/gs)].map(m=>m[1]).join('\n');
    textoCompleto += '\n' + scripts;

    // 3. Extraemos cortes reales con regex del contenido oficial
    const regex = /De:\s*([\d:]+ a [\d:]+)[\s\S]{0,80}Motivo:\s*([^.]+)[\s\S]{0,80}Zona afectada:\s*([^<]+)/gi;
    let m, cortes = [];
    let fuente = html + ' ' + textoCompleto;
    while ((m = regex.exec(fuente))!== null) {
      cortes.push({
        horario: m[1].trim(),
        motivo: m[2].trim(),
        zona: m[3].trim(),
        raw: m[0].trim()
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=600');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({
      fuente: URL_OFICIAL,
      html_len: html.length,
      total: cortes.length,
      cortes
    }));

  } catch (e) {
    return res.status(200).send(JSON.stringify({ error: e.message, total: 0, cortes: [] }));
  }
}
