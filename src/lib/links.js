// Arma los enlaces de invitación. Único lugar que combina el dominio con
// el slug del evento y el código de la familia.
import { INVITE_BASE_URL, WHATSAPP_NUMBER, DEMO_EVENT_SLUG, baseUrlEvento } from '../config.js';
import { origenVisita } from './origen.js';

// Formato: https://<dominio del evento>/<slug>/?f=<codigo>
// (ver baseUrlEvento en src/config.js).
// Cada evento tiene su página en /<slug>/ (con su vista previa de WhatsApp);
// /invitacion/?e=<slug>&f=<codigo> sigue funcionando como respaldo.
//
// Mientras no hay backend, el teléfono del invitado no conoce a su familia:
// en los eventos reales el enlace lleva también &d= con el nombre de la
// familia y sus pases (para el RSVP por WhatsApp). No es secreto ni está
// firmado: si alguien lo cambia, solo cambia su propio mensaje a los novios,
// que lo comparan con su lista. Con Supabase, &d= deja de hacer falta.
export function enlaceFamilia(slug, codigo, familia = null) {
  const url = new URL(`/${encodeURIComponent(slug)}/`, baseUrlEvento(slug));
  url.searchParams.set('f', codigo);
  if (familia && slug !== DEMO_EVENT_SLUG) {
    url.searchParams.set('d', aBase64Url(JSON.stringify({ n: familia.nombre, p: familia.pasesAsignados })));
  }
  return url.toString();
}

// Base64 de URL (sin + / =) con UTF-8, para nombres con acentos y ñ.
function aBase64Url(texto) {
  const bin = String.fromCharCode(...new TextEncoder().encode(texto));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// { nombre, pasesAsignados } de &d=, o null si no viene o no se puede leer.
function leerDatosFamilia(d) {
  if (!d) return null;
  try {
    const bin = atob(d.replace(/-/g, '+').replace(/_/g, '/'));
    const { n, p } = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    const pases = Math.trunc(Number(p));
    return n && pases >= 1 && pases <= 30 ? { nombre: String(n).slice(0, 80), pasesAsignados: pases } : null;
  } catch {
    return null;
  }
}

// Ruta relativa de la invitación de un evento (sin familia), para abrirla
// desde el panel en el mismo sitio donde corre la demo.
export function rutaInvitacion(slug) {
  return `/${encodeURIComponent(slug)}/`;
}

// Invitación demo abierta como la ve la familia del recorrido (Familia Ramos,
// código DEMO): de ahí pueden confirmar y luego verlo en el panel.
export function rutaInvitacionDemo() {
  return `${rutaInvitacion(DEMO_EVENT_SLUG)}?f=demo`;
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

// "Cotiza por WhatsApp" de la web de marca: el mensaje de
// docs/web/contenido-web-fase1.md (sección 4), con el paquete si viene de su
// tarjeta y el origen de la visita.
export function enlaceCotizar(paquete = '') {
  const lineas = [
    'Hola, RamoStudio. Quiero cotizar una invitación digital.',
    ...(paquete ? [`Me interesa el paquete ${paquete}.`] : []),
    'Mi evento es: ',
    'Fecha: ',
    `(Vengo de: ${origenVisita()})`,
  ];
  return enlaceWhatsApp(lineas.join('\n'), WHATSAPP_NUMBER);
}

// Aviso de privacidad de RamoStudio, para el aviso corto del RSVP. Relativo si
// la invitación vive en el mismo dominio que la web; si no, con el dominio.
export function rutaAvisoPrivacidad(slug) {
  const ruta = '/aviso-de-privacidad/';
  return baseUrlEvento(slug) === INVITE_BASE_URL ? ruta : new URL(ruta, INVITE_BASE_URL).toString();
}

// Para mostrar en textos de ayuda del panel.
export const FORMATO_ENLACE = `${INVITE_BASE_URL}/<evento>/?f=<código>`;

// Lee el evento y ?f= de la URL actual. En /<slug>/ el evento viene en la
// meta ramostudio:evento de la página; en /invitacion/ y /panel/, en ?e=.
// ?muestra=1 es la invitación del portafolio (ver src/invitacion/main.js).
export function leerParametros(search = location.search) {
  const p = new URLSearchParams(search);
  const pagina = document.querySelector('meta[name="ramostudio:evento"]')?.content;
  return {
    slug: pagina ?? p.get('e'), codigo: p.get('f'), familia: leerDatosFamilia(p.get('d')),
    muestra: p.get('muestra') === '1',
  };
}

// Invitación en modo muestra, para el portafolio de la web de marca.
export function rutaMuestra(slug) {
  return `${rutaInvitacion(slug)}?muestra=1`;
}
