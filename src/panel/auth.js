// Protege las páginas del panel. Sesión simulada (solo demo).
import * as data from '../data/index.js';

export async function requerirSesion() {
  const sesion = await data.getSesion();
  if (!sesion) {
    location.replace('/panel/');
    return new Promise(() => {}); // Detiene el arranque mientras redirige.
  }
  return sesion;
}

export async function salir() {
  await data.logout();
  location.replace('/panel/');
}
