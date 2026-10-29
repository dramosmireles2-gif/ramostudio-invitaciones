// Galería (evento.fotos.galeria): una foto a lo ancho y luego un par lado a
// lado, y así. Cada foto con su aspecto completo (sin recorte): en un par, cada
// una ocupa un ancho proporcional a su aspecto para que las dos midan lo mismo
// de alto. Todas con carga diferida.
import { imagen } from '../../lib/imagenes.js';
import { html, crudo } from '../../lib/dom.js';

// [a, b, c, d, e, f] → [[a], [b, c], [d], [e, f]]
function filas(fotos) {
  const out = [];
  for (let i = 0; i < fotos.length;) {
    const ancha = out.length % 2 === 0 || i === fotos.length - 1;
    out.push(fotos.slice(i, i + (ancha ? 1 : 2)));
    i += ancha ? 1 : 2;
  }
  return out;
}

export function montar(contenedor, { evento }) {
  const fotos = evento.fotos?.galeria ?? [];
  if (!fotos.length) return contenedor.remove();
  contenedor.className = 'galeria';
  contenedor.innerHTML = html`
    <h2 class="ev-etiqueta galeria__titulo">${evento.titulo}</h2>
    ${filas(fotos).map((fila) => crudo(html`<div class="galeria__fila">
      ${fila.map((f) => crudo(html`<div class="galeria__celda" style="flex: ${fila.length === 1 ? 1 : (f.ancho / f.alto).toFixed(4)} 1 0">
        ${crudo(imagen(evento.slug, f, { clase: 'galeria__foto', sizes: fila.length === 1 ? '100vw' : '50vw' }))}
      </div>`))}
    </div>`))}`;
}
