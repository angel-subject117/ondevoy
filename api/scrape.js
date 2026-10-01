module.exports = async (req, res) => {
  try {
    // La Voz publica todos los días los cortes de EPEC en texto plano
    const urls = [
      'https://www.lavoz.com.ar/tag/cortes-de-epec/',
      'https://www.lavoz.com.ar/servicios/'
    ];

    let html = "";
    for (const u of urls) {
      try {
        const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (r.ok) {
          const t = await r.text();
          if (t.length > 5000) { html = t; break; }
        }
      } catch {}
    }

    // Si no pudimos traer La Voz, usamos el HTML directo que trae algo
    if (!html || html.length < 1000) {
      html = await fetch('https://www.lavoz.com.ar/servicios/epec-los-cortes-de-luz-programados-en-cordoba-para-este-miercoles-30-de-septiembre/', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(r=>r.text()).catch(()=> "");
    }

    const cortes = [];
    // Limpia tags
    const text = html.replace(/<script[\s\S]*?<\/script>/gi,' ')
                     .replace(/<style[\s\S]*?<\/style>/gi,' ')
                     .replace(/<[^>]*>/g, '\n');

    // Busca el patrón típico de La Voz / EPEC
    const regex = /(De\s+\d{1,2}:\d{2}\s+a\s+\d{1,2}:\d{2}[\s\S]{0,250}?Motivo:[\s\S]{0,250}?Zona afectada:[^\n]{0,400})/gi;
    let m;
    while ((m = regex.exec(text))!== null) {
      let t = m[0].replace(/\s+/g,' ').trim();
      if (t.length > 30) cortes.push(t.slice(0,600));
    }

    // Fallback: líneas sueltas
    if (cortes.length === 0) {
      text.split('\n').forEach(l=>{
        l=l.trim();
        if(l.toLowerCase().includes('de ') && l.includes('Motivo') && l.length > 20) cortes.push(l.slice(0,600));
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      ok: true,
      total: cortes.length,
      cortes: cortes.slice(0,40),
      fuente: 'La Voz (replica EPEC)',
      actualizado: new Date().toISOString(),
      debug_len: html.length
    });
  } catch(e){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ ok:false, error:e.message });
  }
};
