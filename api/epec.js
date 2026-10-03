export default async function handler(req, res) {
  try {
    const OFICIAL = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';
    const html = await fetch(OFICIAL, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r=>r.text());

    // 1. Sacamos todos los.js que carga la página oficial de EPEC
    const jsUrls = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m=>{
      let u=m[1]; if(u.startsWith('/')) u='https://www.epec.com.ar'+u; return u;
    }).slice(0,6);

    let candidatos = [
      'https://www.epec.com.ar/api/trabajos-mejoras',
      'https://www.epec.com.ar/api/trabajos',
      'https://www.epec.com.ar/api/cortes',
      'https://www.epec.com.ar/api/interrupciones',
      'https://www.epec.com.ar/wp-json/wp/v2/trabajos-mejoras',
      'https://www.epec.com.ar/wp-json/epec/v1/trabajos'
    ];

    // 2. Buscamos en los JS de EPEC cualquier fetch a una api interna
    for (let jsUrl of jsUrls) {
      try {
        const js = await fetch(jsUrl).then(r=>r.text());
        const finds = [...js.matchAll(/["'](\/api\/[^"']+|https:\/\/www\.epec\.com\.ar\/api\/[^"']+)["']/g)].map(m=>m[1]);
        for (let f of finds) {
          if(f.includes('trabaj') || f.includes('cort') || f.includes('interr')) {
            let full = f.startsWith('/')? 'https://www.epec.com.ar'+f : f;
            if(!candidatos.includes(full)) candidatos.push(full);
          }
        }
      } catch {}
    }

    // 3. Probamos todos los candidatos OFICIALES de EPEC hasta que uno devuelva datos
    for (let url of candidatos) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
        const txt = await r.text();
        if (txt.length > 500 && (txt.toLowerCase().includes('zona') || txt.toLowerCase().includes('motivo') || txt.toLowerCase().includes('barrio'))) {
          res.setHeader('Access-Control-Allow-Origin','*');
          res.setHeader('Content-Type','application/json');
          return res.status(200).send(JSON.stringify({ fuente: OFICIAL, api_real: url, html_len: html.length, total: 1, raw: txt.slice(0,5000), candidatos }));
        }
      } catch {}
    }

    // Si no encontramos, devolvemos todo lo que probamos para debug
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type','application/json');
    return res.status(200).send(JSON.stringify({ fuente: OFICIAL, html_len: html.length, total:0, cortes:[], candidatos, jsUrls, html_preview: html.slice(0,2000) }));

  } catch (e) {
    res.status(200).send(JSON.stringify({ error: e.message }));
  }
}
