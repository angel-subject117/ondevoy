export default async function handler(req, res) {
  try {
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    const EPEC_URL = "https://www.epec.com.ar/actualidad/trabajos-mejoras";

    // 1. Bajamos la página REAL que me pasaste vos
    const r = await fetch(EPEC_URL, {
      headers: { "User-Agent": UA, "Accept": "text/html" }
    });
    const html = await r.text();

    if (html.includes("ERROR 404") || html.length < 1000) {
      throw new Error(`EPEC devolvió 404 en ${EPEC_URL}`);
    }

    // 2. Sacamos los js de esta página nueva
    const jsUrls = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map(m => {
      let u = m[1];
      if (u.startsWith("/")) return `https://www.epec.com.ar${u}`;
      return u.startsWith("http")? u : `https://www.epec.com.ar/${u}`;
    });

    const candidates = new Set([
      "https://www.epec.com.ar/api/trabajos-mejoras",
      "https://www.epec.com.ar/api/cortes",
      "https://www.epec.com.ar/api/CortesProgramados",
      "https://www.epec.com.ar/api/trabajos"
    ]);

    // 3. Leemos el main.js de esta página para encontrar la API real de trabajos-mejoras
    for (const jsUrl of jsUrls.slice(0, 8)) {
      try {
        const jr = await fetch(jsUrl, { headers: { "User-Agent": UA } });
        const js = await jr.text();
        const found = [...js.matchAll(/["'](\/api\/[a-zA-Z0-9\/\-_]+)["']/g)].map(x => x[1]);
        found.forEach(p => candidates.add(`https://www.epec.com.ar${p}`));
        // También busca apiUrl
        const foundFull = [...js.matchAll(/https:\/\/[^"']*epec[^"']*\/api\/[^"']*/gi)].map(x => x[0]);
        foundFull.forEach(u => candidates.add(u));
      } catch {}
    }

    let lista = null;
    let debug = { epecUrl: EPEC_URL, jsUrls, candidates: [...candidates] };

    // 4. Si la página trae los datos embebidos en el HTML, los sacamos directo
    try {
      const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
      if (nextData) {
        const data = JSON.parse(nextData[1]);
        const str = JSON.stringify(data);
        const matches = [...str.matchAll(/"localidad"\s*:\s*"([^"]+)"/g)];
        if (matches.length > 0) {
          // Tiene datos embebidos
          const arr = data?.props?.pageProps?.trabajos || data?.props?.pageProps?.cortes || [];
          if (arr.length > 0) lista = arr;
        }
      }
    } catch {}

    // 5. Si no, le pegamos a las APIs que encontramos (como hace la web oficial)
    if (!lista) {
      for (const apiUrl of candidates) {
        for (const body of [
          {},
          { fechaDesde: new Date().toISOString().slice(0,10), fechaHasta: new Date(Date.now()+7*86400000).toISOString().slice(0,10) }
        ]) {
          try {
            const ar = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Origin": "https://www.epec.com.ar",
                "Referer": EPEC_URL,
                "User-Agent": UA
              },
              body: JSON.stringify(body)
            });
            const txt = await ar.text();
            const j = JSON.parse(txt);
            const arr = Array.isArray(j)? j : (j.data || j.result || j.trabajos || j.cortes || []);
            if (Array.isArray(arr) && arr.length > 0) {
              lista = arr;
              debug.okApi = apiUrl;
              break;
            }
          } catch {}
        }
        if (lista) break;
      }
    }

    if (!lista) {
      throw new Error(`EPEC en ${EPEC_URL} no devolvió cortes. Probé APIs: ${[...candidates].join(", ")}`);
    }

    // 6. Formato exacto EPEC -> DD/MM/YYYY automático futuro
    const cortes = lista.map(t => {
      const loc = (t.localidad || t.ciudad || t.localidadNombre || '').toString().trim().toUpperCase();
      const raw = String(t.fecha || t.fechaCorte || '');
      let fecha = raw;
      const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) fecha = `${m[3]}/${m[2]}/${m[1]}`; // 2026-10-05 -> 05/10/2026 futuro automático
      return `${fecha} - ${loc} - De ${t.horaDesde || t.desde || ''} a ${t.horaHasta || t.hasta || ''} - Motivo: ${t.motivo || ''} - Zona: ${t.zona || t.direccion || ''}`.trim().slice(0,900);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)], actualizado: new Date().toISOString(), debug });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
