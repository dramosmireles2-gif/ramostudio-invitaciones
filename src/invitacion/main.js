import * as data from '../data/index.js';
import { DEMO_EVENT_SLUG } from '../config.js';
import { leerParametros } from '../lib/links.js';
import { aplicarTema } from '../lib/theme.js';
import { html } from '../lib/dom.js';
import { crearMusica } from './sections/musica.js';
import * as sobre from './sections/sobre.js';
import * as portada from './sections/portada.js';
import * as cuenta from './sections/cuenta.js';
import * as evento from './sections/evento.js';
import * as vestimenta from './sections/vestimenta.js';
import * as foto from './sections/foto.js';
import * as frase from './sections/frase.js';
import * as calendario from './sections/calendario.js';
import * as galeria from './sections/galeria.js';
import * as rsvp from './sections/rsvp.js';
import * as regalos from './sections/regalos.js';
import * as mensajes from './sections/mensajes.js';
import * as pie from './sections/pie.js';

// Cada evento elige sus secciones y su orden en evento.secciones.
const SECCIONES = { portada, cuenta, frase, evento, calendario, vestimenta, foto, rsvp, regalos, galeria, mensajes, pie };
const POR_DEFECTO = ['portada', 'cuenta', 'evento', 'calendario', 'vestimenta', 'rsvp', 'regalos', 'mensajes', 'pie'];
const app = document.getElementById('app');

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
  const { slug, codigo, familia: enlace } = leerParametros();
  const ev = await data.getEvento(slug || DEMO_EVENT_SLUG);
  aplicarTema(ev.tema);
  document.title = `${ev.titulo} · Invitación`;

  const familia = await buscarFamilia(ev, codigo, enlace);
  const musica = crearMusica(ev.musica ?? {});
  const ctx = { evento: ev, familia, musica, data };

  // Las secciones se montan debajo del sobre al tocar el sello, para que el
  // sobre se abra sobre la invitación ya lista.
  sobre.montar(document.body, {
    ...ctx,
    alAbrir: async () => {
      musica.iniciar();
      app.innerHTML = '';
      for (const nombre of ev.secciones ?? POR_DEFECTO) {
        const s = SECCIONES[nombre];
        if (!s) continue;
        const nodo = document.createElement('section');
        nodo.dataset.seccion = nombre;
        app.append(nodo);
        s.montar(nodo, ctx);
      }
    },
  });
}

iniciar().catch((err) => {
  app.innerHTML = html`<p class="error">${err.message || 'No pudimos cargar la invitación.'}</p>`;
  console.error(err);
});
