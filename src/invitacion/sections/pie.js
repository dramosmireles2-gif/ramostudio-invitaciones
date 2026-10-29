// Pie: nombres, fecha en números y crédito de las fotos.
import { fechaNumerica } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';

export function montar(contenedor, { evento }) {
  contenedor.className = 'pie';
  contenedor.innerHTML = html`
    <span class="pie__sello" aria-hidden="true">${evento.tema?.monograma ?? ''}</span>
    <p class="pie__nombres">${evento.titulo}</p>
    <p class="pie__fecha">${fechaNumerica(evento.fecha, { zona: evento.zonaHoraria }).replaceAll('/', ' · ')}</p>
    ${evento.creditoFotos ? crudo(html`<p class="pie__credito">Fotos: ${evento.creditoFotos}</p>`) : ''}
    <p class="pie__credito">Invitación: RamoStudio</p>`;
}
