export default async function handler(req, res) {
  try {
    const OFICIAL = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';
    const base = 'https://www.epec.com.ar/';
    const html = await fetch(OFICIAL, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r=>r.text());
    const mainUrlMatch = html.match(/src="(main\.[^"]+\.js)"/);
    let mainUrl = base + (mainUrlMatch? mainUrlMatch[1] : 'main.19200b3112269040ed7.js');
    if(mainUrlMatch && mainUrlMatch[1].startsWith('http')) mainUrl = mainUrlMatch[1];
    if(!mainUrl.startsWith('http')) mainUrl = base + mainUrl;

    const mainJs = await fetch(mainUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r=>r.text());

    // Buscamos apiEndpoint = "https://...." dentro del main.js oficial
    let apiBase = null;
    let m = mainJs.match(/apiEndpoint\s*[:=]\s*["']([^"']+)["']/);
    if(m) apiBase = m[1];
    if(!apiBase){
      let m2 = mainJs.match(/environment[^}]*api[^"']*["']([^"']+epec[^"']+)["']/i);
      if(m2) apiBase = m2[1];
    }
    if(!apiBase) apiBase = 'https://www.epec.com.ar/api/'; // fallback oficial

    if(apiBase.startsWith('/')) apiBase = base + apiBase.slice(1);
    if(!apiBase.endsWith('/')) apiBase += '/';

    // Probamos los métodos reales que viste: getTrabajosMejora
    const endpoints = [
      apiBase + 'TrabajosMejora',
      apiBase + 'trabajos-mejoras',
      apiBase + 'TrabajosMejoras',
      apiBase + 'trabajosmejoras',
      apiBase + 'InterrupcionesProgramadas',
      base + 'api/TrabajosMejora'
    ];

    let data = null, urlOk = null;
    for(let u of endpoints){
      try{
        const r = await fetch(u, { headers: { 'User-Agent':'Mozilla/5.0','Accept':'application/json' } });
        const t = await r.text();
        if(t.length>200 && (t.includes('De:') || t.includes('Zona') || t.includes('Motivo') || t.includes('horario') || t.includes('barrio'))){
          data = t; urlOk = u; break;
        }
        // si es JSON array
        try{ let j=JSON.parse(t); if(Array.isArray(j) && j.length>0){ data=t; urlOk=u; break; } }catch{}
      }catch{}
    }

    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Type','application/json');
    return res.status(200).send(JSON.stringify({
      fuente: OFICIAL,
      mainJs: mainUrl,
      apiBase,
      api_real: urlOk,
      raw_preview: data? data.slice(0,6000) : mainJs.slice(mainJs.indexOf('apiEndpoint')-100, mainJs.indexOf('apiEndpoint')+400),
      total: data? 1 : 0
    }));
  } catch(e){
    return res.status(200).send(JSON.stringify({ error: e.message }));
  }
}
