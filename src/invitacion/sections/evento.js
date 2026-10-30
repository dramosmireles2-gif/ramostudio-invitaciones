// Ceremonia y recepción: foto del lugar (si hay), hora, lugar, dirección, el
// mapa a la vista y los botones "Cómo llegar" (Google Maps) y Waze.
// El mapa es el "Insertar un mapa" de Google (sede.mapaEmbed), en blanco y
// negro para ir con la invitación y con carga diferida (solo se descarga al
// acercarse). Sin mapaEmbed no se muestra mapa: los botones bastan.
import { horaTexto } from '../../lib/fechas.js';
import { enlaceGoogleMaps, enlaceWaze } from '../../lib/mapas.js';
import { imagen } from '../../lib/imagenes.js';
import { html, crudo } from '../../lib/dom.js';

// Solo mapas insertados de Google Maps.
const esEmbedDeMaps = (url) => /^https:\/\/www\.google\.com\/maps\/embed\?/.test(url ?? '');

export function montar(contenedor, { evento }) {
  contenedor.className = 'sedes';
  contenedor.innerHTML = html`
    <h2 class="ev-titulo">Ceremonia y recepción</h2>
    ${(evento.sedes ?? []).map((s) => crudo(html`<article class="sede">
      ${s.foto ? crudo(imagen(evento.slug, s.foto, { clase: 'sede__foto', sizes: '(max-width: 560px) 100vw, 512px' })) : ''}
      <p class="ev-etiqueta">${s.tipo}</p>
      <p class="sede__hora">${horaTexto(s.hora)}</p>
      <h3 class="sede__nombre">${s.nombre}</h3>
      <p class="sede__direccion">${s.direccion}</p>
      ${esEmbedDeMaps(s.mapaEmbed) ? crudo(html`<div class="sede__mapa">
        <iframe src="${s.mapaEmbed}" title="Mapa de ${s.nombre}" loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>`) : ''}
      <div class="sede__botones">
        <a class="btn btn--secondary btn--full" href="${enlaceGoogleMaps(s)}" target="_blank" rel="noopener">Cómo llegar</a>
        <a class="ev-enlace" href="${enlaceWaze(s)}" target="_blank" rel="noopener">Abrir en Waze</a>
      </div>
    </article>`))}`;
}
