// "Nuestra canción": el reproductor oficial de YouTube a la vista (YouTube lo
// pide así), con el título y la artista. Suena desde que el invitado toca el
// sello; el botón de música la silencia. Solo si evento.musica.youtube.
import { html, crudo } from '../../lib/dom.js';

export function montar(contenedor, { evento, musica }) {
  const m = evento.musica;
  if (!m?.youtube || !musica.montarReproductor) return contenedor.remove();
  contenedor.className = 'cancion';
  contenedor.innerHTML = html`
    <p class="ev-etiqueta">Nuestra canción</p>
    <p class="cancion__titulo">${m.titulo}</p>
    ${m.artista ? crudo(html`<p class="cancion__artista">${m.artista}</p>`) : ''}
    <div class="cancion__marco"><div class="cancion__video"></div></div>`;
  musica.montarReproductor(contenedor.querySelector('.cancion__video'));
}
