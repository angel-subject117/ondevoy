export default async function handler(req, res) {
  try {
    const UA = "Mozilla/5.0";
    const PAGE = "https://www.epec.com.ar/actualidad/trabajos-mejoras";

    const htmlRes = await fetch(PAGE, { headers: { "User-Agent": UA } });
    const html = await htmlRes.text();
    const jsUrls = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map(m => {
      let u = m[1];
      if (u.startsWith("/")) return `https://www.epec.com.ar${u}`;
      return u.startsWith("http")? u : `https://www.epec.com.ar/${u}`;
    });

    let epecApiKey = null;
    let candidates = new Set();

    // 1. Leemos el main.js que me mostraste para sacar epecApiKey y la API real
    for (const jsUrl of jsUrls) {
      if (!jsUrl.includes("main.")) continue;
      try {
        const jr = await fetch(jsUrl, { headers: { "User-Agent": UA } });
        const js = await jr.text();
        const keyMatch = js.match(/epecApiKey["':\s]+["']([^"']+)["']/) || js.match(/apiKey["':\s]+["']([^"']{10,})["']/i) || js.match(/x-api-key["':\s]+["']([^"']+)["']/i);
        if (keyMatch) epecApiKey = keyMatch[1];

        // Buscamos también el apikey en formato web-prod
        const webProd = js.match(/web-prod/);
        if (webProd &&!epecApiKey) epecApiKey = "web-prod";

        const apis = [...js.matchAll(/["'](\/api\/[^"']+)["']/g)].map(x => x[1]);
        apis.forEach(p => {
          if (p.includes("trabajo") || p.includes("corte") || p.includes("mejora")) {
            candidates.add(`https://www.epec.com.ar${p}`);
          }
        });
      } catch {}
    }

    if (candidates.size === 0) {
      candidates.add("https://www.epec.com.ar/api/trabajos-mejoras");
      candidates.add("https://www.epec.com.ar/api/cortes");
    }

    if (!epecApiKey) epecApiKey = "web-prod"; // valor que usa EPEC históricamente

    let lista = null;
    let lastTxt = "";

    // 2. Probamos cada API con la llave que encontramos
    for (const apiUrl of candidates) {
      try {
        const r = await fetch(apiUrl, {
          headers: {
            "x-api-key": epecApiKey,
            "apikey": epecApiKey,
            "Origin": "https://www.epec.com.ar",
            "Referer": PAGE,
            "User-Agent": UA
          }
        });
        const txt = await r.text();
        lastTxt = txt.slice(0,600);
        const j = JSON.parse(txt);
        const arr = Array.isArray(j)? j : (j.data || j.trabajos || j.cortes || []);
        if (Array.isArray(arr) && arr.length > 0) { lista = arr; break; }
      } catch {}
    }

    if (!lista) throw new Error(`EPEC ${PAGE} devolvió: ${lastTxt} | Key usada: ${epecApiKey} | APIs probadas: ${[...candidates].join(", ")}`);

    const cortes = lista.map(t => {
      const loc = (t.localidad || '').toString().toUpperCase();
      const raw = String(t.fecha || '');
      let fecha = raw; const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/); if (m) fecha = `${m[3]}/${m[2]}/${m[1]}`;
      return `${fecha} - ${loc} - De ${t.horaDesde||''} a ${t.horaHasta||''} - Motivo: ${t.motivo||''} - Zona: ${t.zona||''}`.trim();
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)] });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
