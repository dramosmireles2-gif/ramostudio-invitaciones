// "Agregar al calendario": Google Calendar en Android y escritorio; en iPhone
// y iPad, un archivo .ics que abre el calendario del teléfono.
const DURACION_HORAS = 6;

// 2026-12-05T00:00:00.000Z → 20261205T000000Z
const utc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function datos(evento) {
  const inicio = new Date(evento.fecha);
  const fin = new Date(inicio.getTime() + DURACION_HORAS * 3600000);
  const primera = evento.sedes?.[0];
  return {
    titulo: `Boda de ${evento.titulo}`,
    inicio: utc(inicio),
    fin: utc(fin),
    lugar: primera ? `${primera.nombre}, ${primera.direccion}` : evento.ciudad,
    detalle: (evento.sedes ?? []).map((s) => `${s.tipo}: ${s.nombre}, ${s.direccion}`).join('\n'),
  };
}

export function enlaceGoogleCalendar(evento) {
  const d = datos(evento);
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: d.titulo, dates: `${d.inicio}/${d.fin}`, location: d.lugar, details: d.detalle,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

const esIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const icsTexto = (s) => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

function descargarIcs(evento) {
  const d = datos(evento);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RamoStudio//Invitacion//ES', 'BEGIN:VEVENT',
    `UID:${evento.id}@ramostudio`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${d.inicio}`, `DTEND:${d.fin}`,
    `SUMMARY:${icsTexto(d.titulo)}`, `LOCATION:${icsTexto(d.lugar)}`, `DESCRIPTION:${icsTexto(d.detalle)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `boda-${evento.slug}.ics` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Para el enlace "Agregar al calendario": en iOS cambia el enlace por el .ics.
export function activarCalendario(enlace, evento) {
  enlace.addEventListener('click', (e) => {
    if (!esIOS()) return;
    e.preventDefault();
    descargarIcs(evento);
  });
}
