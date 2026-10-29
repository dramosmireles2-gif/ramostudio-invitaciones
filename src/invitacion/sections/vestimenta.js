// Código de vestimenta, en banda del color del tema (en Iris & Alex, el negro
// de sus sombreros: el mismo color que piden a sus invitados).
import { html, crudo } from '../../lib/dom.js';

export function montar(contenedor, { evento }) {
  const v = evento.vestimenta;
  if (!v) return contenedor.remove();
  contenedor.className = 'vestimenta';
  contenedor.innerHTML = html`
    <p class="ev-etiqueta">Código de vestimenta</p>
    <h2 class="vestimenta__codigo">${v.codigo}</h2>
    ${v.detalle ? crudo(html`<p class="vestimenta__detalle">${v.detalle}</p>`) : ''}`;
}
