// Arma los enlaces de invitación. Único lugar que combina el dominio con
// el slug del evento y el código de la familia.
import { INVITE_BASE_URL } from '../config.js';

// Formato: https://demo.ramosmkt.lat/invitacion/?e=<slug>&f=<codigo>
export function enlaceFamilia(slug, codigo) {
  const url = new URL('/invitacion/', INVITE_BASE_URL);
  url.searchParams.set('e', slug);
  url.searchParams.set('f', codigo);
  return url.toString();
}

// Ruta relativa de la invitación de un evento (sin familia), para abrirla
// desde el panel en el mismo sitio donde corre la demo.
export function rutaInvitacion(slug) {
  return `/invitacion/?e=${encodeURIComponent(slug)}`;
}

// Abre WhatsApp con el mensaje ya escrito; los novios eligen el chat y lo
// mandan ellos. Con teléfono (10 dígitos de México) abre ese chat directo.
export function enlaceWhatsApp(texto, telefono = '') {
  const digitos = String(telefono).replace(/\D/g, '');
  const numero = digitos.length === 10 ? `52${digitos}` : digitos;
  // encodeURIComponent y no searchParams: WhatsApp no convierte "+" en espacio.
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

// Para mostrar en textos de ayuda del panel.
export const FORMATO_ENLACE = `${INVITE_BASE_URL}/invitacion/?e=<evento>&f=<código>`;

// Lee ?e= y ?f= de la URL actual.
export function leerParametros(search = location.search) {
  const p = new URLSearchParams(search);
  return { slug: p.get('e'), codigo: p.get('f') };
}
