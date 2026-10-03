export default async function handler(req, res) {
  try {
    const URL_OFICIAL = 'https://www.epec.com.ar/actualidad/trabajos-mejoras';
    const r = await fetch(URL_OFICIAL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-AR,es;q=0.9'
      },
      cache: 'no-store'
    });
    const html = await r.text();

    // EPEC es una SPA: los cortes vienen en un JSON dentro del HTML
    // Lo buscamos en __NEXT_DATA__ o en cualquier script
    let data = html;

    // Intentamos extraer el JSON de Next.js si existe
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (match) {
      try {
        const json = JSON.parse(match[1]);
        data = JSON.stringify(json); // para debug, contiene los cortes
        // Si el json tiene los cortes, lo devolvemos directo
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(JSON.stringify({ html_len: html.length, next_data: json }));
      } catch(e) {}
    }

    // Si no hay NEXT_DATA, devolvemos el HTML crudo oficial para que epec.html lo parsee
    // Este es el reflejo exacto de EPEC, sin tocar La Voz ni nada
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=600');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (e) {
    res.status(200).send('Error leyendo EPEC oficial: ' + e.message);
  }
}
