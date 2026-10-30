// Apertura del sobre: el gran momento. Un sobre del color del tema (solapa
// curva, pespunte y sello con el monograma) flota despacio sobre el papel de
// la invitación. Al tocar el sello (el gesto que también arranca la música) el
// sello cede, la solapa se levanta, cae una lluvia de rombos, puntos y
// puntadas, el sobre crece un poco y se desvanece, y la invitación ya montada
// aparece debajo. Todo el fondo ya es del color de la invitación, así que no
// hay salto de oscuro a claro. Unos 1.8 s; sin animación si el invitado pidió
// reducir movimiento.
import { fechaNumerica } from '../../lib/fechas.js';
import { html } from '../../lib/dom.js';

const DURACION_MS = 1800;
const PIEZAS = 36;

// Lluvia al abrir: rombos del acento, puntos y puntadas del hilo (ver CSS).
function lluvia() {
  const formas = ['rombo', 'punto', 'puntada', 'rombo', 'punto'];
  for (let i = 0; i < PIEZAS; i++) {
    const p = document.createElement('span');
    p.className = `lluvia lluvia--${formas[i % formas.length]}`;
    p.style.left = `${Math.random() * 100}vw`;
    p.style.setProperty('--giro', `${(Math.random() - 0.5) * 600}deg`);
    p.style.setProperty('--deriva', `${(Math.random() - 0.5) * 18}vw`);
    p.style.animationDuration = `${2.4 + Math.random() * 1.6}s`;
    p.style.animationDelay = `${Math.random() * 0.9}s`;
    p.addEventListener('animationend', () => p.remove(), { once: true });
    document.body.append(p);
  }
}

export function montar(raiz, { evento, familia, alAbrir }) {
  const nodo = document.createElement('div');
  nodo.className = 'sobre';
  nodo.setAttribute('role', 'dialog');
  nodo.setAttribute('aria-label', `Invitación de ${evento.titulo}`);
  nodo.innerHTML = html`
    <div class="sobre__carta">
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
        <p class="sobre__fecha">${fechaNumerica(evento.fecha, { zona: evento.zonaHoraria }).replaceAll('/', ' · ')}</p>
      </div>
    </div>
    <p class="sobre__ayuda" aria-hidden="true"><span class="sobre__punto"></span>Toquen el sello para abrir<span class="sobre__punto"></span></p>`;
  raiz.append(nodo);
  document.body.classList.add('con-sobre');

  nodo.querySelector('.sobre__sello').addEventListener('click', async () => {
    await alAbrir();
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!quieto) lluvia();
    nodo.classList.add('sobre--abriendo');
    // La portada sube suave mientras el sobre se desvanece (ver CSS).
    document.body.classList.add('invitacion--abierta');
    setTimeout(() => {
      nodo.remove();
      document.body.classList.remove('con-sobre');
      window.scrollTo(0, 0);
      document.querySelector('#app h1')?.focus({ preventScroll: true });
    }, quieto ? 0 : DURACION_MS);
  }, { once: true });
}
