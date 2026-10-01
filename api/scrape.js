export default async function handler(req, res) {
  try {
    // 1. Leer la página oficial para sacar la configuración real
    const pageRes = await fetch("https://www.epec.com.ar/cortes-programados", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await pageRes.text();

    // 2. Buscar apikey y endpoint reales dentro del HTML (como hace la web)
    let apiKey = "web-prod";
    let apiUrl = "https://www.epec.com.ar/api/cortes";

    const keyMatch = html.match(/apikey["']?\s*[:=]\s*["']([^"']+)["']/i) || html.match(/x-api-key["']?\s*[:=]\s*["']([^"']+)["']/i);
    if (keyMatch) apiKey = keyMatch[1];

    const urlMatch = html.match(/["'](https:\/\/[^"']*epec\.com\.ar\/api\/[^"']*cortes[^"']*)["']/i) || html.match(/["'](\/api\/[^"']*cortes[^"']*)["']/i);
    if (urlMatch) {
      apiUrl = urlMatch[1].startsWith("http")? urlMatch[1] : `https://www.epec.com.ar${urlMatch[1]}`;
    }

    // 3. Pedir los cortes con la key REAL que usa la web hoy
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
        "x-api-key": apiKey,
        "Origin": "https://www.epec.com.ar",
        "Referer": "https://www.epec.com.ar/cortes-programados"
      },
      body: JSON.stringify({ trabajoId: null, fecha: null })
    });

    const text = await r.text();
    let j;
    try { j = JSON.parse(text); } catch { j = []; }

    const lista = Array.isArray(j)? j : (j.data || j.trabajos || j.result || j.items || []);

    if (!lista || lista.length === 0) {
      throw new Error(`EPEC devolvio vacio hoy. Respuesta: ${text.slice(0,200)} | apiUrl: ${apiUrl} | key: ${apiKey}`);
    }

    const cortes = lista.map(t => {
      const loc = (t.localidad || t.localidadNombre || t.ciudad || 'CORDOBA').toString().trim().toUpperCase();
      const de = t.horaDesde || t.desde || t.horaInicio || '';
      const hasta = t.horaHasta || t.hasta || t.horaFin || '';

      // Fecha REAL sin darla vuelta: 2026-10-01 -> 01/10/2026
      let fecha = '';
      const raw = String(t.fecha || t.fechaCorte || t.fechaTrabajo || '');
      const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) fecha = `${m[3]}/${m[2]}/${m[1]}`;
      else if (raw.match(/\d{2}\/\d{2}\/\d{4}/)) fecha = raw.slice(0,10);
      else fecha = new Date().toLocaleDateString('es-AR'); // hoy si no viene

      return `${fecha} - ${loc} - De ${de} a ${hasta} - Motivo: ${t.motivo || ''} - Zona: ${t.zona || t.direccion || ''}`.slice(0,800);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)], actualizado: new Date().toISOString(), fuente: apiUrl });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // NO devuelve ficticio, devuelve el error real para que veamos qué pasa
    return res.status(200).json({ ok: false, error: e.message, cortes: [], actualizado: new Date().toISOString() });
  }
}
