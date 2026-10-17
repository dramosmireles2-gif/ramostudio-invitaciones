// Ubicaciones de los lugares del evento con enlaces gratuitos: el link de
// Google Maps que pegan los novios, "Abrir en Google Maps", "Abrir en Waze" y
// un mapa embebido sin API key que solo se carga cuando lo tocan.
import { html } from './dom.js';

// ¿Es un link de Google Maps? (google.com/maps, maps.google.*, goo.gl/maps, maps.app.goo.gl)
export function esLinkGoogleMaps(texto) {
  try {
    const u = new URL(String(texto).trim());
    const host = u.hostname.replace(/^www\./, '');
    return (/^google\.[a-z.]+$/.test(host) && u.pathname.startsWith('/maps'))
      || /^maps\.google\.[a-z.]+$/.test(host)
      || host === 'maps.app.goo.gl'
      || (host === 'goo.gl' && u.pathname.startsWith('/maps'));
  } catch {
    return false;
  }
}

const valida = (lat, lng) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

// Coordenadas que trae el link, si las trae: "!3d<lat>!4d<lng>" (el punto del
// lugar), "@<lat>,<lng>" (el centro del mapa) o ?q= / ?query= / ?ll= con
// "<lat>,<lng>". Los links cortos (maps.app.goo.gl) no las traen.
export function leerCoordenadas(texto) {
  let url;
  try {
    url = new URL(String(texto).trim());
  } catch {
    return null;
  }
  const decodificado = decodeURIComponent(url.href);
  const num = '(-?\\d{1,3}(?:\\.\\d+)?)';
  const intentos = [
    new RegExp(`!3d${num}!4d${num}`).exec(decodificado),
    new RegExp(`@${num},${num}`).exec(decodificado),
    ...['q', 'query', 'll', 'center', 'destination'].map((k) =>
      new RegExp(`^\\s*${num}\\s*,\\s*${num}\\s*$`).exec(url.searchParams.get(k) ?? '')),
  ];
  for (const m of intentos) {
    if (!m) continue;
    const [lat, lng] = [Number(m[1]), Number(m[2])];
    if (valida(lat, lng)) return { lat, lng };
  }
  return null;
}

// Lo que se busca cuando no hay coordenadas: nombre y dirección del lugar.
const consulta = (sede) => [sede.nombre, sede.direccion].filter(Boolean).join(', ');
const punto = (c) => `${c.lat},${c.lng}`;

export function enlaceGoogleMaps(sede) {
  if (sede.mapaUrl) return sede.mapaUrl;
  const q = sede.coordenadas ? punto(sede.coordenadas) : consulta(sede);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

// Waze: abre la app (o waze.com) con la ruta al lugar.
export function enlaceWaze(sede) {
  return sede.coordenadas
    ? `https://waze.com/ul?ll=${encodeURIComponent(punto(sede.coordenadas))}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(consulta(sede))}&navigate=yes`;
}

// Mapa embebido de Google sin API key (output=embed).
export function urlMapaEmbebido(sede) {
  const q = sede.coordenadas ? punto(sede.coordenadas) : consulta(sede);
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=es&output=embed`;
}

// Recuadro que muestra el mapa hasta que lo tocan: antes no se descarga nada de Google.
export function mapaAlTocar(sede, { titulo = `Mapa de ${sede.nombre || 'el lugar'}` } = {}) {
  return html`<div class="mapa-tocar" data-mapa="${urlMapaEmbebido(sede)}" data-titulo="${titulo}">
    <button class="mapa-tocar__boton" type="button">
      <span class="mapa-tocar__pin" aria-hidden="true"></span>
      <span class="mapa-tocar__texto">Toquen para ver el mapa</span>
    </button>
  </div>`;
}

// Activa los recuadros de mapaAlTocar dentro de raiz (una sola vez por raíz).
export function activarMapas(raiz) {
  raiz.addEventListener('click', (e) => {
    const caja = e.target.closest('.mapa-tocar');
    if (!caja || !e.target.closest('.mapa-tocar__boton')) return;
    const iframe = document.createElement('iframe');
    iframe.className = 'mapa-tocar__iframe';
    iframe.src = caja.dataset.mapa;
    iframe.title = caja.dataset.titulo;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    caja.replaceChildren(iframe);
  });
}
