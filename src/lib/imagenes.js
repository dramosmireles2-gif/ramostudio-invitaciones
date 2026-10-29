// Fotos de un evento (eventos/<slug>/fotos/, generadas con npm run fotos):
// AVIF y WebP con respaldo JPG, width/height para que la página no salte y
// carga diferida salvo en la primera foto de la pantalla.
import { html, crudo } from './dom.js';

// foto = { nombre, anchos: [640, 1079], ancho, alto, foco, alt } (de evento.json).
export function imagen(slug, foto, { clase = '', prioridad = false, sizes = '100vw' } = {}) {
  const base = `/eventos/${slug}/fotos/${foto.nombre}`;
  const srcset = (ext) => foto.anchos.map((a) => `${base}-${a}.${ext} ${a}w`).join(', ');
  const carga = prioridad ? 'fetchpriority="high"' : 'loading="lazy"';
  return html`<picture class="${clase}">
    <source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">
    <source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">
    <img src="${base}-${foto.anchos[0]}.jpg" srcset="${srcset('jpg')}" sizes="${sizes}"
      width="${foto.ancho}" height="${foto.alto}" alt="${foto.alt}" decoding="async" ${crudo(carga)}
      style="object-position: ${foto.foco ?? '50% 50%'}">
  </picture>`;
}
