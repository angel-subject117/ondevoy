export default async function handler(req, res) {
  try {
    const API_URL = "https://www.epec.com.ar/api/mantenimiento/trabajos-mejora";
    const PAGE = "https://www.epec.com.ar/actualidad/trabajos-mejoras";

    const pageRes = await fetch(PAGE, { headers: { "User-Agent": "Mozilla/5.0" } });

    let sessionCookie = "";
    try {
      const rawCookies = pageRes.headers.getSetCookie? pageRes.headers.getSetCookie() : [];
      const all = rawCookies.length? rawCookies.join(" ") : (pageRes.headers.get('set-cookie') || '');
      const match = all.match(/cookiesession1=[^;]+/);
      if (match) sessionCookie = match[0];
    } catch {}

    const bodies = [{}, { tipo: "MEJORAS" }, { tipo: "TODOS" } ];
    let lista = null;

    for (const body of bodies) {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Apikey": "web-prod",
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Origin": "https://www.epec.com.ar",
          "Referer": PAGE,
          "Cookie": sessionCookie,
          "User-Agent": "Mozilla/5.0"
        },
        body: JSON.stringify(body)
      });
      const txt = await r.text();
      try {
        const j = JSON.parse(txt);
        if (j.message?.includes("Invalid")) continue;
        const arr = Array.isArray(j)? j : (j.data || j.result || j.trabajos || []);
        if (arr.length > 0) { lista = arr; break; }
      } catch {}
    }

    if (!lista) throw new Error("EPEC no devolvió datos");

    const cortes = lista.map(t => ({
      barrio: (t.localidad || t.ciudad || 'Córdoba').toString(),
      hora: `De ${t.horaDesde || t.desde || '?'} a ${t.horaHasta || t.hasta || '?'}`,
      motivo: t.motivo || t.tipo || 'Mantenimiento',
      zona: t.zona || t.direccion || t.detalle || '',
      fecha: t.fecha || '',
      texto: `${t.fecha || ''} - ${t.localidad || ''} - ${t.zona || ''}`
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json(cortes); // <-- ahora devuelve array directo

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json([]);
  }
}
