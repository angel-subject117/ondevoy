export default async function handler(req, res) {
  try {
    const EPEC_URL = "https://www.epec.com.ar/api/cortes";

    // Traemos hoy y mañana para no perder el 02/10
    const fechas = [];
    for(let i=0; i<3; i++){
      const d = new Date(); d.setDate(d.getDate()+i);
      const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      fechas.push(iso);
    }

    let todo = [];

    for(const f of fechas){
      try{
        const r = await fetch(EPEC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": "web-prod",
            "Origin": "https://www.epec.com.ar",
            "Referer": "https://www.epec.com.ar/"
          },
          body: JSON.stringify({ fecha: f, trabajoId: null, fechaDesde: f, fechaHasta: f })
        });
        const j = await r.json();
        const lista = Array.isArray(j) ? j : (j.data || j.trabajos || j.result || []);
        lista.forEach(item => {
          // Guardamos la fecha ISO que pedimos para no perderla
          item._fechaPedida = f;
          todo.push(item);
        });
      }catch{}
    }

    // Si no trajo nada con fechas, fallback al método viejo que te daba 32
    if(todo.length===0){
      const r = await fetch(EPEC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": "web-prod", "Origin": "https://www.epec.com.ar", "Referer": "https://www.epec.com.ar/" },
        body: JSON.stringify({ trabajoId: null })
      });
      const j = await r.json();
      todo = Array.isArray(j) ? j : (j.data || j.trabajos || j.result || []);
    }

    // --- MAPEO CON FECHA BIEN FORMATEADA (SIN new Date) ---
    const cortes = todo.map(t => {
      const de = t.horaDesde || t.desde || t.hora || '';
      const hasta = t.horaHasta || t.hasta || '';
      const motivo = t.motivo || t.descripcion || t.tipo || '';
      const zona = t.zona || t.direccion || t.localidad || t.detalle || t.observaciones || '';
      const loc = t.localidad || t.localidadNombre || 'Córdoba';

      const raw = t.fecha || t.fechaCorte || t.fechaTrabajo || t.dia || t.fechaDesde || t.fechaProgramada || t._fechaPedida || '';
      let fecha = '';
      const s = String(raw);
      const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
      if(iso){
        // 2026-10-02 -> 02/10/2026 (SIN invertir)
        fecha = `${iso[3]}/${iso[2]}/${iso[1]}`;
      }else{
        const dm = s.match(/(\d{1,2})\/(\d{4})/);
        if(dm) fecha = `${dm[1].padStart(2,'0')}/${dm[2].padStart(2,'0')}/${dm[3]}`;
        else if(s.length>=8) fecha = s.slice(0,10);
      }

      return `${fecha} - ${loc} - De ${de} a ${hasta} - Motivo: ${motivo} - Zona afectada: ${zona}`.slice(0,700);
    }).filter(x=>x.length>20);

    // Quitar duplicados
    const unicos = [...new Set(cortes)];

    res.setHeader('Access-Control-Allow-Origin','*');
    res.json({ ok:true, total: unicos.length, cortes: unicos.slice(0,150), fuente:'EPEC oficial', actualizado:new Date().toISOString() });

  } catch(e){
    res.status(500).json({ok:false, error:e.message});
  }
};
