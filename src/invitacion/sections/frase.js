// La frase de la pareja (evento.frase), tal como la escribieron.
import { html } from '../../lib/dom.js';

export function montar(contenedor, { evento }) {
  if (!evento.frase) return contenedor.remove();
  contenedor.className = 'frase';
  contenedor.innerHTML = html`<blockquote class="frase__texto"><p>${evento.frase}</p></blockquote>`;
}
