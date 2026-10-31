// Música de fondo: el reproductor oficial de YouTube, discreto y al tamaño
// mínimo que permite YouTube (200 x 200 px, a la vista; más chico o escondido
// rompe sus condiciones y puede dejar de sonar). Suena desde que el invitado
// toca el sello; el botón de música la silencia. Solo si evento.musica.youtube.
import { html, crudo } from '../../lib/dom.js';

export function montar(contenedor, { evento, musica }) {
  const m = evento.musica;
  if (!m?.youtube || !musica.montarReproductor) return contenedor.remove();
  contenedor.className = 'cancion';
  contenedor.innerHTML = html`
    <p class="ev-etiqueta">Música de fondo</p>
    <p class="cancion__titulo"><em>${m.titulo}</em>${m.artista ? crudo(html` · ${m.artista}`) : ''}</p>
    <div class="cancion__marco"><div class="cancion__video"></div></div>`;
  musica.montarReproductor(contenedor.querySelector('.cancion__video'));
}
