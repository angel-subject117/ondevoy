export default async function handler(req, res) {
  try {
    const API_URL = "https://www.epec.com.ar/api/mantenimiento/trabajos-mejora";
    const PAGE = "https://www.epec.com.ar/actualidad/trabajos-mejoras";

    // Content-Length 18 que viste vos = {"tipo":"MEJORAS"} = 18 chars exactos
    // Probamos los 3 bodys que EPEC usa con ese largo
    const bodies = [
      {},
      {"tipo":"MEJORAS"},
      {"tipo":"TODOS"}
    ];

    let lista = null;
    let lastTxt = "";

    for (const body of bodies) {
      try {
        const r = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Apikey": "web-prod",
            "apikey": "web-prod",
            "x-api-key": "web-prod",
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://www.epec.com.ar",
            "Referer": PAGE,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          body: JSON.stringify(body)
        });
        const txt = await r.text();
        lastTxt = txt.slice(0, 500);
        const j = JSON.parse(txt);
        const arr = Array.isArray(j)? j : (j.data || j.result || j.trabajos || j.items || []);
        if (Array.isArray(arr) && arr.length > 0) {
          lista = arr;
          break;
        }
        // a veces EPEC devuelve objeto directo con la lista adentro
        if (Array.isArray(j) === false && typeof j === 'object' && Object.keys(j).length > 5) {
          // si es un objeto con muchas keys pero no array, igual puede ser la lista como objeto
          const vals = Object.values(j);
          if (vals.length > 0 && typeof vals[0] === 'object') { lista = vals; break; }
        }
      } catch {}
    }

    if (!lista) throw new Error(`EPEC ${API_URL} no devolvió lista. Ultimo: ${lastTxt}`);

    const cortes = lista.map(t => {
      const loc = (t.localidad || t.ciudad || t.localidadNombre || '').toString().toUpperCase();
      const fechaRaw = String(t.fecha || t.fechaTrabajo || t.fechaDesde || '');
      let fecha = fechaRaw;
      const m = fechaRaw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) fecha = `${m[3]}/${m[2]}/${m[1]}`;
      return `${fecha} - ${loc} - De ${t.horaDesde || t.desde || t.horaInicio || ''} a ${t.horaHasta || t.hasta || t.horaFin || ''} - Motivo: ${t.motivo || t.descripcion || t.tipo || ''} - Zona: ${t.zona || t.zonaAfectada || t.direccion || ''}`.slice(0, 900);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)], api: API_URL });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
