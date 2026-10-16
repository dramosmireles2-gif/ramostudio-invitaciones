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
import * as rsvp from './sections/rsvp.js';
import * as regalos from './sections/regalos.js';
import * as mensajes from './sections/mensajes.js';

const SECCIONES = [portada, cuenta, evento, rsvp, regalos, mensajes];
const app = document.getElementById('app');

async function iniciar() {
  const { slug, codigo } = leerParametros();
  const ev = await data.getEvento(slug || DEMO_EVENT_SLUG);
  aplicarTema(ev.tema);
  document.title = `${ev.titulo} · Invitación`;

  // Sin código: vista general (sin RSVP personalizado). Código inválido: aviso.
  let familia = null;
  if (codigo) {
    familia = await data.getFamiliaPorCodigo(ev.id, codigo);
    data.registrarApertura(ev.id, codigo);
  }

  const musica = crearMusica(ev.musica ?? {});
  const ctx = { evento: ev, familia, musica, data };

  sobre.montar(app, {
    ...ctx,
    alAbrir: async () => {
      await musica.iniciar();
      app.innerHTML = '';
      for (const s of SECCIONES) {
        const nodo = document.createElement('section');
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
