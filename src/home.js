// Portada de la demo: enlaces a una invitación de ejemplo y al panel.
import * as data from './data/index.js';
import { DEMO_EVENT_SLUG } from './config.js';
import { html } from './lib/dom.js';

const lista = document.getElementById('demo-links');
const evento = await data.getEvento(DEMO_EVENT_SLUG);
const [familia] = await data.getFamilias(evento.id);

// Enlaces relativos para que funcionen igual en local y publicados.
const invitacion = `/invitacion/?e=${encodeURIComponent(evento.slug)}&f=${encodeURIComponent(familia.codigo)}`;

lista.innerHTML =
  html`<li><a href="${invitacion}">Ver invitación de ${evento.titulo} (como ${familia.nombre})</a></li>` +
  html`<li><a href="/panel/">Entrar al panel de novios</a></li>`;
