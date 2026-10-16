// Formatos de fecha en español de México.
const LOCALE = 'es-MX';

export function fechaLarga(iso, zona = 'America/Mexico_City') {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: zona,
  }).format(new Date(iso));
}

export function hora(iso, zona = 'America/Mexico_City') {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: 'numeric', minute: '2-digit', timeZone: zona,
  }).format(new Date(iso));
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
