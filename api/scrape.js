export default async function handler(req, res) {
  try {
    const UA = "Mozilla/5.0";
    const PAGE = "https://www.epec.com.ar/actualidad/trabajos-mejoras";

    // 1. Bajamos la página que me pasaste
    const htmlRes = await fetch(PAGE, { headers: { "User-Agent": UA } });
    const html = await htmlRes.text();

    // 2. Sacamos TODOS los JS de esa página
    const jsUrls = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map(m => {
      let u = m[1];
      if (u.startsWith("/")) return `https://www.epec.com.ar${u}`;
      return u.startsWith("http")? u : `https://www.epec.com.ar/${u}`;
    });

    let candidates = new Set([
      "https://www.epec.com.ar/api/trabajos-mejoras",
      "https://www.epec.com.ar/api/cortes",
      "https://www.epec.com.ar/api/trabajos"
    ]);

    let foundApis = [];

    for (const jsUrl of jsUrls.slice(0, 10)) {
      try {
        const jr = await fetch(jsUrl, { headers: { "User-Agent": UA } });
        const js = await jr.text();
        // Buscamos CUALQUIER cosa que parezca API de EPEC
        const matches = [...js.matchAll(/["'`]([^"'`]*api[^"'`]*?)["'`]/gi)].map(x => x[1]).filter(s => s.length < 100);
        matches.forEach(m => {
          let full = m;
          if (m.startsWith("/")) full = `https://www.epec.com.ar${m}`;
          if (full.includes("epec") || full.includes("/api/")) {
            candidates.add(full);
            foundApis.push(`${jsUrl.split("/").pop()} -> ${full}`);
          }
        });
      } catch {}
    }

    // 3. Probamos TODAS las APIs con GET y POST como hace la web real
    let lista = null;
    let lastTxt = "";

    for (const apiUrl of candidates) {
      try {
        // GET
        let r = await fetch(apiUrl, {
          headers: { "User-Agent": UA, "Origin": "https://www.epec.com.ar", "Referer": PAGE }
        });
        let txt = await r.text();
        lastTxt = txt.slice(0,500);
        try {
          const j = JSON.parse(txt);
          const arr = Array.isArray(j)? j : (j.data || j.result || j.trabajos || j.cortes || j.items || []);
          if (Array.isArray(arr) && arr.length > 0) { lista = arr; break; }
        } catch {}
        // POST
        r = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": UA, "Origin": "https://www.epec.com.ar", "Referer": PAGE },
          body: JSON.stringify({ fechaDesde: new Date().toISOString().slice(0,10) })
        });
        txt = await r.text();
        lastTxt = txt.slice(0,500);
        try {
          const j = JSON.parse(txt);
          const arr = Array.isArray(j)? j : (j.data || j.result || j.trabajos || j.cortes || []);
          if (Array.isArray(arr) && arr.length > 0) { lista = arr; break; }
        } catch {}
      } catch {}
    }

    if (!lista) {
      throw new Error(`EPEC en ${PAGE} no devolvió cortes. Probé APIs: ${[...candidates].join(", ")} | Encontradas en main.js: ${foundApis.slice(0,20).join(" | ")} | Ultima respuesta: ${lastTxt}`);
    }

    const cortes = lista.map(t => {
      const loc = (t.localidad || t.ciudad || '').toString().toUpperCase();
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
