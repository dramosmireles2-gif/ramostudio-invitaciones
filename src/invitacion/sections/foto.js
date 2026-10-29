// Una foto a todo lo ancho entre secciones (evento.fotos.intermedia).
import { imagen } from '../../lib/imagenes.js';

export function montar(contenedor, { evento }) {
  const foto = evento.fotos?.intermedia;
  if (!foto) return contenedor.remove();
  contenedor.className = 'foto-intermedia';
  contenedor.innerHTML = imagen(evento.slug, foto, { clase: 'foto-intermedia__img' });
}
