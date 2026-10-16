// Panel de novios: navegación por hash (#resumen, #familias, …) para que
// funcione en GitHub Pages sin reescritura de rutas.
import * as data from '../data/index.js';
import { requerirSesion } from './auth.js';
import { aplicarTema } from '../lib/theme.js';
import { html, crudo } from '../lib/dom.js';
import * as resumen from './views/resumen.js';
import * as familias from './views/familias.js';
import * as mesas from './views/mesas.js';
import * as mensajes from './views/mensajes.js';
import * as regalos from './views/regalos.js';
import * as actividad from './views/actividad.js';
import * as datosEvento from './views/datos-evento.js';
import * as exportar from './views/exportar.js';
import * as mas from './views/mas.js';

const VISTAS = {
  resumen: { titulo: 'Resumen', modulo: resumen },
  familias: { titulo: 'Invitados', modulo: familias },
  mesas: { titulo: 'Mesas', modulo: mesas },
  mensajes: { titulo: 'Mensajes', modulo: mensajes },
  regalos: { titulo: 'Regalos', modulo: regalos },
  actividad: { titulo: 'Actividad', modulo: actividad },
  'datos-evento': { titulo: 'Datos del evento', modulo: datosEvento },
  exportar: { titulo: 'Exportar', modulo: exportar },
  mas: { titulo: 'Más', modulo: mas },
};

const nav = document.getElementById('panel-nav');
const app = document.getElementById('app');

const sesion = await requerirSesion();
const evento = await data.getEventoPorId(sesion.eventoId);
aplicarTema(evento.tema);
const ctx = { sesion, evento, data };

nav.innerHTML = html`<ul>${Object.entries(VISTAS).map(
  ([id, v]) => crudo(html`<li><a href="#${id}">${v.titulo}</a></li>`),
)}</ul>`;

async function mostrar() {
  const id = location.hash.slice(1) in VISTAS ? location.hash.slice(1) : 'resumen';
  for (const a of nav.querySelectorAll('a')) {
    a.toggleAttribute('aria-current', a.getAttribute('href') === `#${id}`);
  }
  app.innerHTML = '';
  await VISTAS[id].modulo.montar(app, ctx);
}

addEventListener('hashchange', mostrar);
mostrar();
