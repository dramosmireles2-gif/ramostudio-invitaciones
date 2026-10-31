// Apertura del sobre: el gran momento. Un sobre de verdad, por capas (fondo,
// carta adentro, bolsa del frente y solapa), flota despacio sobre el papel de
// la invitación. Al tocar el sello (el gesto que también arranca la música):
//   1. el sello cede,
//   2. la solapa se levanta en 3D y deja ver su interior,
//   3. la carta sale del sobre con los nombres y la fecha,
//   4. el sobre se desvanece y queda la carta, que se funde con la portada.
// Mientras, cae una lluvia de rombos, puntos y puntadas. Toda la pantalla ya
// es del color de la invitación: no hay salto de oscuro a claro. Unos 2.4 s;
// sin animación si el invitado pidió reducir movimiento.
import { fechaInvitacion, fechaNumerica } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';

const DURACION_MS = 2400;
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
    p.style.animationDelay = `${0.3 + Math.random() * 0.9}s`;
    p.addEventListener('animationend', () => p.remove(), { once: true });
    document.body.append(p);
  }
}

const SOLAPA = (clase) => `<svg class="${clase}" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
  <path class="sobre__solapa-papel" d="M0 0H100V34Q50 66 0 34Z" />
  <path class="sobre__solapa-pespunte" d="M0 29Q50 60 100 29" vector-effect="non-scaling-stroke" />
</svg>`;

// Pespunte de la bolsa del frente, como el de la solapa: abierto arriba (en U),
// para no cruzarse con el de la solapa bajo el sello.
const PESPUNTE_FRENTE = `<svg class="sobre__pespunte" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  <path d="M4 10V95H96V10" vector-effect="non-scaling-stroke" />
</svg>`;

export function montar(raiz, { evento, familia, alAbrir }) {
  const nodo = document.createElement('div');
  nodo.className = 'sobre';
  nodo.setAttribute('role', 'dialog');
  nodo.setAttribute('aria-label', `Invitación de ${evento.titulo}`);
  nodo.innerHTML = html`
    <div class="sobre__carta">
      <div class="sobre__fondo" aria-hidden="true"></div>
      <div class="sobre__hoja" aria-hidden="true">
        <p class="sobre__hoja-etiqueta">Nos casamos</p>
        <p class="sobre__hoja-nombres">${evento.titulo}</p>
        <p class="sobre__hoja-fecha">${fechaInvitacion(evento.fecha, evento.zonaHoraria)}</p>
      </div>
      <div class="sobre__frente">
        ${crudo(PESPUNTE_FRENTE)}
        <span class="sobre__filete" aria-hidden="true"></span>
        <p class="sobre__nombres">${evento.titulo}</p>
        <p class="sobre__fecha">${fechaNumerica(evento.fecha, { zona: evento.zonaHoraria }).replaceAll('/', ' · ')}</p>
        ${evento.ciudad ? crudo(html`<p class="sobre__ciudad">${evento.ciudad}</p>`) : ''}
      </div>
      <div class="sobre__solapa"></div>
      <button type="button" class="sobre__sello" aria-label="Abrir la invitación">
        <span class="sobre__monograma">${evento.tema?.monograma ?? ''}</span>
      </button>
    </div>
    <p class="sobre__ayuda" aria-hidden="true"><span class="sobre__punto"></span>Toquen el sello para abrir<span class="sobre__punto"></span></p>`;
  // La solapa: cara (con "Para …") y dorso (el interior del sobre).
  nodo.querySelector('.sobre__solapa').innerHTML = `
    <div class="sobre__solapa-cara">${SOLAPA('sobre__solapa-forma')}
      <div class="sobre__para">
        <p class="sobre__etiqueta">${familia ? 'Para' : 'Una invitación para'}</p>
        <p class="sobre__familia"></p>
      </div>
    </div>
    <div class="sobre__solapa-dorso">${SOLAPA('sobre__solapa-forma sobre__solapa-forma--dorso')}</div>`;
  nodo.querySelector('.sobre__familia').textContent = familia?.nombre ?? 'ustedes';
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
