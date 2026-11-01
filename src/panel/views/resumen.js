// Vista "Resumen" del panel (diseño aprobado en Claude Design).
// Celular: una columna. Escritorio: tres totales en fila, recordatorio junto a
// la cuenta regresiva y lo más reciente de la actividad.
import { saludo } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';
import { goldRule, statCard, plural } from '../../lib/ui.js';
import { actividadLista, abrirRecordatorios } from '../componentes.js';

export async function montar(contenedor, ctx) {
  const { evento, data, tema, escritorio, ir } = ctx;
  const r = await data.getResumen(evento.id);
  const recepcion = evento.sedes?.find((s) => s.id === 'recepcion') ?? evento.sedes?.at(-1);
  const lugar = [recepcion?.nombre, evento.ciudad].filter(Boolean).join(' · ');

  if (!r.familias.total) {
    contenedor.innerHTML = vacio(r, lugar);
    contenedor.querySelector('[data-agregar]').addEventListener('click', () => ir('invitados'));
    return;
  }

  const totales = {
    confirmados: statCard({
      dark: true, value: r.pases.confirmados, label: 'Confirmados',
      note: `${r.pases.confirmados === 1 ? 'persona' : 'personas'} · ${plural(r.familias.confirmadas, 'familia', 'familias')} · de ${r.pases.asignados} pases`,
    }),
    pendientes: statCard({
      value: r.pases.pendientes, label: 'Pendientes',
      note: `${r.pases.pendientes === 1 ? 'persona' : 'personas'} · ${plural(r.familias.pendientes, 'familia', 'familias')}`,
    }),
    noAsisten: statCard({
      value: r.pases.noAsisten, label: 'No asisten',
      note: `${r.pases.noAsisten === 1 ? 'persona' : 'personas'} · ${plural(r.familias.noAsisten, 'familia', 'familias')}`,
    }),
  };

  const faltan = html`<div class="label">Faltan</div>
    <div class="t-numero">${plural(r.diasRestantes, 'día', 'días')}</div>`;
  const aviso = tema.avisoContraste
    ? crudo(html`<p class="t-body resumen__aviso">El color de su evento no da contraste suficiente para un botón; usamos pizarra y lo dejamos en filetes y sello.</p>`)
    : '';
  const intro = html`<p class="t-body">${saludo()}. Así va su lista hoy; vuelvan a abrirla para ver las respuestas nuevas.</p>`;

  if (escritorio) {
    const recientes = await data.getActividad(evento.id, { limite: 4 });
    contenedor.innerHTML = html`<div class="resumen resumen--escritorio">
      ${crudo(intro)}
      <div class="resumen__totales">${crudo(totales.confirmados)}${crudo(totales.pendientes)}${crudo(totales.noAsisten)}</div>
      <div class="resumen__fila">
        ${crudo(recordatorio(r, evento, true))}
        <div class="sheet resumen__faltan">${crudo(faltan)}<p class="t-meta">${lugar}</p></div>
      </div>
      ${aviso}
      <div class="sheet resumen__reciente">
        <div class="resumen__reciente-cabeza"><h2 class="t-h2">Lo más reciente</h2>
          <button class="btn btn--quiet" type="button" data-ir="actividad">Ver toda la actividad</button></div>
        ${crudo(actividadLista(recientes, evento.zonaHoraria))}
      </div>
    </div>`;
  } else {
    contenedor.innerHTML = html`<div class="resumen">
      ${crudo(intro)}
      ${crudo(totales.confirmados)}
      <div class="resumen__par">${crudo(totales.pendientes)}${crudo(totales.noAsisten)}</div>
      ${crudo(recordatorio(r, evento, false))}
      ${aviso}
      ${crudo(goldRule({ ornament: true, width: '50%' }))}
      <div class="resumen__faltan">${crudo(faltan)}<p class="t-body">${lugar}</p></div>
    </div>`;
  }

  contenedor.querySelector('[data-recordar]')?.addEventListener('click', () => abrirRecordatorios(ctx));
  for (const b of contenedor.querySelectorAll('[data-ir]')) b.addEventListener('click', () => ir(b.dataset.ir));
}

function recordatorio(r, evento, escritorio) {
  if (!r.familias.pendientes) {
    return html`<div class="sheet resumen__recordar">
      <h2 class="t-h2">Ya respondieron todas las familias</h2>
      <p class="t-body">No hay a quién recordarle. Aquí verán cualquier cambio en cuanto llegue.</p>
    </div>`;
  }
  const n = r.pases.pendientes;
  const titulo = `${plural(n, 'persona', 'personas')} aún no ${n === 1 ? 'responde' : 'responden'}`;
  const limite = r.diasParaFechaLimite == null
    ? ''
    : r.diasParaFechaLimite === 0
      ? ' y hoy es la fecha límite'
      : ` y ${r.diasParaFechaLimite === 1 ? 'falta 1 día' : `faltan ${r.diasParaFechaLimite} días`} para la fecha límite`;
  const familias = r.familias.pendientes === 1 ? 'Es 1 familia' : `Son ${r.familias.pendientes} familias`;
  const explicacion = 'Se abre su WhatsApp con el mensaje ya escrito, una familia a la vez. Ustedes lo mandan; nada se envía solo.';
  const verQuienes = html`<button class="btn btn--quiet" type="button" data-ir="invitados?filtro=pendientes">Ver quiénes son</button>`;
  const recordar = html`<button class="btn${escritorio ? '' : ' btn--full'}" type="button" data-recordar>Recordar por WhatsApp</button>`;

  return html`<div class="sheet resumen__recordar">
    <h2 class="t-h2">${titulo}</h2>
    <p class="t-body">${familias}${limite}. Un recordatorio amable suele bastar.</p>
    ${escritorio
      ? crudo(html`<p class="t-meta">${explicacion}</p><div class="resumen__acciones">${crudo(recordar)}${crudo(verQuienes)}</div>`)
      : crudo(html`${crudo(recordar)}<p class="t-meta">${explicacion}</p>${crudo(verQuienes)}`)}
  </div>`;
}

function vacio(r, lugar) {
  return html`<div class="resumen">
    <p class="t-body">Bienvenidos. Su invitación ya está lista; ahora armemos su lista de invitados.</p>
    <div class="sheet resumen__recordar">
      <h2 class="t-h2">Primer paso: su lista</h2>
      <p class="t-body">Agreguen a cada familia con sus pases. En cuanto empiecen a responder, aquí verán quién confirmó.</p>
      <button class="btn btn--full" type="button" data-agregar>Agregar invitados</button>
    </div>
    ${crudo(goldRule({ ornament: true, width: '50%' }))}
    <div class="resumen__faltan"><div class="label">Faltan</div>
      <div class="t-numero">${plural(r.diasRestantes, 'día', 'días')}</div><p class="t-body">${lugar}</p></div>
  </div>`;
}
