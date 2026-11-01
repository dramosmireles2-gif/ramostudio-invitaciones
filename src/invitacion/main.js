import * as data from '../data/index.js';
import { DEMO_EVENT_SLUG } from '../config.js';
import { leerParametros } from '../lib/links.js';
import { aplicarTema } from '../lib/theme.js';
import { html } from '../lib/dom.js';
import { crearMusica, montarBotonMusica } from './sections/musica.js';
import { montarFondo } from './fondo.js';
import { montarProgreso } from './progreso.js';
import * as sobre from './sections/sobre.js';
import * as portada from './sections/portada.js';
import * as cuenta from './sections/cuenta.js';
import * as evento from './sections/evento.js';
import * as vestimenta from './sections/vestimenta.js';
import * as foto from './sections/foto.js';
import * as frase from './sections/frase.js';
import * as calendario from './sections/calendario.js';
import * as cancion from './sections/cancion.js';
import * as galeria from './sections/galeria.js';
import * as rsvp from './sections/rsvp.js';
import * as regalos from './sections/regalos.js';
import * as mensajes from './sections/mensajes.js';
import * as pie from './sections/pie.js';

// Cada evento elige sus secciones y su orden en evento.secciones.
const SECCIONES = { portada, cuenta, frase, cancion, evento, calendario, vestimenta, foto, rsvp, regalos, galeria, mensajes, pie };
const POR_DEFECTO = ['portada', 'cuenta', 'evento', 'calendario', 'vestimenta', 'rsvp', 'regalos', 'mensajes', 'pie'];
// Modo muestra (?muestra=1, portafolio de la web): la misma invitación sin lo
// que escribe o muestra datos de los invitados.
const FUERA_DE_MUESTRA = new Set(['rsvp', 'mensajes']);
const app = document.getElementById('app');

function montarFranjaMuestra() {
  const franja = document.createElement('p');
  franja.className = 'muestra';
  franja.textContent = 'Invitación de muestra · RamoStudio';
  document.body.append(franja);
}

// La familia del enlace personal (?f=, con &d= en eventos reales). Un código
// que no se encuentra no rompe la invitación: se ve la versión general.
async function buscarFamilia(ev, codigo, enlace) {
  if (!codigo) return null;
  try {
    const f = enlace
      ? await data.familiaDeEnlace(ev.id, { codigo, ...enlace })
      : await data.getFamiliaPorCodigo(ev.id, codigo);
    data.registrarApertura(ev.id, f.codigo);
    return f;
  } catch {
    return null;
  }
}

async function iniciar() {
  const { slug, codigo, familia: enlace, muestra } = leerParametros();
  const ev = await data.getEvento(slug || DEMO_EVENT_SLUG);
  aplicarTema(ev.tema);
  montarFondo(ev.tema);
  document.title = `${ev.titulo} · Invitación`;

  // En muestra no se busca familia: tampoco se registra la apertura.
  const familia = muestra ? null : await buscarFamilia(ev, codigo, enlace);
  const musica = crearMusica(ev.musica ?? {});
  const ctx = { evento: ev, familia, musica, data, muestra };
  if (muestra) montarFranjaMuestra();

  // Las secciones se montan desde el principio, debajo del sobre: así el sobre
  // se abre sobre la invitación ya lista y el reproductor de la canción ya
  // existe cuando el invitado toca el sello (el navegador solo deja sonar
  // música si arranca dentro de ese toque).
  app.innerHTML = '';
  for (const nombre of ev.secciones ?? POR_DEFECTO) {
    const s = SECCIONES[nombre];
    if (!s || (muestra && FUERA_DE_MUESTRA.has(nombre))) continue;
    const nodo = document.createElement('section');
    nodo.dataset.seccion = nombre;
    app.append(nodo);
    s.montar(nodo, ctx);
  }

  sobre.montar(document.body, {
    ...ctx,
    alAbrir: async () => {
      musica.iniciar();
      montarBotonMusica(musica);
      montarProgreso();
    },
  });
}

iniciar().catch((err) => {
  app.innerHTML = html`<p class="error">${err.message || 'No pudimos cargar la invitación.'}</p>`;
  console.error(err);
});
