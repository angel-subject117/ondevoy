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
      const de = t.horaDesde || t.desde || t.hora || '';
      const hasta = t.horaHasta || t.hasta || '';
      const motivo = t.motivo || t.descripcion || t.tipo || '';
      const zona = t.zona || t.direccion || t.localidad || t.detalle || t.observaciones || '';
      const loc = t.localidad || t.localidadNombre || 'Córdoba';

      // --- FIX FECHA REAL ---
      const fechaRaw = t.fecha || t.fechaCorte || t.fechaTrabajo || t.dia || t.fechaDesde || t.fechaProgramada || t.fechaInicio || '';
      let fecha = '';
      if (fechaRaw) {
        const d = new Date(fechaRaw);
        if (!isNaN(d.getTime())) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          fecha = `${dd}/${mm}/${yyyy}`;
        } else {
          fecha = String(fechaRaw).slice(0,10);
        }
      } else {
        // Si EPEC no manda fecha en este objeto, usamos hoy como fallback
        const hoy = new Date();
        fecha = `${String(hoy.getDate()).padStart(2,'0')}/${String(hoy.getMonth()+1).padStart(2,'0')}/${hoy.getFullYear()}`;
      }

      return `${fecha} - ${loc} - De ${de} a ${hasta} - Motivo: ${motivo} - Zona afectada: ${zona}`.slice(0, 700);
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
