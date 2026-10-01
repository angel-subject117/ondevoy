// src/app/api/cortes/route.js - API OFICIAL EPEC cazada por vos
export async function POST() {
  try {
    const res = await fetch("https://www.epec.com.ar/api/mantenimiento/trabajos-mejora", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "web-prod",
        "Origin": "https://www.epec.com.ar",
      },
      body: JSON.stringify({ trabajoId: null }),
    });

    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "EPEC no responde" }, { status: 500 });
  }
}

// Para que tu web lo pueda llamar con GET también
export async function GET() {
  return POST();
}
