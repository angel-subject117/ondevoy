export default async function handler(req, res) {
  try {
    const API_URL = "https://www.epec.com.ar/api/mantenimiento/trabajos-mejora";
    const PAGE = "https://www.epec.com.ar/actualidad/trabajos-mejoras";

    // PASO 1: Entramos a tu link para robar la cookiesession1 que viste vos
    const pageRes = await fetch(PAGE, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    const setCookies = pageRes.headers.get('set-cookie') || '';
    // juntamos todas las cookies
    let sessionCookie = "";
    const allCookies = pageRes.headers.getSetCookie? pageRes.headers.getSetCookie() : [setCookies];
    const cookiesession = allCookies.join("; ").match(/cookiesession1=[^;]+/);
    if (cookiesession) sessionCookie = cookiesession[0];
    else sessionCookie = setCookies.split(",").find(c=>c.includes("cookiesession1"))?.split(";")[0] || "";

    if (!sessionCookie) throw new Error("No pude obtener cookiesession1 de EPEC. set-cookie: " + setCookies.slice(0,300));

    // PASO 2: POST a la API que cazaste con esa cookie + Apikey web-prod
    const bodies = [
      {},
      {"tipo":"MEJORAS"},
      {"tipo":"TODOS"},
      {"fecha": new Date().toISOString().slice(0,10)}
    ];

    let lista = null;
    let lastTxt = "";

    for (const body of bodies) {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Apikey": "web-prod",
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*",
          "Origin": "https://www.epec.com.ar",
          "Referer": PAGE,
          "Cookie": sessionCookie,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: JSON.stringify(body)
      });
      const txt = await r.text();
      lastTxt = txt.slice(0, 800);
      try {
        const j = JSON.parse(txt);
        if (j.message && j.message.includes("Invalid")) continue; // probar siguiente body
        const arr = Array.isArray(j)? j : (j.data || j.result || j.trabajos || []);
        if (Array.isArray(arr) && arr.length > 0) { lista = arr; break; }
        if (Array.isArray(j) && j.length > 0) { lista = j; break; }
      } catch {}
    }

    if (!lista) throw new Error(`EPEC sigue con auth. Cookie usada: ${sessionCookie} Ultimo: ${lastTxt}`);

    const cortes = lista.map(t => {
      const loc = (t.localidad || t.ciudad || '').toString().toUpperCase();
      const fechaRaw = String(t.fecha || '');
      let fecha = fechaRaw;
      const m = fechaRaw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) fecha = `${m[3]}/${m[2]}/${m[1]}`;
      return `${fecha} - ${loc} - De ${t.horaDesde || t.desde || ''} a ${t.horaHasta || t.hasta || ''} - Motivo: ${t.motivo || ''} - Zona: ${t.zona || ''}`.slice(0,900);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)] });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
