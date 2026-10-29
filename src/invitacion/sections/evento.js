// Ceremonia y recepción: hora, lugar, dirección, "Cómo llegar" (Google Maps),
// Waze y "Agregar al calendario". Sin mapa embebido: pesa y en WhatsApp
// estorba; el botón abre la app de mapas del teléfono.
import { horaTexto } from '../../lib/fechas.js';
import { enlaceGoogleMaps, enlaceWaze } from '../../lib/mapas.js';
import { enlaceGoogleCalendar, activarCalendario } from '../../lib/calendario.js';
import { html, crudo } from '../../lib/dom.js';

export function montar(contenedor, { evento }) {
  contenedor.className = 'sedes';
  contenedor.innerHTML = html`
    <h2 class="ev-titulo">Ceremonia y recepción</h2>
    ${(evento.sedes ?? []).map((s) => crudo(html`<article class="sede">
      <p class="ev-etiqueta">${s.tipo}</p>
      <p class="sede__hora">${horaTexto(s.hora)}</p>
      <h3 class="sede__nombre">${s.nombre}</h3>
      <p class="sede__direccion">${s.direccion}</p>
      <div class="sede__botones">
        <a class="btn btn--secondary btn--full" href="${enlaceGoogleMaps(s)}" target="_blank" rel="noopener">Cómo llegar</a>
        <a class="ev-enlace" href="${enlaceWaze(s)}" target="_blank" rel="noopener">Abrir en Waze</a>
      </div>
    </article>`))}
    <a class="btn btn--secondary btn--full sedes__calendario" href="${enlaceGoogleCalendar(evento)}" target="_blank" rel="noopener">Agregar al calendario</a>`;
  activarCalendario(contenedor.querySelector('.sedes__calendario'), evento);
}
