module.exports = async (req, res) => {
  try {
    // Ahora usamos la API OFICIAL de EPEC
    const r = await fetch("https://www.epec.com.ar/api/mantenimiento/trabajos-mejora", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "web-prod",
        "Origin": "https://www.epec.com.ar",
        "Referer": "https://www.epec.com.ar/"
      },
      body: JSON.stringify({ trabajoId: null })
    });

    const json = await r.json();
    // La API devuelve un array
    const lista = Array.isArray(json) ? json : (json.data || json.trabajos || json.result || []);

    const cortes = lista.map(t => {
      const de = t.horaDesde || t.desde || '';
      const hasta = t.horaHasta || t.hasta || '';
      const motivo = t.motivo || t.descripcion || t.tipo || '';
      const zona = t.zona || t.direccion || t.localidad || t.detalle || '';
      const loc = t.localidad || 'Córdoba';
      return `${loc} - De ${de} a ${hasta} - Motivo: ${motivo} - Zona afectada: ${zona}`.slice(0, 600);
    }).filter(x => x.length > 20);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      ok: true,
      total: cortes.length,
      cortes: cortes.slice(0, 100),
      fuente: 'EPEC oficial (epec.com.ar)',
      actualizado: new Date().toISOString()
    });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ ok: false, error: e.message });
  }
};
