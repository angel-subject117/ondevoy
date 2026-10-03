export default async function handler(req, res) {
  try {
    const URL_REAL = 'https://www.epec.com.ar/api/mantenimiento/trabajos-mejora';
    const r = await fetch(URL_REAL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Apikey': 'web-prod',
        'Origin': 'https://www.epec.com.ar',
        'Referer': 'https://www.epec.com.ar/actualidad/trabajos-mejoras',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({}) // EPEC a veces pide {} o {"id":0}, con {} ya devuelve todo
    });
    let data = await r.text();
    let json;
    try { json = JSON.parse(data); } catch { json = []; }
    // Si viene con data.data
    let cortes = Array.isArray(json) ? json : (json.data || json.result || json.trabajos || []);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({
      fuente: 'https://www.epec.com.ar/actualidad/trabajos-mejoras',
      api_real: URL_REAL,
      total: cortes.length,
      cortes: cortes,
      raw_preview: data.slice(0,1000)
    }));
  } catch (e) {
    return res.status(200).send(JSON.stringify({ error: e.message, total: 0, cortes: [] }));
  }
}
