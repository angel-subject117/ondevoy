export default async function handler(req, res) {
  try {
    const r = await fetch("https://www.epec.com.ar/api/cortes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "web-prod",
        "Origin": "https://www.epec.com.ar",
        "Referer": "https://www.epec.com.ar/"
      },
      body: JSON.stringify({ trabajoId: null })
    });
    
    const j = await r.json();
    const lista = Array.isArray(j) ? j : (j.data || j.trabajos || j.result || j.cortes || []);

    const cortes = lista.map(t => {
      const de = t.horaDesde || t.desde || '';
      const hasta = t.horaHasta || t.hasta || '';
      const motivo = t.motivo || t.descripcion || '';
      const zona = t.zona || t.direccion || t.detalle || '';
      const loc = (t.localidad || 'CORDOBA').toString().trim().toUpperCase();
      
      // FIX FECHA: 2026-10-02 -> 02/10/2026 (no 10/02)
      let fecha = '01/10/2026';
      const raw = String(t.fecha || t.fechaCorte || '');
      const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) fecha = `${m[3]}/${m[2]}/${m[1]}`;
      else if (raw.match(/\d{2}\/\d{2}\/\d{4}/)) fecha = raw.slice(0,10);

      return `${fecha} - ${loc} - De ${de} a ${hasta} - Motivo: ${motivo} - Zona: ${zona}`.slice(0,800);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)], actualizado: new Date().toISOString() });

  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message, cortes: [] });
  }
}
