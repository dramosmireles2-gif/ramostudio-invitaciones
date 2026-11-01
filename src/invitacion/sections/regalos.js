// Regalos: la lluvia de sobres (frase de los novios) y las opciones que
// capturaron en su panel: transferencia (con "Copiar CLABE"), y mesas o listas
// de regalos (Liverpool, Amazon…) con su botón. Lo que diga "por confirmar"
// se muestra tal cual, sin botón.
import { html, crudo } from '../../lib/dom.js';

const POR_CONFIRMAR = /por confirmar/i;

// Lluvia de sobres: tres sobres a una línea, cayendo, con la solapa en
// pespunte (como el sobre de la apertura) y el del centro con su sello.
const SOBRE = (x, y, giro, escala, sello) => `<g transform="translate(${x} ${y}) rotate(${giro}) scale(${escala})">
  <rect class="linea" x="-30" y="-20" width="60" height="40" rx="3"/>
  <path class="pespunte" d="M-27 -17L0 4L27 -17"/>
  ${sello ? '<circle class="sello" cx="0" cy="4" r="6"/>' : ''}
</g>`;
const LLUVIA = `<svg class="regalos__lluvia" viewBox="0 0 220 110" aria-hidden="true">
  ${SOBRE(48, 34, -14, 0.62, false)}${SOBRE(110, 60, 6, 1, true)}${SOBRE(176, 28, 16, 0.55, false)}
</svg>`;

// "Banco: X · Titular: Y · CLABE: 0123…" → [['Banco', 'X'], ['Titular', 'Y'], ['CLABE', '0123…']]
const datos = (detalle) => String(detalle ?? '').split('·').map((d) => d.trim()).filter(Boolean)
  .map((d) => { const i = d.indexOf(':'); return i === -1 ? ['', d] : [d.slice(0, i).trim(), d.slice(i + 1).trim()]; });

// La CLABE o cuenta: la serie de dígitos más larga (10 o más), sin espacios.
function numeroCuenta(detalle) {
  const series = (String(detalle ?? '').match(/\d[\d\s]{8,}\d/g) ?? []).map((x) => x.replace(/\s/g, ''));
  return series.sort((a, b) => b.length - a.length)[0] ?? null;
}

function transferencia(r) {
  const cuenta = numeroCuenta(r.detalle);
  return html`<article class="regalo regalo--sobre">
    <p class="ev-etiqueta">${r.titulo || 'Transferencia'}</p>
    <dl class="regalo__datos">${datos(r.detalle).map(([k, v]) => crudo(html`<div>
      ${k ? crudo(html`<dt>${k}</dt>`) : ''}<dd class="${/clabe|cuenta|tarjeta/i.test(k) ? 'regalo__numero' : ''}">${v}</dd>
    </div>`))}</dl>
    ${cuenta ? crudo(html`<button type="button" class="btn btn--secondary btn--full" data-copiar="${cuenta}">${cuenta.length === 18 ? 'Copiar CLABE' : 'Copiar cuenta'}</button>`) : ''}
  </article>`;
}

function mesa(r) {
  const tienda = r.titulo;
  return html`<article class="regalo regalo--tienda" aria-label="${r.tipo === 'lista' ? 'Lista de regalos' : 'Mesa de regalos'} en ${tienda}">
    <p class="regalo__tienda">${tienda}</p>
    ${r.detalle ? crudo(html`<p class="regalo__detalle">${r.detalle}</p>`) : ''}
    ${r.url && !POR_CONFIRMAR.test(r.url)
      ? crudo(html`<a class="btn btn--secondary btn--full" href="${r.url}" target="_blank" rel="noopener">Ver mesa en ${tienda}</a>`)
      : ''}
  </article>`;
}

export async function montar(contenedor, { evento, data, muestra }) {
  // En la invitación de muestra (portafolio público) no van cuentas de banco.
  const regalos = (await data.getRegalos(evento.id)).filter((r) => !(muestra && r.tipo === 'transferencia'));
  if (!evento.lluviaDeSobres && !regalos.length) return contenedor.remove();
  const cuentas = regalos.filter((r) => r.tipo === 'transferencia');
  const tiendas = regalos.filter((r) => r.tipo !== 'transferencia');
  contenedor.className = 'regalos';
  contenedor.innerHTML = html`
    ${evento.lluviaDeSobres ? crudo(LLUVIA) : ''}
    <h2 class="ev-titulo">${evento.lluviaDeSobres ? 'Lluvia de sobres' : 'Mesa de regalos'}</h2>
    ${evento.lluviaDeSobres && evento.fraseSobres ? crudo(html`<p class="regalos__frase">${evento.fraseSobres}</p>`) : ''}
    ${regalos.length && evento.lluviaDeSobres ? crudo('<p class="regalos__tambien">Si lo prefieren, también pueden hacerlo así:</p>') : ''}
    ${cuentas.map((r) => crudo(transferencia(r)))}
    ${tiendas.length ? crudo(html`<div class="regalos__tiendas">${tiendas.map((r) => crudo(mesa(r)))}</div>`) : ''}
    <p class="regalos__aviso" role="status" hidden></p>`;

  const aviso = contenedor.querySelector('.regalos__aviso');
  contenedor.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copiar]');
    if (!b) return;
    try {
      await navigator.clipboard.writeText(b.dataset.copiar);
      b.textContent = 'CLABE copiada';
    } catch {
      aviso.textContent = `CLABE: ${b.dataset.copiar}`;
      aviso.hidden = false;
    }
  });
}
