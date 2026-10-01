export default async function handler(req, res) {
  try {
    // 1. Bajamos el HTML de la app nueva
    const htmlRes = await fetch("https://www.epec.com.ar/cortes-programados", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await htmlRes.text();

    // 2. Sacamos todos los.js de la app (main, runtime...)
    const jsUrls = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m => m[1]).map(u => u.startsWith("http")? u : `https://www.epec.com.ar/${u.replace(/^\//, '')}`);

    let apiCandidates = ["https://www.epec.com.ar/api/cortes", "/api/cortes", "/api/CortesProgramados", "/api/trabajos", "/api/cortes-programados"];

    // 3. Leemos los JS y buscamos donde dice "api/cortes"
    for (const jsUrl of jsUrls.slice(0, 5)) {
      try {
        const jsRes = await fetch(jsUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        const js = await jsRes.text();
        const found = [...js.matchAll(/["'](\/api\/[^"']*corte[^"']*)["']/gi)].map(m => m[1]);
        const found2 = [...js.matchAll(/["'](https:\/\/[^"']*epec[^"']*\/api\/[^"']*)["']/gi)].map(m => m[1]);
        apiCandidates = [...new Set([...apiCandidates,...found,...found2])];
      } catch {}
    }

    let lista = null;
    let lastError = "";

    // 4. Probamos todas las APIs que encontramos
    for (let api of apiCandidates) {
      const fullUrl = api.startsWith("http")? api : `https://www.epec.com.ar${api.startsWith("/")?"":"/"}${api}`;
      try {
        // Probamos POST y GET
        for (const method of ["POST", "GET"]) {
          const r = await fetch(fullUrl, {
            method,
            headers: {
              "Content-Type": "application/json",
              "apikey": "web-prod",
              "x-api-key": "web-prod",
              "Origin": "https://www.epec.com.ar",
              "Referer": "https://www.epec.com.ar/cortes-programados",
              "User-Agent": "Mozilla/5.0"
            },
            body: method === "POST"? JSON.stringify({}) : undefined
          });
          const txt = await r.text();
          try {
            const j = JSON.parse(txt);
            const arr = Array.isArray(j)? j : (j.data || j.result || j.items || j.trabajos || j.cortes || []);
            if (Array.isArray(arr) && arr.length > 0) {
              lista = arr;
              break;
            }
          } catch {}
        }
        if (lista) break;
      } catch (e) { lastError = e.message; }
    }

    if (!lista || lista.length === 0) {
      throw new Error(`No encontré cortes. Probé estas APIs: ${apiCandidates.join(", ")} | Ultimo error: ${lastError} | HTML v: ${html.match(/version[^>]+content="([^"]+)"/)?.[1]}`);
    }

    const cortes = lista.map(t => {
      const loc = (t.localidad || t.localidadNombre || t.ciudad || '').toString().trim().toUpperCase();
      const raw = String(t.fecha || t.fechaCorte || '');
      let fecha = raw;
      const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) fecha = `${m[3]}/${m[2]}/${m[1]}`; // AUTOMATICO: 2026-10-05 -> 05/10/2026 futuro

      return `${fecha} - ${loc} - De ${t.horaDesde || t.desde || ''} a ${t.horaHasta || t.hasta || ''} - Motivo: ${t.motivo || ''} - Zona: ${t.zona || t.direccion || ''}`.slice(0,800);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)], actualizado: new Date().toISOString(), apis: apiCandidates });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
