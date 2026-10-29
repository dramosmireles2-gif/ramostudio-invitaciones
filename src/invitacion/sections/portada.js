// Portada: foto de la pareja, nombres, fecha, hora y ciudad. Con la cuenta
// regresiva, cabe en los dos primeros pantallazos (quién, cuándo, dónde).
import { fechaInvitacion, horaTexto } from '../../lib/fechas.js';
import { imagen } from '../../lib/imagenes.js';
import { html, crudo } from '../../lib/dom.js';

export function montar(contenedor, { evento }) {
  contenedor.className = 'portada';
  const foto = evento.fotos?.portada;
  contenedor.innerHTML = html`
    ${foto ? crudo(imagen(evento.slug, foto, { clase: 'portada__foto', prioridad: true })) : ''}
    <div class="portada__texto">
      <p class="ev-etiqueta">Nos casamos</p>
      <h1 class="portada__nombres" tabindex="-1">${evento.titulo}</h1>
      <p class="portada__fecha">${fechaInvitacion(evento.fecha, evento.zonaHoraria)}</p>
      <span class="ev-filete" aria-hidden="true"></span>
      <p class="portada__lugar">${horaTexto(evento.hora)} · ${evento.ciudad}</p>
    </div>`;
}
