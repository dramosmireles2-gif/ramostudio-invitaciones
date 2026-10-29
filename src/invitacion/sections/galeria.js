// Galería (evento.fotos.galeria): ritmo de papelería, una foto a lo ancho y
// luego dos lado a lado. Todas con carga diferida.
import { imagen } from '../../lib/imagenes.js';
import { html, crudo } from '../../lib/dom.js';

export function montar(contenedor, { evento }) {
  const fotos = evento.fotos?.galeria ?? [];
  if (!fotos.length) return contenedor.remove();
  contenedor.className = 'galeria';
  contenedor.innerHTML = html`
    <h2 class="ev-etiqueta galeria__titulo">${evento.titulo}</h2>
    <div class="galeria__rejilla">
      ${fotos.map((f, i) => crudo(imagen(evento.slug, f, {
        clase: `galeria__foto${i % 3 === 0 ? ' galeria__foto--ancha' : ''}`,
        sizes: i % 3 === 0 ? '100vw' : '50vw',
      })))}
    </div>`;
}
