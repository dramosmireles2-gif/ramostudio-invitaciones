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

// Para mostrar en textos de ayuda del panel.
export const FORMATO_ENLACE = `${INVITE_BASE_URL}/invitacion/?e=<evento>&f=<código>`;

// Lee ?e= y ?f= de la URL actual.
export function leerParametros(search = location.search) {
  const p = new URLSearchParams(search);
  return { slug: p.get('e'), codigo: p.get('f') };
}
