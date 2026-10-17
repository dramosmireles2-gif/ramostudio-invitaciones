// Subvista "Actividad reciente" (Más): quién abrió y quién confirmó, por día.
import { html, crudo } from '../../lib/dom.js';
import { actividadLista, subvista } from '../componentes.js';

export async function montar(destino, ctx) {
  const { evento, data } = ctx;
  const el = subvista(destino, ctx);
  const items = await data.getActividad(evento.id, { limite: 200 });
  el.insertAdjacentHTML('beforeend', items.length
    ? html`<div class="sheet">${crudo(actividadLista(items, evento.zonaHoraria))}</div>`
    : html`<div class="sheet t-body">Cuando manden su invitación, aquí verán quién la abre y quién confirma.</div>`);
}
