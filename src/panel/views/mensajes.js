// Subvista "Mensajes de sus invitados" (Más): las palabras que dejaron al confirmar.
import { fechaNumerica } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';
import { goldRule, paperNote, plural } from '../../lib/ui.js';
import { subvista } from '../componentes.js';

export async function montar(destino, ctx) {
  const { evento, data } = ctx;
  const el = subvista(destino, ctx);
  const mensajes = await data.getMensajes(evento.id); // Del más reciente al más viejo.
  el.insertAdjacentHTML('beforeend', mensajes.length
    ? html`<p class="t-body">${plural(mensajes.length, 'familia les dejó', 'familias les dejaron')} unas palabras al confirmar.</p>
      ${mensajes.map((m) => crudo(paperNote({ name: m.autor, date: fechaNumerica(m.fecha, { zona: evento.zonaHoraria }), msg: m.texto })))}`
    : html`<div class="sheet mas__vacio">${crudo(goldRule({ ornament: true, width: '50%' }))}
        <h3 class="t-h2">Aún no hay mensajes</h3>
        <p class="t-body">Cuando sus invitados confirmen y les escriban unas palabras, aquí las van a encontrar.</p></div>`);
}
