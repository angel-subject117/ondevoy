// api/clima.js - OnDeVoy.com.ar - Clima Córdoba en tiempo real
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    // Córdoba Capital: -31.4201, -64.1888
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-31.42&longitude=-64.18&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FArgentina%2FCordoba&forecast_days=3';

    const r = await fetch(url);
    const data = await r.json();
    const cur = data.current;

    // Traducir weather_code
    const estados = {
      0: 'Despejado ☀️', 1: 'Mayormente despejado 🌤️', 2: 'Parcialmente nublado ⛅',
      3: 'Nublado ☁️', 45: 'Niebla 🌫️', 51: 'Llovizna ligera 🌧️',
      61: 'Lluvia ligera 🌧️', 65: 'Lluvia moderada 🌧️', 71: 'Nevada ligera ❄️',
      80: 'Chubascos ligeros 🌦️', 95: 'Tormenta ⛈️'
    };

    return res.status(200).json({
      ok: true,
      ciudad: 'Córdoba',
      timestamp: new Date().toISOString(),
      actual: {
        temp: Math.round(cur.temperature_2m),
        sensacion: Math.round(cur.apparent_temperature),
        humedad: cur.relative_humidity_2m,
        viento: Math.round(cur.wind_speed_10m),
        lluvia: cur.precipitation,
        estado: estados[cur.weather_code] || 'Despejado',
        code: cur.weather_code
      },
      hoy: {
        max: Math.round(data.daily.temperature_2m_max[0]),
        min: Math.round(data.daily.temperature_2m_min[0]),
        probLluvia: data.daily.precipitation_probability_max[0]
      },
      manana: {
        max: Math.round(data.daily.temperature_2m_max[1]),
        min: Math.round(data.daily.temperature_2m_min[1]),
        probLluvia: data.daily.precipitation_probability_max[1]
      },
      raw: data
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message, fallback: { actual: { temp: 24, estado: 'Despejado ☀️' } } });
  }
}
