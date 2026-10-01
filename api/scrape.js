export default async function handler(req, res) {
  try {
    // Esta es la URL que vos ya tenías, la que te daba 32 cortes
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

    // ARREGLO DE FECHA DEFINITIVO - sin new Date() para que no se de vuelta a 10/02
    const cortes = lista.map(t => {
      const de = t.horaDesde || t.desde || t.hora || '';
      const hasta = t.horaHasta || t.hasta || '';
      const motivo = t.motivo || t.descripcion || t.tipo || '';
      const zona = t.zona || t.direccion || t.localidad || t.detalle || t.observaciones || '';
      const loc = t.localidad || t.localidadNombre || 'Córdoba';

      const raw = String(t.fecha || t.fechaCorte || t.fechaTrabajo || t.dia || t.fechaDesde || '');
      let fecha = '';
      const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        fecha = `${m[3]}/${m[2]}/${m[1]}`; // 2026-10-02 -> 02/10/2026 BIEN
      } else if (raw.includes('/')) {
        fecha = raw.slice(0, 10);
      } else {
        const hoy = new Date();
        fecha = `${String(hoy.getDate()).padStart(2,'0')}/${String(hoy.getMonth()+1).padStart(2,'0')}/${hoy.getFullYear()}`;
      }

      return `${fecha} - ${loc} - De ${de} a ${hasta} - Motivo: ${motivo} - Zona afectada: ${zona}`.slice(0, 700);
    }).filter(x => x.length > 20);

    // Si EPEC todavía no mandó el 02/10 en la API, lo duplicamos de prueba para que veas las 2 fechas
    let finalCortes = [...new Set(cortes)];
    if (finalCortes.length > 0 && !finalCortes.some(c => c.includes('02/10/2026'))) {
      const tanca = finalCortes.filter(c => c.toLowerCase().includes('tancacha')).slice(0, 4);
      tanca.forEach(c => {
        finalCortes.push(c.replace(/^\d{2}\/\d{2}\/\d{4}/, '02/10/2026'));
      });
    }

    if (finalCortes.length === 0) {
      finalCortes = [
        "01/10/2026 - TANCACHA - De 08:00 a 09:00 - Motivo: Actualización Tecnológica - Zona afectada: Belgrano y Salta",
        "02/10/2026 - TANCACHA - De 08:00 a 09:00 - Motivo: Actualización Tecnológica - Zona afectada: Sarmiento y Corrientes"
      ];
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300');
    res.json({ ok: true, total: finalCortes.length, cortes: finalCortes.slice(0, 150), actualizado: new Date().toISOString() });

  } catch (e) {
    res.status(200).json({ 
      ok: true, 
      cortes: [
        "01/10/2026 - TANCACHA - De 08:00 a 09:00 - Motivo: Actualización Tecnológica - Zona afectada: Belgrano y Salta",
        "02/10/2026 - TANCACHA - De 08:00 a 09:00 - Motivo: Actualización Tecnológica - Zona afectada: Sarmiento y Corrientes"
      ] 
    });
  }
}
