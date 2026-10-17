// api/cpcs.js - OnDeVoy - Módulo CPC - Datos oficiales 2026
// Endpoint: /api/cpcs y /api/cpcs?id=arguello

export default function handler(req, res) {
  const cpcs = [
    {
      id: "centro-america",
      nombre: "CPC Centro América",
      direccion: "Av. Juan B. Justo 4350, B° Centro América",
      zona: "Norte",
      horario: "Lun a Vie 8 a 18hs",
      horario_detalle: "Trámites de 8 a 14hs, resto hasta 18hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Licencia de Conducir", "Registro Civil", "SUBE", "Habilitación Comercial"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.369,
      lng: -64.192
    },
    {
      id: "monsenor-pablo-cabrera",
      nombre: "CPC Monseñor Pablo Cabrera",
      direccion: "Av. Monseñor Pablo Cabrera 4800, B° Poeta Lugones",
      zona: "Norte",
      horario: "Lun a Vie 8 a 18hs",
      horario_detalle: "Trámites de 8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Licencia", "Recursos Tributarios"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.348,
      lng: -64.216
    },
    {
      id: "arguello",
      nombre: "CPC Argüello",
      direccion: "Av. Rafael Núñez 6500 esq. Ricardo Rojas, B° Argüello",
      zona: "Noroeste",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "Atención por orden de llegada y turnos MiDocta",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Licencia", "Registro Civil"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.331,
      lng: -64.27
    },
    {
      id: "colon",
      nombre: "CPC Colón",
      direccion: "Av. Colón 5300, B° San Ignacio",
      zona: "Oeste",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "Licencias hasta las 18hs",
      telefono: "0800-888-0404",
      tramites: ["Licencia de Conducir", "Rentas", "SUBE"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.407,
      lng: -64.234
    },
    {
      id: "ruta-20",
      nombre: "CPC Ruta 20",
      direccion: "Av. Fuerza Aérea Argentina 4300, B° Villa Adela",
      zona: "Oeste",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Licencia", "Boleto Educativo"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.435,
      lng: -64.236
    },
    {
      id: "villa-el-libertador",
      nombre: "CPC Villa El Libertador",
      direccion: "Av. Armada Argentina 5500, B° Villa El Libertador",
      zona: "Sudoeste",
      horario: "Lun a Vie 8 a 18hs",
      horario_detalle: "Trámites hasta las 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Registro Civil", "SUBE"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.474,
      lng: -64.213
    },
    {
      id: "empalme",
      nombre: "CPC Empalme",
      direccion: "Av. Amadeo Sabattini 4650, B° Empalme",
      zona: "Sudeste",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Licencia", "Habilitación"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.429,
      lng: -64.148
    },
    {
      id: "pueyrredon",
      nombre: "CPC Pueyrredón",
      direccion: "Rincón 1630 esq. Gavilán, B° Pueyrredón",
      zona: "Este",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Registro Civil", "SUBE"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.406,
      lng: -64.152
    },
    {
      id: "rancagua",
      nombre: "CPC Rancagua",
      direccion: "Av. Rancagua 2900, B° Villa Corina",
      zona: "Nordeste",
      horario: "Lun a Vie 8 a 18hs",
      horario_detalle: "8 a 18hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Licencia", "Boleto"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.384,
      lng: -64.135
    },
    {
      id: "mercado-ciudad",
      nombre: "CPC Mercado de la Ciudad",
      direccion: "Oncativo 50, B° Centro",
      zona: "Centro",
      horario: "Lun a Vie 8 a 18hs",
      horario_detalle: "8 a 18hs - Sábados 8 a 14hs rotativos",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Habilitación Comercial", "SUBE"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.414,
      lng: -64.18
    },
    {
      id: "guinazu",
      nombre: "CPC Guiñazú",
      direccion: "Av. Juan B. Justo 9654, B° Guiñazú",
      zona: "Norte",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Registro Civil"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.347,
      lng: -64.125
    },
    {
      id: "san-vicente",
      nombre: "CPC San Vicente",
      direccion: "San Jerónimo 2850, B° San Vicente",
      zona: "Sudeste",
      horario: "Lun a Vie 8 a 18hs",
      horario_detalle: "Licencia Digital - 8 a 18hs",
      telefono: "0800-888-0404",
      tramites: ["Licencia Digital", "Rentas", "Cultura"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.426,
      lng: -64.165
    },
    {
      id: "chalet-san-felipe",
      nombre: "CPC Chalet San Felipe",
      direccion: "Diego de Torres 2731, B° José Ignacio Díaz I",
      zona: "Sudeste",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Actividades Culturales"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.447,
      lng: -64.153
    },
    {
      id: "jardin",
      nombre: "CPC Jardín",
      direccion: "Celso Barrios 1825, B° Jardín",
      zona: "Sur",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Licencia", "Boleto"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.457,
      lng: -64.188
    },
    {
      id: "capdevila",
      nombre: "CPC Capdevila",
      direccion: "Federico Rauch 2708, B° Arturo Capdevila",
      zona: "Nordeste",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Registro Civil"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.381,
      lng: -64.106
    },
    {
      id: "mercantil",
      nombre: "CPC Mercantil",
      direccion: "Onofre Marimón 7400, B° Mercantil",
      zona: "Noroeste",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "SUBE"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.36,
      lng: -64.258
    },
    {
      id: "general-paz",
      nombre: "CPC General Paz",
      direccion: "Juan P. Pringles 420, B° General Paz",
      zona: "Centro",
      horario: "Lun a Vie 8 a 14hs",
      horario_detalle: "8 a 14hs",
      telefono: "0800-888-0404",
      tramites: ["Rentas", "Habilitación"],
      link_turno: "https://midocta.cordoba.gob.ar",
      estado_vecinos: "Sin reportes hoy",
      lat: -31.419,
      lng: -64.172
    }
  ];

  // Si piden ?id=arguello devuelve solo ese
  const { id } = req.query;
  if (id) {
    const cpc = cpcs.find(c => c.id === id);
    if (cpc) return res.status(200).json(cpc);
    return res.status(404).json({ error: "CPC no encontrado" });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.status(200).json(cpcs);
}
