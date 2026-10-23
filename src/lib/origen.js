// Origen de la visita al demo (?src=, p. ej. ?src=flyer-expo). Se lee al
// entrar, se guarda en sessionStorage y se mantiene al pasar de la entrada al
// panel. Sin src es "directo".
const KEY = 'ramostudio:demo:src';

export function origenVisita(search = location.search) {
  // Solo letras, números, "-", "_" y "."; lo demás se vuelve "-".
  const nuevo = (new URLSearchParams(search).get('src') ?? '')
    .trim().slice(0, 60).replace(/[^\p{L}\p{N}_.-]+/gu, '-');
  try {
    if (nuevo) sessionStorage.setItem(KEY, nuevo);
    return sessionStorage.getItem(KEY) || 'directo';
  } catch {
    return nuevo || 'directo'; // sessionStorage bloqueado: vale lo de esta URL.
  }
}
