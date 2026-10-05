// /api/aguas.js - Proxy para Aguas Cordobesas ArcGIS (evita CORS)
export default async function handler(req, res) {
  const ARCGIS_URL = "https://arcgis.aguascordobesas.com.ar/arcgis/rest/services/rmt_ctrl/GESTION_CORTES_WKID102100/MapServer/0/query?f=json&where=1=1&outFields=*&returnGeometry=false&resultRecordCount=100&orderByFields=Fecha_Inicio_Prevista%20DESC";

  try {
    const response = await fetch(ARCGIS_URL, {
      headers: {
        'User-Agent': 'OnDeVoy-Cordoba/1.0',
        'Referer': 'https://www.aguascordobesas.com.ar/'
      }
    });

    if (!response.ok) throw new Error(`ArcGIS error ${response.status}`);

    const data = await response.json();

    // Cache 10 min en Vercel
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ 
      error: "No se pudo obtener cortes de Aguas Cordobesas",
      detail: error.message 
    });
  }
}
