// Medición de la web de marca: GA4 y Meta Pixel, listos pero apagados hasta
// que src/site/ajustes.js tenga sus IDs. Eventos (docs/web/plan-web.md, sección 5):
//   click_whatsapp  { paquete, src }   cualquier botón de WhatsApp
//   ver_demo        { src }            enlaces a /demo/
//   ver_panel_demo  { src }            "Pruébalo tú"
import { origenVisita } from '../lib/origen.js';
import { GA4_ID, META_PIXEL_ID } from './ajustes.js';

// Meta usa sus propios nombres de evento; los que no tiene van como personalizados.
const META = { click_whatsapp: 'Contact', ver_demo: 'ViewContent' };

function cargar(src) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.append(s);
}

export function iniciarAnalitica() {
  if (GA4_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
    cargar(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`);
  }
  if (META_PIXEL_ID) {
    const fbq = function fbq() { fbq.callMethod ? fbq.callMethod(...arguments) : fbq.queue.push(arguments); };
    Object.assign(fbq, { push: fbq, loaded: true, version: '2.0', queue: [] });
    window.fbq = window._fbq = fbq;
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
    cargar('https://connect.facebook.net/en_US/fbevents.js');
  }
}

export function medir(nombre, datos = {}) {
  const conOrigen = { ...datos, src: origenVisita() };
  if (GA4_ID) window.gtag?.('event', nombre, conOrigen);
  if (META_PIXEL_ID) {
    if (META[nombre]) window.fbq?.('track', META[nombre], conOrigen);
    else window.fbq?.('trackCustom', nombre, conOrigen);
  }
}

// Escucha los clics en los enlaces marcados con data-whatsapp, data-demo y
// data-panel-demo (con data-paquete si es de una tarjeta de paquete).
export function medirClics(raiz = document) {
  raiz.addEventListener('click', (e) => {
    const a = e.target.closest('[data-whatsapp], [data-demo], [data-panel-demo]');
    if (!a) return;
    if (a.hasAttribute('data-whatsapp')) medir('click_whatsapp', { paquete: a.dataset.paquete ?? 'general' });
    else if (a.hasAttribute('data-demo')) medir('ver_demo');
    else medir('ver_panel_demo');
  });
}
