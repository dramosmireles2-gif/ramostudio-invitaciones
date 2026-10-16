// Apertura del sobre. El toque del sello abre la invitación y arranca la música.
// PROVISIONAL: marcado mínimo hasta recibir el diseño de Claude Design.
import { html, crudo } from '../../lib/dom.js';

export function montar(contenedor, { evento, familia, alAbrir }) {
  contenedor.innerHTML = html`
    <section class="sobre">
      ${familia ? crudo(html`<p class="sobre__para">${familia.nombre}</p>`) : ''}
      <button type="button" class="sobre__sello" aria-label="Abrir invitación">
        ${evento.tema?.monograma ?? ''}
      </button>
    </section>`;
  contenedor.querySelector('.sobre__sello').addEventListener('click', alAbrir, { once: true });
}
