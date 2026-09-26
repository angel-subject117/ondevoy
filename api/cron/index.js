export default async function handler(req, res) {
  const fecha = new Date().toLocaleString('es-AR', {timeZone: 'America/Argentina/Cordoba'});
  console.log('🤖 Robot OnDeVoy ejecutado:', fecha);
  
  try {
    const r = await fetch('https://www.epec.com.ar/', {headers: {'User-Agent':'OnDeVoy-Bot'}});
    return res.status(200).json({ ok: true, fecha, epec_status: r.status, mensaje: 'Robot OK cada 30 min' });
  } catch(e) {
    return res.status(200).json({ ok: true, fecha, error: e.message });
  }
}