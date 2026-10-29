// Apertura del sobre: el gran momento. Sobre del color del tema con borde de
// pespunte, solapa curva y el sello con el monograma. Al tocar el sello
// (el gesto que también arranca la música) la solapa se levanta, una tarjeta
// del color de la invitación sale del sobre hasta llenar la pantalla y la
// invitación ya montada aparece debajo: el paso de oscuro a claro es un
// movimiento, no un corte. Unos 2.5 s; sin animación si el invitado pidió
// reducir movimiento.
import { html } from '../../lib/dom.js';

const DURACION_MS = 2450;

export function montar(raiz, { evento, familia, alAbrir }) {
  const nodo = document.createElement('div');
  nodo.className = 'sobre';
  nodo.setAttribute('role', 'dialog');
  nodo.setAttribute('aria-label', `Invitación de ${evento.titulo}`);
  nodo.innerHTML = html`
    <div class="sobre__tarjeta" aria-hidden="true"></div>
    <svg class="sobre__solapa" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
      <path class="sobre__solapa-papel" d="M0 0H100V30Q50 62 0 30Z" />
      <path class="sobre__solapa-pespunte" d="M0 26Q50 56 100 26" vector-effect="non-scaling-stroke" />
    </svg>
    <div class="sobre__para">
      <p class="sobre__etiqueta">${familia ? 'Para' : 'Una invitación para'}</p>
      <p class="sobre__familia">${familia?.nombre ?? 'ustedes'}</p>
    </div>
    <button type="button" class="sobre__sello" aria-label="Abrir la invitación">
      <span class="sobre__monograma">${evento.tema?.monograma ?? ''}</span>
    </button>
    <div class="sobre__pie">
      <p class="sobre__nombres">${evento.titulo}</p>
      <p class="sobre__ayuda">Toquen el sello para abrir</p>
    </div>`;
  raiz.append(nodo);
  document.body.classList.add('con-sobre');
  nodo.querySelector('.sobre__sello').focus({ preventScroll: true });

  nodo.querySelector('.sobre__sello').addEventListener('click', async () => {
    await alAbrir();
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    nodo.classList.add('sobre--abriendo');
    setTimeout(() => {
      nodo.remove();
      document.body.classList.remove('con-sobre');
      window.scrollTo(0, 0);
      document.querySelector('#app h1')?.focus({ preventScroll: true });
    }, quieto ? 0 : DURACION_MS);
  }, { once: true });
}
