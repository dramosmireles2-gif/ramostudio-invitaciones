// Modo demo del panel (DEMO_MODE en config.js): el evento demo entra sin login
// y lleva una franja fija arriba con "Quiero la mía" y "Reiniciar demo".
import { DEMO_MODE, DEMO_EVENT_SLUG } from '../config.js';
import { enlaceQuieroLaMia } from '../lib/links.js';
import { html } from '../lib/dom.js';
import { abrirConfirmacion } from '../lib/ui.js';

export const esDemo = (evento) => DEMO_MODE && evento.slug === DEMO_EVENT_SLUG;

export function montarFranjaDemo(data) {
  const franja = document.createElement('div');
  franja.className = 'franja-demo';
  franja.innerHTML = html`
    <p class="franja-demo__texto">Estás viendo un demo<span aria-hidden="true"> · </span>
      <a class="franja-demo__whatsapp" href="${enlaceQuieroLaMia()}" target="_blank" rel="noopener">Quiero la mía</a></p>
    <button class="btn btn--quiet franja-demo__reiniciar" type="button">Reiniciar demo</button>`;
  franja.querySelector('button').addEventListener('click', () => abrirConfirmacion({
    titulo: '¿Reiniciar el demo?',
    texto: 'Se borran los cambios que hiciste (confirmaciones, mesas, mensajes) y vuelven los datos de ejemplo.',
    confirmar: 'Sí, reiniciar',
    alConfirmar: async () => {
      await data.reiniciarDemo();
      location.hash = 'resumen';
      location.reload();
    },
  }));
  document.body.classList.add('con-franja-demo');
  document.body.prepend(franja);
}
