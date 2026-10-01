export default async function handler(req, res) {
  try {
    const PAGE = "https://www.epec.com.ar/actualidad/trabajos-mejoras";
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

    const r = await fetch(PAGE, {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html",
        "Cache-Control": "no-cache"
      }
    });
    const html = await r.text();

    if (html.length < 1000) throw new Error(`EPEC HTML vacío: ${html.slice(0,200)}`);

    // Pasamos HTML a texto plano
    let text = html
     .replace(/<script[\s\S]*?<\/script>/gi, "\n")
     .replace(/<style[\s\S]*?<\/style>/gi, "\n")
     .replace(/<[^>]+>/g, "\n")
     .replace(/&nbsp;/g, " ")
     .replace(/\n+/g, "\n");

    let cortes = [];
    // EPEC escribe así en esa página nueva:
    // ALTA GRACIA
    // De 08:00 a 11:00
    // Motivo: Nuevas Obras
    // Zona afectada: Barrios...
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Localidad en mayúsculas
      if (/^[A-ZÁÉÍÓÚÑ\s]{4,30}$/.test(line) && line === line.toUpperCase() && line.length > 3) {
        const loc = line;
        if (["TRABAJOS", "MEJORAS", "EPEC", "CORTES", "ENERGIA", "ACTUALIDAD"].some(x => loc.includes(x))) continue;

        // Buscamos las siguientes 5 líneas que tengan De...a... Motivo... Zona...
        let bloque = lines.slice(i, i+6).join(" | ");
        const mHora = bloque.match(/De\s+(\d{1,2}:\d{2})\s+a\s+(\d{1,2}:\d{2})/i);
        const mMotivo = bloque.match(/Motivo:\s*([^|]+)/i);
        const mZona = bloque.match(/Zona[^:]*:\s*([^|]+)/i);

        if (mHora) {
          const fecha = new Date().toLocaleDateString('es-AR'); // EPEC muestra el día actual en esa página
          // Si hay fecha en el bloque, usala
          const mFecha = bloque.match(/(\d{1,2}\/\d{1,2}\/\d{4})/) || bloque.match(/(\d{4}-\d{2}-\d{2})/);
          let f = fecha;
          if (mFecha) {
            const raw = mFecha[1];
            if (raw.includes("-")) { const p=raw.split("-"); f=`${p[2]}/${p[1]}/${p[0]}`; } else f=raw;
          }
          cortes.push(`${f} - ${loc} - De ${mHora[1]} a ${mHora[2]} - Motivo: ${mMotivo?mMotivo[1].trim():""} - Zona: ${mZona?mZona[1].trim():""}`.slice(0,900));
        }
      }
    }

    // Fallback: regex global sobre el texto plano
    if (cortes.length === 0) {
      const re = /([A-ZÁÉÍÓÚÑ\s]{4,30})\s*\|\s*De\s+(\d{1,2}:\d{2})\s+a\s+(\d{1,2}:\d{2})/gi;
      let m;
      while ((m = re.exec(text))!== null) {
        const loc = m[1].trim();
        if (loc.length < 4) continue;
        cortes.push(`${new Date().toLocaleDateString('es-AR')} - ${loc} - De ${m[2]} a ${m[3]}`);
      }
    }

    if (cortes.length === 0) {
      throw new Error(`No pude parsear ${PAGE}. Texto muestra: ${text.slice(0, 800)}...`);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: true, total: cortes.length, cortes: [...new Set(cortes)], url: PAGE });

  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ ok: false, error: e.message, cortes: [] });
  }
}
