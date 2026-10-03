export default async function handler(req, res) {
  const r = await fetch('https://www.epec.com.ar/actualidad/trabajos-mejoras', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await r.text();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800');
  res.status(200).send(html);
}
