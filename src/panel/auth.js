// Protege las páginas del panel. Sesión de Supabase (clientes) o simulada (demo).
import * as data from '../data/index.js';

export async function requerirSesion() {
  const sesion = await data.getSesion();
  if (!sesion) {
    location.replace('/panel/');
    return new Promise(() => {}); // Detiene el arranque mientras redirige.
  }
  return sesion;
}

// Al cerrar sesión vuelve a la entrada de su boda (sin ?e= abriría el demo).
export async function salir(slug) {
  await data.logout();
  location.replace(slug ? `/panel/?e=${encodeURIComponent(slug)}` : '/panel/');
}
