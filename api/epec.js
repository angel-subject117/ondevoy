// api/epec.js - Lee SOLO la oficial de EPEC
export default async function handler(req, res) {
  try {
    const r = await fetch('https://www.epec.com.ar/actualidad/trabajos-mejoras', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await r.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).json({ error: 'EPEC no responde' });
  }
}
