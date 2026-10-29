// Arma los enlaces de invitación. Único lugar que combina el dominio con
// el slug del evento y el código de la familia.
import { INVITE_BASE_URL, WHATSAPP_NUMBER, baseUrlEvento } from '../config.js';
import { origenVisita } from './origen.js';

// Formato: https://<dominio del evento>/<slug>/?f=<codigo>
// (demo.ramosmkt.lat para el demo; el dominio de clientes para los demás).
// Cada evento tiene su página en /<slug>/ (con su vista previa de WhatsApp);
// /invitacion/?e=<slug>&f=<codigo> sigue funcionando como respaldo.
export function enlaceFamilia(slug, codigo) {
  const url = new URL(`/${encodeURIComponent(slug)}/`, baseUrlEvento(slug));
  url.searchParams.set('f', codigo);
  return url.toString();
}

// Ruta relativa de la invitación de un evento (sin familia), para abrirla
// desde el panel en el mismo sitio donde corre la demo.
export function rutaInvitacion(slug) {
  return `/${encodeURIComponent(slug)}/`;
}

// Abre WhatsApp con el mensaje ya escrito; los novios eligen el chat y lo
// mandan ellos. Con teléfono (10 dígitos de México) abre ese chat directo.
export function enlaceWhatsApp(texto, telefono = '') {
  const digitos = String(telefono).replace(/\D/g, '');
  const numero = digitos.length === 10 ? `52${digitos}` : digitos;
  // encodeURIComponent y no searchParams: WhatsApp no convierte "+" en espacio.
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

// "Quiero la mía": abre el chat de RamoStudio con el mensaje ya escrito y el
// origen de la visita (?src=), para saber de dónde llegó.
export function enlaceQuieroLaMia() {
  return enlaceWhatsApp(`Hola, vi el demo (${origenVisita()}) y quiero una invitación así`, WHATSAPP_NUMBER);
}

// Para mostrar en textos de ayuda del panel.
export const FORMATO_ENLACE = `${INVITE_BASE_URL}/<evento>/?f=<código>`;

// Lee el evento y ?f= de la URL actual. En /<slug>/ el evento viene en la
// meta ramostudio:evento de la página; en /invitacion/ y /panel/, en ?e=.
export function leerParametros(search = location.search) {
  const p = new URLSearchParams(search);
  const pagina = document.querySelector('meta[name="ramostudio:evento"]')?.content;
  return { slug: pagina ?? p.get('e'), codigo: p.get('f') };
}
