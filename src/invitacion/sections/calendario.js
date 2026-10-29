// "Guarden la fecha": una hoja de calendario del mes de la boda con el día
// encerrado a mano. Toda la hoja es el enlace para agregar la boda al
// calendario del teléfono (Google Calendar; .ics en iPhone). El círculo se
// dibuja una vez, cuando la hoja entra en pantalla.
import { horaTexto } from '../../lib/fechas.js';
import { enlaceGoogleCalendar, activarCalendario } from '../../lib/calendario.js';
import { html, crudo } from '../../lib/dom.js';

const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

// { anio, mes (1-12), dia } de la fecha en la zona del evento.
function partes(iso, zona) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: zona, year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(new Date(iso)).map((x) => [x.type, Number(x.value)]));
  return { anio: p.year, mes: p.month, dia: p.day };
}

const mayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Círculo trazado a mano (un poco abierto e irregular, como pluma).
const CIRCULO = '<svg class="calendario__circulo" viewBox="0 0 60 60" aria-hidden="true"><path pathLength="1" d="M33 6C18 4 6 15 6 30c0 15 12 25 26 24 14-1 23-12 22-26C53 15 43 6 29 7"/></svg>';

export function montar(contenedor, { evento }) {
  const { anio, mes, dia } = partes(evento.fecha, evento.zonaHoraria);
  const primero = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  const total = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const nombreMes = mayuscula(new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(anio, mes - 1, 1))));
  const diaSemana = new Intl.DateTimeFormat('es-MX', { weekday: 'long', timeZone: evento.zonaHoraria }).format(new Date(evento.fecha));
  const celdas = [
    ...Array.from({ length: primero }, () => '<span></span>'),
    ...Array.from({ length: total }, (_, i) => (i + 1 === dia
      ? `<span class="calendario__dia calendario__dia--boda">${i + 1}${CIRCULO}</span>`
      : `<span class="calendario__dia">${i + 1}</span>`)),
  ];

  contenedor.className = 'calendario';
  contenedor.innerHTML = html`
    <p class="ev-etiqueta">Guarden la fecha</p>
    <a class="calendario__hoja" href="${enlaceGoogleCalendar(evento)}" target="_blank" rel="noopener"
      aria-label="Agregar la boda a mi calendario: ${diaSemana} ${dia} de ${nombreMes.toLowerCase()} de ${anio}, ${horaTexto(evento.hora)}">
      <span class="calendario__mes"><span>${nombreMes}</span> <span class="calendario__anio">${anio}</span></span>
      <span class="calendario__rejilla" aria-hidden="true">
        ${DIAS.map((d) => crudo(`<span class="calendario__semana">${d}</span>`))}
        ${crudo(celdas.join(''))}
      </span>
      <span class="calendario__pie">${mayuscula(diaSemana)} ${dia} · ${horaTexto(evento.hora)}</span>
    </a>
    <p class="calendario__accion" aria-hidden="true">Toquen la hoja para agregarla a su calendario</p>`;

  const hoja = contenedor.querySelector('.calendario__hoja');
  activarCalendario(hoja, evento);
  // El círculo se traza al llegar a la hoja (una sola vez).
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    hoja.classList.add('calendario__hoja--vista');
    io.disconnect();
  }, { threshold: 0.6 });
  io.observe(hoja);
}
