// Origen de la visita (?src=, p. ej. ?src=ig-bio o ?src=qr-poster-local). Se
// lee al entrar, se guarda en sessionStorage y se mantiene al navegar por el
// sitio (web, demo y panel demo); va en el mensaje de WhatsApp. Sin src es "web".
const KEY = 'ramostudio:src';

export function origenVisita(search = location.search) {
  // Solo letras, números, "-", "_" y "."; lo demás se vuelve "-".
  const nuevo = (new URLSearchParams(search).get('src') ?? '')
    .trim().slice(0, 60).replace(/[^\p{L}\p{N}_.-]+/gu, '-');
  try {
    if (nuevo) sessionStorage.setItem(KEY, nuevo);
    return sessionStorage.getItem(KEY) || 'web';
  } catch {
    return nuevo || 'web'; // sessionStorage bloqueado: vale lo de esta URL.
  }
}
