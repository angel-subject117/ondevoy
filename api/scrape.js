export default async function handler(req, res) {
  try {
    const PAGE = "https://www.epec.com.ar/actualidad/trabajos-mejoras";
    const UA = "Mozilla/5.0";

    // 1. Bajamos el HTML vacío para sacar el buildId de Next.js
    const r = await fetch(PAGE, { headers: { "User-Agent": UA } });
    const html = await r.text();

    let buildId = null;
    let m = html.match(/\/_next\/data\/([^\/]+)\//);
    if (m) buildId = m[1];
    if (!buildId) {
      const m2 = html.match(/"buildId":"([^"]+)"/);
      if (m2) buildId = m2[1];
    }
    // fallback buildId que me mostraste vos antes
    if (!buildId) buildId = "131e961849d5e94a9578";

    // 2. Probamos todos los JSON donde EPEC guarda trabajos-mejoras
    const jsonUrls = [
      `https://www.epec.com.ar/_next/data/${buildId}/actualidad/trabajos-mejoras.json`,
      `https://www.epec.com.ar/_next/data/${buildId}/actualidad/trabajos-mejoras/trabajos-mejoras.json`,
      `https://www.epec.com.ar/_next/data/${buildId}.json?slug=actualidad/trabajos-mejoras`
    ];

    let dataJson = null;
    let lastErr = "";

    for (const ju of jsonUrls) {
      try {
        const jr = await fetch(ju, { headers: { "User-Agent": UA, "Referer": PAGE } });
        const txt = await jr.text();
        if (txt.length < 100) { lastErr = txt; continue; }
        const j = JSON.parse(txt);
        if (JSON.stringify(j).length > 500) { dataJson = j; break; }
      } catch (e) { lastErr = e.message; }
    }

    // También intenta directo el __NEXT_DATA__
    if (!dataJson) {
      try {
        const mNext = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
        if (mNext) dataJson = JSON.parse(mNext[1]);
      } catch {}
    }

    if (!dataJson) throw new Error(`EPEC no dio JSON. buildId=${buildId} probé ${jsonUrls.join(", ")} ultimo: ${lastErr} htmlLen=${html.length}`);

    const str = JSON.stringify(dataJson);
    // Busca array de trabajos dentro de pageProps
    const props = dataJson.pageProps || dataJson.props?.pageProps || dataJson;

    let lista = props.trabajos || props.cortes || props.data || props.items || props.trabajosMejoras || [];

    // Si no está directo, busca recursivo cualquier array que tenga localidad + hora
    if (!Array.isArray(lista) || lista.length === 0) {
      const found = [...str.matchAll(/"localidad"\s*:\s*"([^"]+)"/gi)];
      if (found.length > 0) {
        // Extrae objetos completos con regex simple
        const reObj = /\{[^\}]*"localidad"[^\}]*\}/gi;
        let mm;
        while ((mm = reObj.exec(str))!== null) {
          try { lista.push(JSON.parse(mm[0])); } catch {}
        }
      }
    }

    if (!Array.isArray(lista) || lista.length === 0) {
      throw new Error(`JSON de EPEC vacío. Keys: ${Object.keys(props).join(", ")} | preview: ${str.slice(0,800)}`);
    }

    const cortes = lista.map(t => {
      const loc = (t.localidad || t.ciudad || t.titulo || '').toString().toUpperCase();
      const raw = String(t.fecha || t.fechaTrabajo || '');
      let fecha = raw;
      const mm = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (mm) fecha = `${mm[3]}/${mm[2]}/${mm[1]}`;
      return `${fecha} - ${loc} - De ${t.horaDesde || t.desde || ''} a ${t.horaHasta || t.hasta || ''} - Motivo: ${t.motivo || t.descripcion || ''} - Zona: ${t.zona || t.zonaAfectada || ''}`.slice(0,900);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)], buildId });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
