export default async function handler(req, res) {
  try {
    const page = await fetch("https://www.epec.com.ar/cortes-programados", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
        "Referer": "https://www.epec.com.ar/"
      }
    });
    const html = await page.text();

    // EPEC guarda los cortes dentro del JSON de Next.js
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (!nextDataMatch) throw new Error("EPEC no mandó __NEXT_DATA__ - HTML: " + html.slice(0,300));

    const data = JSON.parse(nextDataMatch[1]);
    // Buscamos recursivamente donde estén los cortes
    const jsonStr = JSON.stringify(data);
    const cortesRaw = [];

    // EPEC los tiene como { localidad, fecha, horaDesde, horaHasta, motivo, zona }
    const regex = /\{"localidad":"([^"]+)".*?"fecha":"([^"]+)".*?"horaDesde":"([^"]+)".*?"horaHasta":"([^"]+)".*?"motivo":"([^"]+)".*?"zona":"([^"]+)"\}/g;
    let m;
    while ((m = regex.exec(jsonStr))!== null) {
      cortesRaw.push(m);
    }

    // Si no lo encontró con regex, busca en props
    let lista = [];
    try {
      lista = data?.props?.pageProps?.cortes || data?.props?.pageProps?.trabajos || [];
    } catch {}

    const finalLista = cortesRaw.length > 0? cortesRaw.map(x => ({
      localidad: x[1], fecha: x[2], horaDesde: x[3], horaHasta: x[4], motivo: x[5], zona: x[6]
    })) : lista;

    if (!finalLista || finalLista.length === 0) {
      throw new Error("EPEC devolvió página pero sin cortes. Está vacío hoy en la web oficial también.");
    }

    const cortes = finalLista.map(t => {
      const loc = (t.localidad || '').toString().trim().toUpperCase();
      let fecha = '';
      const raw = String(t.fecha || '');
      const fm = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (fm) fecha = `${fm[3]}/${fm[2]}/${fm[1]}`; // 2026-10-01 -> 01/10/2026
      else fecha = raw.slice(0,10);

      return `${fecha} - ${loc} - De ${t.horaDesde || ''} a ${t.horaHasta || ''} - Motivo: ${t.motivo || ''} - Zona: ${t.zona || ''}`.trim();
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)], actualizado: new Date().toISOString() });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
