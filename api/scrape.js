export default async function handler(req, res) {
  try {
    const PAGE = "https://www.epec.com.ar/actualidad/trabajos-mejoras";
    const UA = "Mozilla/5.0";

    const r = await fetch(PAGE, { headers: { "User-Agent": UA } });
    const html = await r.text();

    // Sacamos todas las urls que parecen API dentro de esos 12433 chars
    const allApis = [...html.matchAll(/["'`]([^"'`]*api[^"'`]{0,80})["'`]/gi)].map(x=>x[1]).slice(0,50);
    const allJson = [...html.matchAll(/["'`]([^"'`]*trabajos[^"'`]{0,80})["'`]/gi)].map(x=>x[1]).slice(0,50);

    let found = [...new Set([...allApis,...allJson])];

    let pruebas = [];
    for (const p of found.slice(0,15)) {
      let full = p;
      if (p.startsWith("/")) full = `https://www.epec.com.ar${p}`;
      else if (!p.startsWith("http")) continue;
      try {
        const rr = await fetch(full, { headers: { "User-Agent": UA, "Referer": PAGE } });
        const txt = (await rr.text()).slice(0,300);
        pruebas.push(`${full} -> ${rr.status} -> ${txt}`);
      } catch (e) { pruebas.push(`${full} -> error ${e.message}`); }
    }

    throw new Error(`HTML len=${html.length}. Posibles APIs en el HTML: ${found.join(" | ")} || Pruebas: ${pruebas.join(" || ")} || HTML inicio: ${html.slice(0,1000)}`);

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
