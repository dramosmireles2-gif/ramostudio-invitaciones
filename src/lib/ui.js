// Componentes del design system de RamoStudio como funciones que devuelven HTML
// (estilos en src/styles/components.css). Los textos se escapan con html``.
import { html, crudo } from './dom.js';

export function goldRule({ ornament = false, double = false, width } = {}) {
  const estilo = width ? crudo(` style="width:${width}"`) : '';
  if (ornament) {
    return html`<div class="gold-rule gold-rule--ornament" role="separator"${estilo}><span class="gold-rule__rombo"></span></div>`;
  }
  return html`<div class="gold-rule${double ? ' gold-rule--double' : ''}" role="separator"${estilo}></div>`;
}

export function waxSeal(iniciales, size = 88) {
  return html`<span class="wax-seal" role="img" aria-label="Sello ${iniciales}" style="--seal-size:${size}px">
    <span class="wax-seal__iniciales" aria-hidden="true">${iniciales}</span></span>`;
}

const TINTAS = { tinta: '#2B2A28', pizarra: '#3E5266', crema: '#F4EFE9' };

// Wordmark oficial "ramostudio" reproducido inline (como el SVG del design
// system) para que use la Playfair Display autoalojada. El lema va en dorado
// solo a 240px o más.
export function wordmark({ width = 200, tone = 'tinta', tagline = true } = {}) {
  const tinta = TINTAS[tone] ?? TINTAS.tinta;
  const grande = width >= 240;
  const lema = grande ? '#B79A6B' : tinta;
  return html`<svg class="wordmark" role="img" aria-label="ramostudio, invitaciones digitales"
    viewBox="${tagline ? '430 150 1040 320' : '430 150 1040 210'}" width="${width}">
    <text x="950" y="265" font-family="Playfair Display" font-size="185" letter-spacing="2" text-anchor="middle" dominant-baseline="central" fill="${tinta}">ramostudio</text>
    ${tagline ? crudo(html`<text x="950" y="440" font-family="Montserrat" font-weight="600" font-size="37" letter-spacing="23" fill="${lema}" text-anchor="middle">INVITACIONES DIGITALES</text>`) : ''}
  </svg>`;
}

export function statCard({ value, label, note, dark = false }) {
  return html`<div class="stat-card${dark ? ' stat-card--dark' : ''}">
    <span class="stat-card__label">${label}</span>
    <span class="stat-card__rule"></span>
    <span class="stat-card__value">${value}</span>
    ${note ? crudo(html`<span class="stat-card__note">${note}</span>`) : ''}
  </div>`;
}

const ESTADOS = {
  confirmado: 'Confirmado',
  no: 'No asiste',
  pendiente: 'Pendiente',
  vio: 'Vio la invitación',
  sinabrir: 'Sin abrir',
};

export function statusTag(estado = 'pendiente', label) {
  const e = estado in ESTADOS ? estado : 'pendiente';
  return html`<span class="status-tag status-tag--${e}">${label ?? ESTADOS[e]}</span>`;
}

// Hoja inferior modal. Devuelve { el, cerrar }. Cierra con el velo, "Cerrar" o Escape.
export function abrirBottomSheet({ titulo, contenido, alCerrar }) {
  const previo = document.activeElement;
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = html`<button class="overlay__velo" type="button" tabindex="-1" aria-label="Cerrar"></button>
    <div class="bottom-sheet" role="dialog" aria-modal="true" aria-label="${titulo}">
      <span class="bottom-sheet__asa"></span>
      <div class="bottom-sheet__cabeza"><h2 class="t-h2">${titulo}</h2>
        <button class="btn btn--quiet" type="button" data-cerrar>Cerrar</button></div>
      <div class="bottom-sheet__cuerpo"></div>
    </div>`;
  const cuerpo = el.querySelector('.bottom-sheet__cuerpo');
  if (typeof contenido === 'string') cuerpo.innerHTML = contenido;
  else if (contenido) cuerpo.append(contenido);

  const alTeclear = (e) => { if (e.key === 'Escape') cerrar(); };
  function cerrar() {
    el.remove();
    document.removeEventListener('keydown', alTeclear);
    document.body.style.overflow = '';
    previo?.focus?.();
    alCerrar?.();
  }
  el.querySelector('.overlay__velo').addEventListener('click', cerrar);
  el.querySelector('[data-cerrar]').addEventListener('click', cerrar);
  document.addEventListener('keydown', alTeclear);
  document.body.style.overflow = 'hidden';
  document.body.append(el);
  el.querySelector('[data-cerrar]').focus();
  return { el, cuerpo, cerrar };
}

let toastActual;
export function toast(texto, ms = 2600) {
  toastActual?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = texto;
  document.body.append(el);
  toastActual = el;
  setTimeout(() => el.remove(), ms);
}

export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
