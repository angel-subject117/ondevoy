import * as cheerio from 'cheerio';

export async function GET() {
  const res = await fetch('https://www.epec.com.ar/actualidad/trabajos-mejoras', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cache: 'no-store'
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const cortes = [];
  $('body').find('*').each((i, el) => {
    const t = $(el).text();
    if(t.includes('De ') && t.includes('Motivo:')) {
      cortes.push({ texto: t.substring(0,200) });
    }
  });
  return Response.json({ ok: true, total: cortes.length, cortes });
}