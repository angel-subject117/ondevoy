export default async function handler(req, res) {
  try {
    const OFICIAL = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';
    const base = 'https://www.epec.com.ar/';
    const html = await fetch(OFICIAL, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r=>r.text());

    // Sacamos los JS reales de EPEC (runtime, main, polyfills)
    const rawSrcs = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m=>m[1]);
    const jsUrls = rawSrcs.map(s=>{
      if(s.startsWith('http')) return s;
      if(s.startsWith('/')) return base + s.slice(1);
      return base + s; // runtime.XXX.js -> https://www.epec.com.ar/runtime.XXX.js
    }).filter(u=>!u.includes('gstatic') &&!u.includes('googlemaps'));

    let apiReal = null;
    let rawApi = '';
    let candidatos = [];

    // Leemos el main.js de EPEC para encontrar su fetch interno
    for (let jsUrl of jsUrls) {
      try {
        const js = await fetch(jsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r=>r.text());
        // buscamos cualquier cosa que parezca endpoint de EPEC
        const matches = [...js.matchAll(/["']([^"']*trabajo[^"']*|[^"']*interrup[^"']*|[^"']*corte[^"']*)["']/gi)];
        for (let mm of matches) {
          let c = mm[1];
          if(c.length>4 && c.length<120) candidatos.push(c + ' -> de ' + jsUrl.split('/').pop());
          if(c.includes('/api/') || c.includes('trabajos') || c.includes('interrup')) {
            if(c.startsWith('/')) c = base + c.slice(1);
            if(c.startsWith('api/')) c = base + c;
            if(c.startsWith('http') && c.includes('epec.com.ar')) {
              try {
                const rr = await fetch(c, { headers: { 'Accept': 'application/json' } }).then(r=>r.text());
                if(rr.length>300 && rr.toLowerCase().includes('zona')) {
                  apiReal = c; rawApi = rr.slice(0,8000); break;
                }
              } catch {}
            }
          }
        }
        if(apiReal) break;
      } catch {}
    }

    // Si no lo encontró en JS, probamos los oficiales más comunes de EPEC
    const pruebaDirecta = [
      'https://www.epec.com.ar/api/trabajos-mejoras/list',
      'https://www.epec.com.ar/api/interrupciones',
      'https://www.epec.com.ar/api/v1/trabajos',
      'https://www.epec.com.ar/api/CortesProgramados'
    ];
    if(!apiReal){
      for(let u of pruebaDirecta){
        try{
          const txt = await fetch(u, { headers: { 'User-Agent':'Mozilla/5.0','Accept':'application/json' } }).then(r=>r.text());
          if(txt.length>500 && txt.toLowerCase().includes('zona')){ apiReal=u; rawApi=txt.slice(0,8000); break; }
        }catch{}
      }
    }

    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type','application/json');
    return res.status(200).send(JSON.stringify({
      fuente: OFICIAL,
      html_len: html.length,
      jsUrls,
      candidatos: candidatos.slice(0,30),
      api_real: apiReal,
      raw: rawApi,
      total: apiReal?1:0,
      cortes: []
    }));
  } catch(e){
    return res.status(200).send(JSON.stringify({ error: e.message }));
  }
}
