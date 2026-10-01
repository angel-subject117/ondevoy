export async function GET() {
  try {
    const res = await fetch("https://www.epec.com.ar/api/mantenimiento/trabajos-mejora", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "web-prod",
        "Origin": "https://www.epec.com.ar",
        "Referer": "https://www.epec.com.ar/"
      },
      body: JSON.stringify({ trabajoId: null }),
      cache: "no-store"
    });
    const json = await res.json();
    return Response.json(json, { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return Response.json({ error: "EPEC no responde", detalle: String(e) }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
