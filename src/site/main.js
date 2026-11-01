// Web de marca de RamoStudio: página principal y legales. Todas comparten este
// archivo: wordmark, enlaces de WhatsApp (con ?src=, ver lib/origen.js), las
// secciones que se apagan por ajuste, los videos y el botón flotante.
import { WHATSAPP_NUMBER } from '../config.js';
import { enlaceCotizar } from '../lib/links.js';
import { wordmark } from '../lib/ui.js';
import { TESTIMONIOS_VISIBLES } from './ajustes.js';
import { iniciarAnalitica, medirClics } from './analitica.js';

const quieto = matchMedia('(prefers-reduced-motion: reduce)');

iniciarAnalitica();
medirClics();

for (const el of document.querySelectorAll('[data-wordmark]')) {
  el.innerHTML = wordmark({ width: 176, tone: 'pizarra', tagline: false });
}
// El mensaje lleva el paquete de la tarjeta (data-paquete) y el ?src= de la visita.
for (const a of document.querySelectorAll('[data-whatsapp]')) a.href = enlaceCotizar(a.dataset.paquete);
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

// Carruseles (solo en celular, ver .carrusel en site.css): un punto por pieza,
// marcado el que está a la vista; tocarlo lleva a esa pieza.
for (const carrusel of document.querySelectorAll('[data-carrusel]')) {
  const piezas = [...carrusel.children];
  const puntos = document.createElement('div');
  puntos.className = 'carrusel__puntos';
  puntos.setAttribute('role', 'group');
  puntos.setAttribute('aria-label', `${carrusel.getAttribute('aria-label') ?? 'Carrusel'}: elegir`);
  const botones = piezas.map((pieza, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'carrusel__punto';
    b.setAttribute('aria-label', `Ver ${pieza.querySelector('h3')?.textContent ?? i + 1}`);
    b.setAttribute('aria-current', String(i === 0));
    b.addEventListener('click', () => carrusel.scrollTo({
      left: pieza.offsetLeft - piezas[0].offsetLeft, behavior: quieto.matches ? 'auto' : 'smooth',
    }));
    puntos.append(b);
    return b;
  });
  carrusel.after(puntos);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) botones.forEach((b, i) => b.setAttribute('aria-current', String(piezas[i] === e.target)));
      }
    }, { root: carrusel, threshold: 0.6 });
    for (const p of piezas) io.observe(p);
  }
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
