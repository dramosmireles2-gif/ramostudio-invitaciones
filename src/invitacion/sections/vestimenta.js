// Código de vestimenta, en banda del color del tema (en Iris & Alex, el negro
// de sus sombreros: el mismo color que piden a sus invitados). Con
// tema.vestimenta "sombrero", arriba va un sombrero vaquero dibujado a una
// línea, con pespunte en el ala y la toquilla del color del hilo.
import { html, crudo } from '../../lib/dom.js';

const SOMBRERO = `<svg class="vestimenta__sombrero" viewBox="0 0 200 112" aria-hidden="true">
  <path class="linea" d="M62 70C60 46 66 22 84 17c6-2 11 4 16 4s10-6 16-4c18 5 24 29 22 53"/>
  <path class="linea" d="M86 22c4 7 9 10 14 10s10-3 14-10"/>
  <path class="toquilla" d="M63 64c22 6 52 6 74 0"/>
  <path class="linea" d="M12 58c10 20 44 28 88 28s78-8 88-28c-4 26-40 42-88 42S16 84 12 58z"/>
  <path class="pespunte" d="M24 68c16 16 46 22 76 22s60-6 76-22"/>
</svg>`;

export function montar(contenedor, { evento }) {
  const v = evento.vestimenta;
  if (!v) return contenedor.remove();
  contenedor.className = 'vestimenta';
  contenedor.innerHTML = html`
    ${evento.tema?.vestimenta === 'sombrero' ? crudo(SOMBRERO) : ''}
    <p class="ev-etiqueta">Código de vestimenta</p>
    <h2 class="vestimenta__codigo">${v.codigo}</h2>
    ${v.detalle ? crudo(html`<p class="vestimenta__detalle">${v.detalle}</p>`) : ''}`;
}
