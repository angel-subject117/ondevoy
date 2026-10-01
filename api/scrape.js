export default async function handler(req, res) {
  try {
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    // 1. Bajamos el shell de EPEC v1.0.858
    const htmlRes = await fetch("https://www.epec.com.ar/cortes-programados", {
      headers: { "User-Agent": UA, "Accept": "text/html" }
    });
    const html = await htmlRes.text();

    // 2. Buscamos config y js de la app
    let apiBase = null;
    const candidates = new Set();

    // Intentamos los archivos de config tipicos de Angular
    for (const cfgUrl of [
      "https://www.epec.com.ar/assets/config.json",
      "https://www.epec.com.ar/assets/environment.json",
      "https://www.epec.com.ar/assets/env.json",
      "https://www.epec.com.ar/config.json"
    ]) {
      try {
        const r = await fetch(cfgUrl, { headers: { "User-Agent": UA } });
        if (r.ok) {
          const j = await r.json();
          const str = JSON.stringify(j);
          const m = str.match(/https?:\/\/[^"]*epec[^"]*\/api[^"]*/gi);
          if (m) m.forEach(x => candidates.add(x));
          if (j.apiUrl) candidates.add(j.apiUrl);
          if (j.API_URL) candidates.add(j.API_URL);
        }
      } catch {}
    }

    // Sacamos todos los.js del html
    const jsUrls = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map(m => {
      let u = m[1];
      if (u.startsWith("/")) return `https://www.epec.com.ar${u}`;
      if (u.startsWith("http")) return u;
      return `https://www.epec.com.ar/${u}`;
    });

    // Leemos hasta 6 js y buscamos adentro la URL de cortes
    for (const jsUrl of jsUrls.slice(0, 8)) {
      try {
        const jr = await fetch(jsUrl, { headers: { "User-Agent": UA } });
        const js = await jr.text();
        const found = [...js.matchAll(/["']((?:https?:\/\/[^"']*epec[^"']*\/)?api\/[^"']*corte[^"']*)["']/gi)].map(x => x[1]);
        const found2 = [...js.matchAll(/["']((?:https?:\/\/[^"']*epec[^"']*\/)?api\/[^"']*trabajo[^"']*)["']/gi)].map(x => x[1]);
        [...found,...found2].forEach(u => {
          const full = u.startsWith("http")? u : `https://www.epec.com.ar${u.startsWith("/")?"":"/"}${u}`;
          candidates.add(full);
        });
      } catch {}
    }

    // Si no encontró nada, probamos los endpoints históricos que EPEC usó en 5663
    if (candidates.size === 0) {
      candidates.add("https://www.epec.com.ar/api/cortes");
      candidates.add("https://www.epec.com.ar/api/CortesProgramados");
      candidates.add("https://www.epec.com.ar/api/trabajos");
    }

    let lista = null;
    let debug = { htmlVersion: html.match(/content="([^"]+)"/)?.[1], jsUrls, candidates: [...candidates] };

    // 3. Probamos cada API encontrada con el payload que usa la app nueva
    for (const apiUrl of candidates) {
      try {
        // La app v1.0.858 manda POST con { fechaDesde, fechaHasta } o vacío
        const bodyOptions = [
          {},
          { fecha: new Date().toISOString().slice(0,10) },
          { fechaDesde: new Date().toISOString().slice(0,10), fechaHasta: new Date(Date.now()+7*86400000).toISOString().slice(0,10) }
        ];
        for (const body of bodyOptions) {
          const r = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": "web-prod",
              "x-api-key": "web-prod",
              "Origin": "https://www.epec.com.ar",
              "Referer": "https://www.epec.com.ar/cortes-programados",
              "User-Agent": UA
            },
            body: JSON.stringify(body)
          });
          const txt = await r.text();
          if (txt.length < 10) continue;
          try {
            const j = JSON.parse(txt);
            const arr = Array.isArray(j)? j : (j.data || j.result || j.items || j.trabajos || j.cortes || j.lista || []);
            if (Array.isArray(arr) && arr.length > 0) {
              lista = arr;
              debug.okUrl = apiUrl;
              debug.okBody = body;
              break;
            }
          } catch {}
        }
        if (lista) break;
      } catch (e) { debug.lastErr = e.message; }
    }

    if (!lista) {
      throw new Error(`EPEC v${debug.htmlVersion} no devolvió cortes. Candidates: ${[...candidates].join(", ")} | js: ${jsUrls.join(", ")}`);
    }

    // 4. Formateo exacto EPEC -> DD/MM/YYYY genérico futuro automático
    const cortes = lista.map(t => {
      const loc = (t.localidad || t.localidadNombre || t.ciudad || '').toString().trim().toUpperCase();
      const raw = String(t.fecha || t.fechaCorte || t.fechaTrabajo || '');
      let fecha = raw;
      const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) fecha = `${m[3]}/${m[2]}/${m[1]}`; // 2026-10-05 -> 05/10/2026 automático
      return `${fecha} - ${loc} - De ${t.horaDesde || t.desde || ''} a ${t.horaHasta || t.hasta || ''} - Motivo: ${t.motivo || ''} - Zona: ${t.zona || t.direccion || ''}`.trim().slice(0,900);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)], actualizado: new Date().toISOString(), debug });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Sin array falso, solo error real de EPEC para seguir afinando
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
