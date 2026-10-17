// Formatos de fecha en español de México.
const LOCALE = 'es-MX';

export function fechaLarga(iso, zona = 'America/Mexico_City') {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: zona,
  }).format(new Date(iso));
}

// "7:00 p. m." (con el espacio de la ortografía mexicana, no "p.m.").
export function hora(iso, zona = 'America/Mexico_City') {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: 'numeric', minute: '2-digit', timeZone: zona,
  }).format(new Date(iso))
    .replace(/\s/g, ' ')
    .replace(/([ap])\.\s?m\./i, (_, l) => `${l.toLowerCase()}. m.`);
}

// "12/12/2026", o "12/12/26" con { corta: true }.
export function fechaNumerica(iso, { corta = false, zona = 'America/Mexico_City' } = {}) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit', month: '2-digit', year: corta ? '2-digit' : 'numeric', timeZone: zona,
  }).format(new Date(iso));
}

// "Hoy", "Ayer" o "14/10/2026", para agrupar la actividad por día.
export function diaRelativo(iso, ahora = new Date(), zona = 'America/Mexico_City') {
  const dia = (d) => fechaNumerica(d, { zona });
  if (dia(iso) === dia(ahora)) return 'Hoy';
  if (dia(iso) === dia(new Date(ahora.getTime() - 86400000))) return 'Ayer';
  return dia(iso);
}

export function saludo(ahora = new Date()) {
  const h = ahora.getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

// { dias, horas, minutos, segundos } hasta la fecha; todo en 0 si ya pasó.
export function cuentaRegresiva(iso, ahora = Date.now()) {
  let ms = Math.max(0, new Date(iso).getTime() - ahora);
  const dias = Math.floor(ms / 86400000); ms -= dias * 86400000;
  const horas = Math.floor(ms / 3600000); ms -= horas * 3600000;
  const minutos = Math.floor(ms / 60000); ms -= minutos * 60000;
  return { dias, horas, minutos, segundos: Math.floor(ms / 1000) };
}

const relativo = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

// "hace 3 horas", "ayer", …
export function haceCuanto(iso, ahora = Date.now()) {
  const seg = Math.round((new Date(iso).getTime() - ahora) / 1000);
  const pasos = [[60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.35, 'week'], [12, 'month']];
  let v = seg;
  for (const [tam, unidad] of pasos) {
    if (Math.abs(v) < tam) return relativo.format(Math.round(v), unidad);
    v /= tam;
  }
  return relativo.format(Math.round(v), 'year');
}

// Lee "dd/mm/aaaa". Devuelve { dia, mes, anio } o null si no es una fecha real.
export function leerFechaNumerica(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto ?? '').trim());
  if (!m) return null;
  const [dia, mes, anio] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(anio, mes - 1, dia);
  return d.getDate() === dia && d.getMonth() === mes - 1 ? { dia, mes, anio } : null;
}

// Mientras se escribe: deja solo números y pone las diagonales ("07112026" → "07/11/2026").
export function formatearMientrasEscribe(texto) {
  const n = String(texto).replace(/\D/g, '').slice(0, 8);
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4)].filter(Boolean).join('/');
}
