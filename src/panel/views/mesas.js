// Vista "Mesas" del panel (diseño de Claude Design, PanelMesas.jsx).
// Totales, plano del salón o lista por mesa, avisos "Para revisar" y una hoja
// por mesa para mover familias, cambiar los lugares o quitar la mesa.
// En escritorio es la misma columna con un ancho máximo.
import { html, crudo } from '../../lib/dom.js';
import { statCard, statusTag, segmented, abrirBottomSheet, abrirConfirmacion, toast, plural } from '../../lib/ui.js';

const CAPACIDADES = [8, 10, 12];

// Se conservan al cambiar de vista y regresar.
const preferencias = { vista: 'plano', soloConfirmados: false };

function estadoDe(f) {
  if (f.rsvp.estado === 'confirmado') return 'confirmado';
  if (f.rsvp.estado === 'no_asiste') return 'no';
  return f.abrioFecha ? 'vio' : 'sinabrir';
}

// Lugares que ocupa una familia: los confirmados si ya respondió, los
// asignados si sigue pendiente, ninguno si no asiste (igual que getMesas).
function lugares(f) {
  if (f.status === 'confirmado') return f.rsvp.pasesConfirmados;
  if (f.status === 'no') return 0;
  return f.pasesAsignados;
}

// Iniciales para los lugares del plano: "Familia García Pérez" → "GP".
function iniciales(nombre) {
  const p = nombre.replace(/^(Familia|Sr\. y Sra\.|Sr\.|Sra\.|Dra?\.|Ing\.|Lic\.|Mtra?\.)\s+/, '').split(/\s+/)
    .filter((x) => !['y', 'e', 'de', 'la', 'del', 'familia'].includes(x.toLowerCase()));
  return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
}

const personas = (n) => plural(n, 'persona', 'personas');

