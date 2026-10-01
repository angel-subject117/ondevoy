export default async function handler(req, res) {
  try {
    const r = await fetch("https://www.epec.com.ar/api/cortes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": "web-prod", "Origin": "https://www.epec.com.ar", "Referer": "https://www.epec.com.ar/" },
      body: JSON.stringify({ trabajoId: null })
    });
    const j = await r.json();
    const lista = Array.isArray(j) ? j : (j.data || j.trabajos || j.result || []);

    const cortes = lista.map(t => {
      const de = t.horaDesde || t.desde || '';
      const hasta = t.horaHasta || t.hasta || '';
      const motivo = t.motivo || t.descripcion || '';
      const zona = t.zona || t.direccion || t.detalle || '';
      const loc = t.localidad || 'Córdoba';
      const raw = String(t.fecha || t.fechaCorte || '');
      let fecha = '';
      const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if(m) fecha = `${m[3]}/${m[2]}/${m[1]}`; // 2026-10-02 -> 02/10/2026 BIEN
      else fecha = raw.slice(0,10);
      return `${fecha} - ${loc} - De ${de} a ${hasta} - Motivo: ${motivo} - Zona: ${zona}`.slice(0,700);
    });

    res.setHeader('Access-Control-Allow-Origin','*');
    res.json({ ok:true, total: cortes.length, cortes: [...new Set(cortes)], actualizado: new Date().toISOString() });
  } catch(e) {
    res.status(200).json({ ok:false, error: e.message, cortes: [] });
  }
}
