// Regalos: lluvia de sobres (frase de los novios, sin cuentas) o las mesas de
// regalos que capturaron en el panel.
import { html, crudo } from '../../lib/dom.js';

export async function montar(contenedor, { evento, data }) {
  contenedor.className = 'regalos';
  const regalos = (await data.getRegalos(evento.id)).filter((r) => r.tipo !== 'transferencia');
  if (!evento.lluviaDeSobres && !regalos.length) return contenedor.remove();
  contenedor.innerHTML = html`
    <h2 class="ev-titulo">${evento.lluviaDeSobres ? 'Lluvia de sobres' : 'Mesa de regalos'}</h2>
    ${evento.lluviaDeSobres && evento.fraseSobres ? crudo(html`<p class="regalos__frase">${evento.fraseSobres}</p>`) : ''}
    ${regalos.map((r) => crudo(html`<div class="regalo">
      <p class="regalo__titulo">${r.titulo}</p>
      ${r.detalle ? crudo(html`<p class="regalo__detalle">${r.detalle}</p>`) : ''}
      ${r.url ? crudo(html`<a class="btn btn--secondary btn--full" href="${r.url}" target="_blank" rel="noopener">Ver mesa de regalos</a>`) : ''}
    </div>`))}`;
}