export async function montar(destino, ctx) {
  const { evento, data, escritorio, ir } = ctx;
  // Raíz propia para que los escuchadores no se acumulen en el contenedor compartido.
  const contenedor = document.createElement('div');
  contenedor.className = `mesas${escritorio ? ' mesas--escritorio' : ''}`;
  destino.append(contenedor);

  let familias = [];
  let mesas = [];
  let sinMesa = [];
  let hoja = null; // { mesaId, cuerpo, cerrar } de la hoja abierta.

  async function cargar() {
    const [fams, ms] = await Promise.all([data.getFamilias(evento.id), data.getMesas(evento.id)]);
    familias = fams.map((f) => ({ ...f, status: estadoDe(f) }));
    mesas = ms.map((m) => {
      const fs = familias.filter((f) => f.mesaId === m.id);
      return { ...m, fs, sobran: m.ocupados - m.capacidad, noAsisten: fs.filter((f) => f.status === 'no') };
    });
    sinMesa = familias.filter((f) => !f.mesaId && f.status !== 'no');
  }

  // --- Pintado ---------------------------------------------------------------

  function mesaMini(m, tam = 124) {
    const asientos = m.fs.flatMap((f) =>
      Array.from({ length: f.status === 'no' ? f.pasesAsignados : lugares(f) }, () => ({ i: iniciales(f.nombre), st: f.status })));
    const total = Math.max(m.capacidad, asientos.length);
    const orbita = tam * 0.4;
    const lado = tam * 0.165;
    const lleno = m.sobran > 0;
    return html`<button class="mesa-mini" type="button" data-mesa="${m.id}" style="--tam:${tam}px"
      aria-label="${m.nombre}, ${m.ocupados} de ${m.capacidad} lugares">
      ${Array.from({ length: total }, (_, k) => {
        const a = (k / total) * Math.PI * 2 - Math.PI / 2;
        const x = asientos[k];
        const ver = x && (!preferencias.soloConfirmados || x.st === 'confirmado');
        const clase = !ver ? 'libre' : x.st === 'confirmado' ? 'confirmado' : x.st === 'no' ? 'no' : 'pendiente';
        const left = (tam / 2 + Math.cos(a) * orbita - lado / 2).toFixed(1);
        const top = (tam / 2 + Math.sin(a) * orbita - lado / 2).toFixed(1);
        return crudo(html`<span class="mesa-mini__lugar mesa-mini__lugar--${clase}" style="left:${left}px;top:${top}px">${ver ? x.i : ''}</span>`);
      })}
      <span class="mesa-mini__centro${lleno ? ' mesa-mini__centro--llena' : ''}">
        <span class="mesa-mini__nombre">${m.nombre}</span>
        <span class="mesa-mini__cupo">${lleno ? `Sobran ${m.sobran}` : `${m.ocupados} de ${m.capacidad}`}</span>
      </span>
    </button>`;
  }

  function plano() {
    const muestra = (texto, clase) => crudo(html`<span class="leyenda__item"><span class="leyenda__muestra mesa-mini__lugar--${clase}"></span>${texto}</span>`);
    return html`<div class="sheet plano">
      ${crudo(segmented('mostrar', [['todos', 'Todos'], ['conf', 'Solo confirmados']], preferencias.soloConfirmados ? 'conf' : 'todos', 'Qué lugares mostrar'))}
      <div class="plano__novios t-meta">Mesa de los novios</div>
      <div class="plano__mesas">${mesas.map((m) => crudo(mesaMini(m)))}</div>
      <div class="leyenda">${muestra('Confirmado', 'confirmado')}${muestra('Por confirmar', 'pendiente')}${muestra('No asiste', 'no')}${muestra('Libre', 'libre')}</div>
      <p class="t-meta">Cada círculo es un lugar, con las iniciales de quien lo ocupa. Toquen una mesa para mover familias o cambiar sus lugares.</p>
    </div>`;
  }

  function listaPorMesa() {
    const fila = (f) => crudo(html`<div class="mesa-bloque__fila">
      <div class="mesa-bloque__dato"><span class="t-body t-strong">${f.nombre}</span><span class="t-meta">${lugares(f)}</span></div>
      ${f.status !== 'confirmado' ? crudo(statusTag(f.status)) : ''}
    </div>`);
    const bloque = (id, titulo, sub, etiqueta, fs, accion) => crudo(html`<div class="sheet mesa-bloque">
      <div class="mesa-bloque__cabeza"><div><h3 class="t-h2">${titulo}</h3><span class="t-meta">${sub}</span></div>${etiqueta}</div>
      <div class="mesa-bloque__filas">${fs.map(fila)}</div>
      ${fs.length ? '' : crudo(html`<p class="t-meta">Mesa libre.</p>`)}
      <button class="btn btn--quiet btn--flush" type="button" data-mesa="${id}">${accion}</button>
    </div>`);
    return html`${sinMesa.length
      ? bloque('', 'Sin mesa', personas(sinMesa.reduce((n, f) => n + lugares(f), 0)), crudo(statusTag('pendiente', 'Por acomodar')), sinMesa, 'Darles lugar')
      : ''}${mesas.map((m) => bloque(m.id, m.nombre, `${m.ocupados} de ${m.capacidad} lugares`,
      m.sobran > 0 ? crudo(statusTag('no', `Sobran ${m.sobran}`)) : m.sobran === 0 ? crudo(statusTag('confirmado', 'Completa')) : '',
      m.fs, 'Editar mesa'))}`;
  }

  function avisos() {
    const items = [];
    for (const m of mesas.filter((x) => x.sobran > 0)) {
      items.push(['no', 'Sobrepasada', `La ${m.nombre} tiene ${personas(m.ocupados)} y caben ${m.capacidad}.`, 'Acomodar', `data-mesa="${m.id}"`]);
    }
    if (sinMesa.length) {
      const p = sinMesa.reduce((n, f) => n + lugares(f), 0);
      items.push(['pendiente', 'Sin mesa', `${personas(p)} sin mesa · ${plural(sinMesa.length, 'familia', 'familias')}.`, 'Darles lugar', 'data-mesa=""']);
    }
    for (const m of mesas.filter((x) => x.noAsisten.length)) {
      const nombres = m.noAsisten.map((f) => f.nombre).join(' y ');
      items.push(['vio', 'Liberar', `${nombres} no ${m.noAsisten.length === 1 ? 'asistirá y sigue' : 'asistirán y siguen'} en la ${m.nombre}.`, 'Liberar lugares', `data-liberar="${m.id}"`]);
    }
    for (const m of mesas.filter((x) => x.ocupados > 0 && x.ocupados <= 4)) {
      items.push(['vio', 'Revisar', `La ${m.nombre} solo tiene ${personas(m.ocupados)}.`, 'Ver mesa', `data-mesa="${m.id}"`]);
    }
    return html`<div class="sheet avisos">${items.length
      ? items.map(([st, etiqueta, texto, accion, atributo]) => crudo(html`<div class="avisos__item">
          ${crudo(statusTag(st, etiqueta))}<p class="t-body">${texto}</p>
          <button class="btn btn--quiet btn--flush" type="button" ${crudo(atributo)}>${accion}</button>
        </div>`))
      : crudo(html`<p class="t-body avisos__vacio">Todo está en su lugar.</p>`)}</div>`;
  }

  function pintar() {
    if (!familias.length) {
      contenedor.innerHTML = html`<div class="sheet mesas__vacio">
        <h2 class="t-h2">Primero, su lista</h2>
        <p class="t-body">Cuando agreguen a sus invitados, aquí los acomodan en el plano del salón, mesa por mesa.</p>
        <button class="btn btn--full" type="button" data-ir-invitados>Ir a mis invitados</button>
      </div>`;
      return;
    }
    const conLugar = mesas.reduce((n, m) => n + m.fs.reduce((k, f) => k + lugares(f), 0), 0);
    const libres = mesas.reduce((n, m) => n + Math.max(0, m.capacidad - m.ocupados), 0);
    const sinLugar = sinMesa.reduce((n, f) => n + lugares(f), 0);
    contenedor.innerHTML = html`
      <div class="mesas__totales">
        ${crudo(statCard({ value: conLugar, label: 'Con lugar', note: `personas · ${plural(libres, 'lugar libre', 'lugares libres')}` }))}
        ${crudo(statCard({ value: sinLugar, label: 'Sin mesa', note: `personas · ${plural(sinMesa.length, 'familia', 'familias')}` }))}
      </div>
      ${crudo(segmented('vista', [['plano', 'Plano del salón'], ['lista', 'Lista por mesa']], preferencias.vista, 'Cómo ver las mesas'))}
      ${crudo(preferencias.vista === 'plano' ? plano() : listaPorMesa())}
      <h2 class="t-h2">Para revisar</h2>
      ${crudo(avisos())}
      <button class="btn btn--secondary btn--full" type="button" data-agregar-mesa>Agregar mesa</button>`;
  }

  // Detalle de una mesa (mesaId) o de las familias sin mesa (mesaId = '').
  function detalle(mesaId) {
    const m = mesas.find((x) => x.id === mesaId);
    const lista = m ? m.fs : sinMesa;
    const libre = mesas.filter((x) => x.id !== mesaId && x.capacidad - x.ocupados > 0)
      .sort((a, b) => (b.capacidad - b.ocupados) - (a.capacidad - a.ocupados))[0];
    const opcion = (valor, texto, actual) => crudo(html`<option value="${valor}"${crudo(valor === actual ? ' selected' : '')}>${texto}</option>`);
    const capacidades = [...new Set([...CAPACIDADES, m?.capacidad].filter(Boolean))].sort((a, b) => a - b);
    return html`
      ${m ? crudo(html`<p class="t-body">${personas(m.ocupados)} · caben ${m.capacidad}</p>`) : ''}
      ${m && m.sobran > 0 ? crudo(html`<p class="t-body detalle-mesa__sobran">Sobran ${plural(m.sobran, 'lugar', 'lugares')}.${libre ? ` La ${libre.nombre} tiene ${plural(libre.capacidad - libre.ocupados, 'libre', 'libres')}.` : ''}</p>`) : ''}
      ${lista.length ? '' : crudo(html`<p class="t-body">${m ? 'Esta mesa está libre.' : 'Todos tienen lugar.'}</p>`)}
      ${lista.map((f) => crudo(html`<div class="detalle-mesa__familia">
        <div class="mesa-bloque__dato"><span class="t-h3">${f.nombre}</span><span class="t-meta">${personas(f.status === 'no' ? f.pasesAsignados : lugares(f))}</span></div>
        ${crudo(statusTag(f.status))}
        <div class="field">
          <label class="field__label" for="mv-${f.id}">Su mesa</label>
          <select class="field__control" id="mv-${f.id}" data-mover="${f.id}">${[opcion('', 'Sin mesa', f.mesaId ?? ''), ...mesas.map((x) => opcion(x.id, x.nombre, f.mesaId))]}</select>
        </div>
      </div>`))}
      ${m ? crudo(html`<div class="field">
        <label class="field__label" for="cap-${m.id}">Lugares en la mesa</label>
        <select class="field__control" id="cap-${m.id}" data-capacidad="${m.id}">${capacidades.map((c) => opcion(String(c), String(c), String(m.capacidad)))}</select>
      </div>
      <button class="btn btn--quiet btn--flush btn--quitar" type="button" data-quitar-mesa="${m.id}">Quitar esta mesa</button>`) : ''}`;
  }

  function abrirDetalle(mesaId) {
    const m = mesas.find((x) => x.id === mesaId);
    const cuerpo = document.createElement('div');
    cuerpo.className = 'detalle-mesa';
    cuerpo.innerHTML = detalle(mesaId);
    cuerpo.addEventListener('change', alCambiar);
    cuerpo.addEventListener('click', (e) => {
      const b = e.target.closest('[data-quitar-mesa]');
      if (b) quitarMesa(b.dataset.quitarMesa);
    });
    const { cerrar } = abrirBottomSheet({ titulo: m ? m.nombre : 'Sin mesa', contenido: cuerpo, alCerrar: () => { hoja = null; } });
    hoja = { mesaId, cuerpo, cerrar };
  }

  // --- Acciones ----------------------------------------------------------------

  async function recargar() {
    await cargar();
    pintar();
    if (hoja) hoja.cuerpo.innerHTML = detalle(hoja.mesaId);
  }

  async function alCambiar(e) {
    const s = e.target;
    try {
      if (s.dataset.mover) {
        await data.asignarMesa(s.dataset.mover, s.value || null);
        toast('Listo, cambiamos su lugar.');
      } else if (s.dataset.capacidad) {
        await data.actualizarMesa(s.dataset.capacidad, { capacidad: Number(s.value) });
        toast(`Ahora caben ${s.value}.`);
      }
    } catch (err) {
      if (!err.codigo) throw err;
      toast(err.codigo === 'mesa_llena' ? `${err.message} Elijan otra o cambien sus lugares.` : err.message);
    }
    await recargar();
  }

  async function liberar(mesaId) {
    const m = mesas.find((x) => x.id === mesaId);
    for (const f of m.noAsisten) await data.asignarMesa(f.id, null);
    const n = m.noAsisten.reduce((k, f) => k + f.pasesAsignados, 0);
    toast(`Liberamos ${plural(n, 'lugar', 'lugares')} en la ${m.nombre}.`);
    await recargar();
  }

  async function agregarMesa() {
    // El siguiente número después de la mesa más alta ("Mesa 12" → "Mesa 13").
    const n = Math.max(0, ...mesas.map((m) => Number(m.nombre.match(/(\d+)\s*$/)?.[1] ?? 0))) + 1;
    const m = await data.crearMesa(evento.id, { nombre: `Mesa ${n}`, capacidad: 10 });
    toast(`Agregamos la ${m.nombre}.`);
    await recargar();
  }

  function quitarMesa(mesaId) {
    const m = mesas.find((x) => x.id === mesaId);
    abrirConfirmacion({
      titulo: `¿Quitar la ${m.nombre}?`,
      texto: m.ocupados
        ? `Las ${plural(m.ocupados, 'persona sentada pasará', 'personas sentadas pasarán')} a “Sin mesa”.`
        : 'La mesa está vacía.',
      confirmar: 'Sí, quitar la mesa',
      alConfirmar: async () => {
        hoja?.cerrar();
        await data.eliminarMesa(m.id);
        toast(`Quitamos la ${m.nombre}.`);
        await recargar();
      },
    });
  }

  contenedor.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.valor) {
      const grupo = b.closest('[data-segmented]').dataset.segmented;
      if (grupo === 'vista') preferencias.vista = b.dataset.valor;
      else preferencias.soloConfirmados = b.dataset.valor === 'conf';
      pintar();
    } else if ('mesa' in b.dataset) abrirDetalle(b.dataset.mesa);
    else if (b.dataset.liberar) liberar(b.dataset.liberar);
    else if (b.hasAttribute('data-agregar-mesa')) agregarMesa();
    else if (b.hasAttribute('data-ir-invitados')) ir('invitados');
  });

  await cargar();
  pintar();
}
