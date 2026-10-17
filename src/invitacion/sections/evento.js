// Sección "evento" de la invitación: ceremonia y recepción.
// PROVISIONAL: solo los lugares (hora, dirección, mapa al tocar y botones para
// Google Maps y Waze) hasta recibir el diseño completo de Claude Design.
import { hora as formatoHora } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';
import { enlaceGoogleMaps, enlaceWaze, mapaAlTocar, activarMapas } from '../../lib/mapas.js';

// "17:00" → "5:00 p. m." en la zona del evento.
function horaLegible(hhmm, fechaIso, zona) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(fechaIso);
  d.setUTCHours(h + 6, m, 0, 0); // CDMX es UTC−6 todo el año.
  return formatoHora(d.toISOString(), zona);
}

export function montar(contenedor, { evento }) {
  contenedor.dataset.seccion = 'evento';
  contenedor.className = 'lugares';
  contenedor.innerHTML = (evento.sedes ?? []).map((s) => html`<article class="lugar">
    <div class="lugar__tipo">${s.tipo}</div>
    <h2 class="lugar__nombre">${s.nombre}</h2>
    ${s.hora ? crudo(html`<p class="lugar__hora">${horaLegible(s.hora, evento.fecha, evento.zonaHoraria)}</p>`) : ''}
    ${s.direccion ? crudo(html`<p class="lugar__direccion">${s.direccion}</p>`) : ''}
    ${crudo(mapaAlTocar(s))}
    <div class="lugar__botones">
      <a class="btn btn--full" href="${enlaceGoogleMaps(s)}" target="_blank" rel="noopener">Abrir en Google Maps</a>
      <a class="btn btn--secondary btn--full" href="${enlaceWaze(s)}" target="_blank" rel="noopener">Abrir en Waze</a>
    </div>
  </article>`).join('');
  activarMapas(contenedor);
}
