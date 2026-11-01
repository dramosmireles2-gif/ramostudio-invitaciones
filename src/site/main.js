// Web de marca de RamoStudio: página principal y legales. Todas comparten este
// archivo: wordmark, enlaces de WhatsApp (con ?src=, ver lib/origen.js), las
// secciones que se apagan por ajuste, los videos y el botón flotante.
import { WHATSAPP_NUMBER } from '../config.js';
import { enlaceQuieroLaMia } from '../lib/links.js';
import { wordmark } from '../lib/ui.js';
import { TESTIMONIOS_VISIBLES } from './ajustes.js';

const quieto = matchMedia('(prefers-reduced-motion: reduce)');

for (const el of document.querySelectorAll('[data-wordmark]')) {
  el.innerHTML = wordmark({ width: 176, tone: 'pizarra', tagline: false });
}
for (const a of document.querySelectorAll('[data-whatsapp]')) a.href = enlaceQuieroLaMia();
if (!TESTIMONIOS_VISIBLES) document.querySelector('[data-seccion="testimonios"]')?.remove();

// 528148078309 → 814 807 8309 (sin lada de país).
const local = WHATSAPP_NUMBER.slice(-10);
for (const el of document.querySelectorAll('[data-telefono]')) {
  el.textContent = `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

// Video del hero: en loop y sin sonido; con "reducir movimiento" se queda el poster.
const hero = document.querySelector('[data-hero-video]');
if (hero && !quieto.matches) hero.play().catch(() => {});

// Portafolio: "Ver cómo se abre" cambia la portada por el video del sobre, en
// el mismo marco, solo cuando la persona lo pide.
for (const boton of document.querySelectorAll('[data-ver-apertura]')) {
  boton.addEventListener('click', () => {
    const marco = boton.closest('.obra').querySelector('[data-obra-video]');
    let video = marco.querySelector('video');
    if (!video) {
      const img = marco.querySelector('img');
      video = Object.assign(document.createElement('video'), {
        className: 'cel__pantalla', src: marco.dataset.obraVideo, muted: true, playsInline: true,
        poster: img.currentSrc, width: 540, height: 1168,
      });
      video.setAttribute('aria-label', `Así se abre la invitación de ${boton.closest('.obra').querySelector('h3').textContent}`);
      video.addEventListener('ended', () => { boton.textContent = 'Verlo otra vez'; });
      marco.replaceChildren(video);
    }
    video.currentTime = 0;
    video.play().catch(() => {});
  });
}

// Botón flotante: se esconde mientras se ve otro botón de WhatsApp (no lo tapa)
// o el hero (que ya tiene los suyos).
const flotante = document.querySelector('[data-flotante]');
if (flotante && 'IntersectionObserver' in window) {
  const visibles = new Set();
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target);
    flotante.toggleAttribute('data-oculto', visibles.size > 0);
  });
  for (const el of document.querySelectorAll('[data-whatsapp]:not([data-flotante]), .hero')) io.observe(el);
}
