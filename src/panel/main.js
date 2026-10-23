// Panel de novios: navegación por hash (#resumen, #invitados, …) para que
// funcione en GitHub Pages sin reescritura de rutas. El hash puede llevar
// parámetros: #invitados?filtro=pendientes.
// Celular: encabezado con sello y pestañas abajo. Escritorio (1024px o más):
// barra lateral. Las vistas reciben ctx.escritorio y se vuelven a montar al
// cruzar ese ancho.
import * as data from '../data/index.js';
import { requerirSesion } from './auth.js';
import { esDemo, montarFranjaDemo } from './demo.js';
import { aplicarTemaPanel } from '../lib/theme.js';
import { rutaInvitacion } from '../lib/links.js';
import { fechaNumerica } from '../lib/fechas.js';
import { html, crudo } from '../lib/dom.js';
import { goldRule, waxSeal, wordmark } from '../lib/ui.js';
import * as resumen from './views/resumen.js';
import * as familias from './views/familias.js';
import * as mesas from './views/mesas.js';
import * as mensajes from './views/mensajes.js';
import * as regalos from './views/regalos.js';
import * as actividad from './views/actividad.js';
import * as datosEvento from './views/datos-evento.js';
import * as exportar from './views/exportar.js';
import * as mas from './views/mas.js';

// pestaña = la pestaña que se marca como actual. El encabezado muestra el
// título de la vista (en las subvistas de Más, el de la subsección).
const VISTAS = {
  resumen: { titulo: 'Resumen', pestana: 'resumen', modulo: resumen },
  invitados: { titulo: 'Sus invitados', pestana: 'invitados', modulo: familias },
  mesas: { titulo: 'Mesas', pestana: 'mesas', modulo: mesas },
  mas: { titulo: 'Más', pestana: 'mas', modulo: mas },
  mensajes: { titulo: 'Mensajes de sus invitados', pestana: 'mas', modulo: mensajes },
  actividad: { titulo: 'Actividad reciente', pestana: 'mas', modulo: actividad },
  regalos: { titulo: 'Mesa de regalos', pestana: 'mas', modulo: regalos },
  'datos-evento': { titulo: 'Datos del evento', pestana: 'mas', modulo: datosEvento },
  exportar: { titulo: 'Exportar lista a Excel', pestana: 'mas', modulo: exportar },
};
const PESTANAS = [['resumen', 'Resumen'], ['invitados', 'Invitados'], ['mesas', 'Mesas'], ['mas', 'Más']];

const sesion = await requerirSesion();
const evento = await data.getEventoPorId(sesion.eventoId);
const tema = aplicarTemaPanel(evento.tema);
const { diasRestantes } = await data.getResumen(evento.id);
const escritorioMq = matchMedia('(min-width: 1024px)');
const demo = esDemo(evento);
if (demo) montarFranjaDemo(data);

const pestanas = (clase) => PESTANAS.map(([id, texto]) =>
  crudo(html`<a class="${clase}" href="#${id}" data-pestana="${id}">${texto}</a>`));

document.getElementById('panel').innerHTML = html`
  <aside class="panel-lateral">
    <div class="panel-lateral__evento">
      ${crudo(waxSeal(tema.monograma, 64))}
      <div class="t-script panel-lateral__nombres">${evento.titulo}</div>
      <span class="t-meta">${fechaNumerica(evento.fecha)} · faltan ${diasRestantes} días</span>
    </div>
    ${crudo(goldRule())}
    <nav class="panel-lateral__nav" aria-label="Secciones del panel">${pestanas('panel-lateral__link')}</nav>
    <div class="panel-lateral__pie">${crudo(wordmark({ width: 140, tone: 'pizarra', tagline: false }))}</div>
  </aside>
  <div class="panel-principal">
    <header class="panel-cabeza">
      <span class="panel-cabeza__sello">${crudo(waxSeal(tema.monograma, 48))}</span>
      <div class="panel-cabeza__textos">
        <div class="label panel-cabeza__evento">${evento.titulo} · ${fechaNumerica(evento.fecha, { corta: true })}</div>
        <div class="label panel-cabeza__eyebrow">Su panel de boda</div>
        <h1 class="t-h1 panel-cabeza__titulo"></h1>
      </div>
      <a class="btn btn--secondary panel-cabeza__invitacion" href="${rutaInvitacion(evento.slug)}" target="_blank" rel="noopener">Ver mi invitación</a>
    </header>
    <div class="panel-cabeza__filete">${crudo(goldRule())}</div>
    <main id="app" class="panel-vista"></main>
  </div>
  <nav class="panel-pestanas" aria-label="Secciones del panel">${pestanas('panel-pestanas__link')}</nav>`;

const app = document.getElementById('app');
const titulo = document.querySelector('.panel-cabeza__titulo');

function leerHash() {
  const [ruta, query = ''] = location.hash.slice(1).split('?');
  return { id: ruta in VISTAS ? ruta : 'resumen', params: Object.fromEntries(new URLSearchParams(query)) };
}

const ir = (ruta) => { location.hash = ruta; };

async function mostrar() {
  const { id, params } = leerHash();
  const vista = VISTAS[id];
  titulo.textContent = vista.titulo;
  document.title = `${vista.titulo} · Panel de novios · RamoStudio`;
  for (const a of document.querySelectorAll('[data-pestana]')) {
    if (a.dataset.pestana === vista.pestana) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  app.innerHTML = '';
  app.dataset.vista = id;
  scrollTo(0, 0);
  await vista.modulo.montar(app, { sesion, evento, tema, data, params, ir, demo, escritorio: escritorioMq.matches });
}

addEventListener('hashchange', mostrar);
escritorioMq.addEventListener('change', mostrar);
mostrar();
