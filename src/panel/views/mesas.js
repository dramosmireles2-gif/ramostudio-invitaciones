// Vista "Mesas" del panel (diseño de Claude Design, PanelMesas.jsx), por persona.
// Totales, plano del salón (un círculo por persona) o lista por mesa, avisos
// "Para revisar" y una hoja por mesa: ocupación, lugares, familias plegables
// con sus personas, dividir familias y mover personas a otra mesa.
// En escritorio es la misma columna con un ancho máximo.
import { html, crudo } from '../../lib/dom.js';
import { statCard, statusTag, segmented, abrirBottomSheet, abrirConfirmacion, toast, plural } from '../../lib/ui.js';

const ESTADO_PERSONA = { confirmado: 'Confirmado', pendiente: 'Por confirmar', no: 'No asiste' };
const TAG_PERSONA = { confirmado: 'confirmado', pendiente: 'pendiente', no: 'no' };

// Se conservan al cambiar de vista y regresar.
const preferencias = { vista: 'plano', soloConfirmados: false };

function estadoFamilia(f) {
  if (f.rsvp.estado === 'confirmado') return 'confirmado';
  if (f.rsvp.estado === 'no_asiste') return 'no';
  return f.abrioFecha ? 'vio' : 'sinabrir';
}

// Iniciales para los lugares del plano: "Lucía Pérez" → "LP".
function iniciales(nombre) {
  const p = nombre.replace(/^(Sr\.|Sra\.|Dra?\.|Ing\.|Lic\.|Mtra?\.)\s+/, '').split(/\s+/)
    .filter((x) => !['y', 'e', 'de', 'la', 'del'].includes(x.toLowerCase()));
  return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || '');
}

const personas = (n) => plural(n, 'persona', 'personas');
const ordenEstado = { confirmado: 0, pendiente: 1, no: 2 };

export async function montar(destino, ctx) {
  const { evento, data, escritorio, ir } = ctx;
  const { personasDe, textoCapacidad, mesasDeFamilia } = data;
  // Raíz propia para que los escuchadores no se acumulen en el contenedor compartido.
  const contenedor = document.createElement('div');
  contenedor.className = `mesas${escritorio ? ' mesas--escritorio' : ''}`;
  destino.append(contenedor);

  let familias = [];
  let gente = []; // Todas las personas, con familia, estado y si ocupan lugar.
  let mesas = [];
  let sinMesa = []; // Personas que asisten (o siguen pendientes) sin mesa.
  // Hoja abierta: { mesaId ('' = sin mesa), cuerpo, cerrar, modo, abiertas }.
  let hoja = null;

  async function cargar() {
    const [fams, ms] = await Promise.all([data.getFamilias(evento.id), data.getMesas(evento.id)]);
    familias = fams.map((f) => ({ ...f, status: estadoFamilia(f) }));
    gente = familias.flatMap(personasDe);
    mesas = ms.map((m) => {
      const sentadas = gente.filter((p) => p.mesaId === m.id);
      return {
        ...m,
        sentadas,
        noAsisten: sentadas.filter((p) => !p.ocupa),
        cap: textoCapacidad(m.ocupados, m.capacidad),
        libres: Math.max(0, m.capacidad - m.ocupados),
      };
    });
    sinMesa = gente.filter((p) => p.ocupa && !p.mesaId);
  }

  const nombreMesa = (id) => mesas.find((m) => m.id === id)?.nombre ?? 'Sin mesa';
  const familiaDe = (p) => familias.find((f) => f.id === p.familiaId);

  // "Dividida: 3 en Mesa 4 · 2 en Mesa 12", o '' si está toda junta.
  function textoDividida(f) {
    const partes = mesasDeFamilia(f);
    if (partes.length < 2) return '';
    return `Dividida: ${partes.map(({ mesaId, n }) => `${n} ${mesaId ? `en ${nombreMesa(mesaId)}` : 'sin mesa'}`).join(' · ')}`;
  }

  // --- Plano y lista ------------------------------------------------------------

  function mesaMini(m, tam = 124) {
    // Primero quienes ocupan lugar (confirmados y luego pendientes), después
    // quienes no asisten pero siguen sentados; al final los lugares libres.
    const asientos = [...m.sentadas].sort((a, b) => ordenEstado[a.estado] - ordenEstado[b.estado]);
    const total = Math.max(m.capacidad, asientos.length);
    // Con muchos lugares la mesa crece para que no se empalmen (cada lugar
    // conserva su tamaño); pasando 300 px, los lugares se achican un poco.
    let lado = tam * 0.165;
    const separacion = 1.15;
    tam = Math.max(tam, Math.min(300, Math.ceil((total * lado * separacion) / (2 * Math.PI * 0.4))));
    const orbita = tam * 0.4;
    lado = Math.max(12, Math.min(lado, (2 * Math.PI * orbita) / total / separacion));
    const corto = textoCapacidad(m.ocupados, m.capacidad, { corto: true });
    let ocupando = 0;
    const lugares = Array.from({ length: total }, (_, k) => {
      const a = (k / total) * Math.PI * 2 - Math.PI / 2;
      const left = (tam / 2 + Math.cos(a) * orbita - lado / 2).toFixed(1);
      const top = (tam / 2 + Math.sin(a) * orbita - lado / 2).toFixed(1);
      const p = asientos[k];
      const estilo = `left:${left}px;top:${top}px`;
      if (!p || (preferencias.soloConfirmados && p.estado !== 'confirmado')) {
        return crudo(html`<span class="mesa-mini__lugar mesa-mini__lugar--libre" style="${estilo}"></span>`);
      }
      if (p.ocupa) ocupando += 1;
      // Los lugares de más (pasando la capacidad) se ven en rojo.
      const clase = !p.ocupa ? 'no' : ocupando > m.capacidad ? 'exceso' : p.estado === 'confirmado' ? 'confirmado' : 'pendiente';
      return crudo(html`<button class="mesa-mini__lugar mesa-mini__lugar--${clase}" type="button" style="${estilo}"
        data-persona="${p.id}" aria-label="${p.nombre}, ${p.familia}, ${ESTADO_PERSONA[p.estado]}">${iniciales(p.nombre)}</button>`);
    });
    return html`<div class="mesa-mini${tam > 124 ? ' mesa-mini--grande' : ''}" style="--tam:${tam}px;--lado:${lado.toFixed(1)}px">
      ${lugares}
      <button class="mesa-mini__centro mesa-mini__centro--${corto.estado}" type="button" data-mesa="${m.id}"
        aria-label="${m.nombre}, ${m.ocupados} de ${m.capacidad} lugares. ${m.cap.texto}">
        <span class="mesa-mini__nombre">${m.nombre}</span>
        <span class="mesa-mini__cupo">${corto.texto}</span>
      </button>
    </div>`;
  }

  function plano() {
    const muestra = (texto, clase) => crudo(html`<span class="leyenda__item"><span class="leyenda__muestra mesa-mini__lugar--${clase}"></span>${texto}</span>`);
    return html`<div class="sheet plano">
      ${crudo(segmented('mostrar', [['todos', 'Todos'], ['conf', 'Solo confirmados']], preferencias.soloConfirmados ? 'conf' : 'todos', 'Qué lugares mostrar'))}
      <div class="plano__novios t-meta">Mesa de los novios</div>
      <div class="plano__mesas">${mesas.map((m) => crudo(mesaMini(m)))}</div>
      <div class="leyenda">${muestra('Confirmado', 'confirmado')}${muestra('Por confirmar', 'pendiente')}${muestra('De más', 'exceso')}${muestra('No asiste', 'no')}${muestra('Libre', 'libre')}</div>
      <p class="t-meta">Cada círculo es una persona, con sus iniciales. Toquen un círculo para ver quién es, o el centro de una mesa para acomodarla.</p>
    </div>`;
  }

  // Línea de capacidad con su color (exceso en rojo, completa en verde discreto).
  const lineaCapacidad = (cap, clase = '') => html`<p class="capacidad capacidad--${cap.estado} ${clase}">${cap.texto}</p>`;

  function listaPorMesa() {
    const fila = (f, lista) => {
      const n = lista.filter((p) => p.familiaId === f.id).length;
      const dividida = textoDividida(f);
      return crudo(html`<div class="mesa-bloque__fila">
        <div class="mesa-bloque__dato"><span class="t-body t-strong">${f.nombre}</span><span class="t-meta">${n}</span></div>
        ${f.status !== 'confirmado' ? crudo(statusTag(f.status)) : ''}
        ${dividida ? crudo(html`<span class="t-meta">${dividida}</span>`) : ''}
      </div>`);
    };
    const familiasDe = (lista) => familias.filter((f) => lista.some((p) => p.familiaId === f.id));
    const bloque = (id, titulo, sub, extra, lista, accion) => crudo(html`<div class="sheet mesa-bloque">
      <div class="mesa-bloque__cabeza"><h3 class="t-h2">${titulo}</h3><span class="t-meta">${sub}</span></div>
      ${extra}
      <div class="mesa-bloque__filas">${familiasDe(lista).map((f) => fila(f, lista))}</div>
      ${lista.length ? '' : crudo(html`<p class="t-meta">Mesa libre.</p>`)}
      <button class="btn btn--quiet btn--flush" type="button" data-mesa="${id}">${accion}</button>
    </div>`);
    return html`${sinMesa.length
      ? bloque('', 'Sin mesa', personas(sinMesa.length), crudo(statusTag('pendiente', 'Por acomodar')), sinMesa, 'Darles lugar')
      : ''}${mesas.map((m) => bloque(m.id, m.nombre, `${m.ocupados} de ${m.capacidad} lugares`, crudo(lineaCapacidad(m.cap)), m.sentadas, 'Editar mesa'))}`;
  }

  function avisos() {
    const items = [];
    for (const m of mesas.filter((x) => x.cap.estado === 'exceso')) {
      items.push(['no', 'Sobrepasada', `${m.nombre}: ${m.cap.texto}.`, 'Acomodar', `data-mesa="${m.id}"`]);
    }
    if (sinMesa.length) {
      const fams = new Set(sinMesa.map((p) => p.familiaId)).size;
      items.push(['pendiente', 'Sin mesa', `${personas(sinMesa.length)} sin mesa · ${plural(fams, 'familia', 'familias')}.`, 'Darles lugar', 'data-mesa=""']);
    }
    for (const m of mesas.filter((x) => x.noAsisten.length)) {
      const nombres = m.noAsisten.map((p) => p.nombre);
      const lista = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0];
      items.push(['vio', 'Liberar', `${lista} no ${nombres.length === 1 ? 'asistirá y sigue' : 'asistirán y siguen'} en la ${m.nombre}.`, 'Liberar lugares', `data-liberar="${m.id}"`]);
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
    const conLugar = gente.filter((p) => p.ocupa && p.mesaId).length;
    const libres = mesas.reduce((n, m) => n + m.libres, 0);
    const famsSin = new Set(sinMesa.map((p) => p.familiaId)).size;
    contenedor.innerHTML = html`
      <div class="mesas__totales">
        ${crudo(statCard({ value: conLugar, label: 'Con lugar', note: `personas · ${plural(libres, 'lugar libre', 'lugares libres')}` }))}
        ${crudo(statCard({ value: sinMesa.length, label: 'Sin mesa', note: `personas · ${plural(famsSin, 'familia', 'familias')}` }))}
      </div>
      ${crudo(segmented('vista', [['plano', 'Plano del salón'], ['lista', 'Lista por mesa']], preferencias.vista, 'Cómo ver las mesas'))}
      ${crudo(preferencias.vista === 'plano' ? plano() : listaPorMesa())}
      <h2 class="t-h2">Para revisar</h2>
      ${crudo(avisos())}
      <button class="btn btn--secondary btn--full" type="button" data-agregar-mesa>Agregar mesa</button>`;
  }

  // --- Hoja de una mesa ---------------------------------------------------------

  const opcionesMesa = (actual, { conCupo = false } = {}) => [
    crudo(html`<option value=""${crudo(!actual ? ' selected' : '')}>Sin mesa</option>`),
    ...mesas.map((x) => crudo(html`<option value="${x.id}"${crudo(x.id === actual ? ' selected' : '')}>${x.nombre}${conCupo ? ` · ${x.cap.texto.toLowerCase()}` : ''}</option>`)),
  ];

  function tarjetaFamilia(f, lista) {
    const deAqui = lista.filter((p) => p.familiaId === f.id);
    const dividida = textoDividida(f);
    const abierta = hoja.abiertas.has(f.id);
    return html`<details class="familia-mesa" data-familia-card="${f.id}"${crudo(abierta ? ' open' : '')}>
      <summary class="familia-mesa__cabeza">
        <span class="familia-mesa__titulo"><span class="t-h3">${f.nombre}</span><span class="t-meta">${personas(deAqui.length)}</span></span>
        ${crudo(statusTag(f.status))}
        ${dividida ? crudo(html`<span class="familia-mesa__dividida">${dividida}</span>`) : ''}
      </summary>
      <div class="familia-mesa__personas">
        ${deAqui.map((p) => crudo(html`<div class="persona-mesa persona-mesa--${p.estado}">
          <div class="persona-mesa__dato"><span class="persona-mesa__nombre">${p.nombre}</span><span class="persona-mesa__estado">${ESTADO_PERSONA[p.estado]}</span></div>
          <label class="sr-only" for="pm-${p.id}">Mesa de ${p.nombre}</label>
          <select class="field__control persona-mesa__select" id="pm-${p.id}" data-persona-mesa="${p.id}">${opcionesMesa(p.mesaId)}</select>
        </div>`))}
        <button class="btn btn--secondary" type="button" data-dividir="${f.id}">Dividir familia</button>
      </div>
    </details>`;
  }

  function vistaMesa(mesaId) {
    const m = mesas.find((x) => x.id === mesaId);
    const lista = m ? m.sentadas : sinMesa;
    const confirmados = lista.filter((p) => p.estado === 'confirmado').length;
    const pendientes = lista.filter((p) => p.estado === 'pendiente').length;
    const fams = familias.filter((f) => lista.some((p) => p.familiaId === f.id));
    let cabeza = '';
    if (m) {
      const pct = Math.min(100, Math.round((m.ocupados / m.capacidad) * 100));
      const sugerida = mesas.filter((x) => x.id !== m.id && x.libres > 0).sort((a, b) => b.libres - a.libres)[0];
      const exceso = m.ocupados - m.capacidad;
      cabeza = html`<div class="hoja-mesa__arriba">
          <div class="ocupacion ocupacion--${m.cap.estado}">
            <div class="ocupacion__barra" role="img" aria-label="${m.ocupados} de ${m.capacidad} lugares"><span style="width:${pct}%"></span></div>
            <span class="ocupacion__cifra">${m.ocupados}/${m.capacidad}</span>
          </div>
          <div class="field">
            <label class="field__label" for="cap-${m.id}">Lugares en la mesa</label>
            <div class="stepper">
              <button class="btn btn--secondary stepper__boton" type="button" data-cap-paso="-1" aria-label="Un lugar menos">−</button>
              <input class="field__control stepper__valor" id="cap-${m.id}" type="number" inputmode="numeric" min="1" max="30" value="${m.capacidad}" data-capacidad="${m.id}">
              <button class="btn btn--secondary stepper__boton" type="button" data-cap-paso="1" aria-label="Un lugar más">+</button>
            </div>
          </div>
        </div>
        ${crudo(lineaCapacidad(m.cap))}
        ${exceso > 0 ? crudo(html`<div class="alerta-mesa" role="alert">
          <p class="t-body">${sugerida
            ? `La ${sugerida.nombre} tiene ${plural(sugerida.libres, 'lugar libre', 'lugares libres')}.`
            : 'Ninguna otra mesa tiene lugares libres: suban los lugares o agreguen una mesa.'}</p>
          ${sugerida ? crudo(html`<button class="btn btn--full btn--peligro" type="button" data-sugerir="${sugerida.id}">Mover ${personas(Math.min(exceso, sugerida.libres))} a ${sugerida.nombre}</button>`) : ''}
        </div>`) : ''}`;
    }
    return html`${crudo(cabeza)}
      ${lista.length ? crudo(html`<p class="t-body hoja-mesa__cuenta">${confirmados} ${confirmados === 1 ? 'confirmado' : 'confirmados'} · <span class="atenuado">${pendientes} por confirmar</span></p>`) : ''}
      ${lista.length ? '' : crudo(html`<p class="t-body">${m ? 'Esta mesa está libre.' : 'Todos tienen lugar.'}</p>`)}
      <div class="hoja-mesa__familias">${fams.map((f) => crudo(tarjetaFamilia(f, lista)))}</div>
      ${m ? crudo(html`<button class="btn btn--quiet btn--flush btn--quitar" type="button" data-quitar-mesa="${m.id}">Quitar esta mesa</button>`) : ''}`;
  }

  // Selección de personas para mover (alerta de exceso o "Dividir familia").
  // No mueve a nadie hasta que confirman.
  function vistaMover({ titulo, candidatas, destino, ayuda }) {
    const sel = hoja.modo.seleccion;
    const varias = new Set(candidatas.map((p) => p.familiaId)).size > 1;
    return html`<button class="btn btn--quiet btn--flush hoja-mesa__volver" type="button" data-volver-mesa>Volver a la mesa</button>
      <h3 class="t-h2">${titulo}</h3>
      <p class="t-body">${ayuda}</p>
      <div class="sheet seleccion" role="group" aria-label="Personas">${candidatas.map((p) => crudo(html`
        <label class="seleccion__persona persona-mesa--${p.estado}">
          <input type="checkbox" data-sel="${p.id}"${crudo(sel.has(p.id) ? ' checked' : '')}${crudo(p.ocupa ? '' : ' disabled')}>
          <span class="seleccion__textos"><span class="persona-mesa__nombre">${p.nombre}</span>
            <span class="t-meta">${[varias ? p.familia : '', nombreMesa(p.mesaId), ESTADO_PERSONA[p.estado]].filter(Boolean).join(' · ')}</span></span>
        </label>`))}</div>
      <div class="field">
        <label class="field__label" for="mover-destino">A qué mesa</label>
        <select class="field__control" id="mover-destino" data-destino>${opcionesMesa(destino, { conCupo: true })}</select>
      </div>
      <p class="capacidad capacidad--exceso" data-aviso-cupo hidden></p>
      <button class="btn btn--full btn--lg" type="button" data-confirmar-mover disabled>Elijan a quién mover</button>`;
  }

  // Al marcar personas o cambiar la mesa solo se actualizan el botón y el
  // aviso (no se vuelve a pintar la lista, así no se pierde el foco).
  function refrescarMover() {
    const { candidatas, destino } = hoja.modo.datos();
    const destinoMesa = mesas.find((x) => x.id === destino);
    const moviendo = candidatas.filter((p) => hoja.modo.seleccion.has(p.id) && p.mesaId !== destino).length;
    const cupo = destinoMesa ? destinoMesa.libres : Infinity;
    const aviso = hoja.cuerpo.querySelector('[data-aviso-cupo]');
    const boton = hoja.cuerpo.querySelector('[data-confirmar-mover]');
    aviso.hidden = moviendo <= cupo;
    aviso.textContent = `En ${destinoMesa?.nombre} ${cupo === 1 ? 'solo queda 1 lugar libre' : `solo quedan ${cupo} lugares libres`}.`;
    boton.disabled = !moviendo || moviendo > cupo;
    boton.textContent = moviendo ? `Mover ${personas(moviendo)} a ${destinoMesa ? destinoMesa.nombre : '“Sin mesa”'}` : 'Elijan a quién mover';
  }

  function pintarHoja() {
    if (!hoja) return;
    const { modo } = hoja;
    if (modo.tipo === 'mesa') hoja.cuerpo.innerHTML = vistaMesa(hoja.mesaId);
    else {
      hoja.cuerpo.innerHTML = vistaMover(modo.datos());
      refrescarMover();
    }
  }

  function abrirDetalle(mesaId) {
    const m = mesas.find((x) => x.id === mesaId);
    const cuerpo = document.createElement('div');
    cuerpo.className = 'hoja-mesa';
    cuerpo.addEventListener('change', alCambiarEnHoja);
    cuerpo.addEventListener('click', alTocarEnHoja);
    cuerpo.addEventListener('toggle', (e) => {
      const card = e.target.closest?.('[data-familia-card]');
      if (!card) return;
      if (card.open) hoja.abiertas.add(card.dataset.familiaCard);
      else hoja.abiertas.delete(card.dataset.familiaCard);
    }, true);
    const { cerrar } = abrirBottomSheet({ titulo: m ? m.nombre : 'Sin mesa', contenido: cuerpo, alCerrar: () => { hoja = null; } });
    hoja = { mesaId, cuerpo, cerrar, modo: { tipo: 'mesa' }, abiertas: new Set() };
    pintarHoja();
  }

  function abrirMover(datos) {
    hoja.modo = { tipo: 'mover', seleccion: new Set(), destino: datos.destino, datos: () => ({ ...datos(), destino: hoja.modo.destino }) };
    pintarHoja();
    hoja.cuerpo.scrollIntoView?.({ block: 'start' });
  }

  // Alerta de exceso: elegir a quién de esta mesa pasar a la mesa sugerida.
  function moverDesdeMesa(destinoId) {
    const m = mesas.find((x) => x.id === hoja.mesaId);
    const datos = () => {
      const mm = mesas.find((x) => x.id === m.id);
      return {
        titulo: `Mover personas de la ${mm.nombre}`,
        ayuda: `Sobran ${personas(mm.ocupados - mm.capacidad)}. Elijan a quién mover; nadie se mueve hasta que confirmen.`,
        candidatas: mm.sentadas.filter((p) => p.ocupa),
      };
    };
    datos.destino = destinoId;
    abrirMover(datos);
  }

  // "Dividir familia": elegir qué personas de la familia van a otra mesa.
  function dividirFamilia(familiaId) {
    const f = familias.find((x) => x.id === familiaId);
    const actual = mesasDeFamilia(f)[0]?.mesaId ?? null;
    const datos = () => ({
      titulo: `Dividir a ${f.nombre}`,
      ayuda: 'Elijan qué personas se sientan en otra mesa y a cuál.',
      candidatas: gente.filter((p) => p.familiaId === f.id && (p.ocupa || p.mesaId)),
    });
    datos.destino = mesas.filter((x) => x.id !== actual && x.libres > 0).sort((a, b) => b.libres - a.libres)[0]?.id ?? '';
    abrirMover(datos);
  }

  async function recargar() {
    await cargar();
    pintar();
    pintarHoja();
  }

  async function intentar(accion, mensaje) {
    try {
      await accion();
      if (mensaje) toast(mensaje);
      return true;
    } catch (err) {
      if (!err.codigo) throw err;
      toast(err.message);
      return false;
    } finally {
      await recargar();
    }
  }

  async function alCambiarEnHoja(e) {
    const t = e.target;
    if (t.dataset.personaMesa) {
      await intentar(() => data.asignarPersonaMesa(t.dataset.personaMesa, t.value || null), 'Listo, cambiamos su lugar.');
    } else if (t.dataset.capacidad) {
      await guardarCapacidad(t.dataset.capacidad, Number(t.value));
    } else if (t.dataset.sel) {
      if (t.checked) hoja.modo.seleccion.add(t.dataset.sel);
      else hoja.modo.seleccion.delete(t.dataset.sel);
      refrescarMover();
    } else if ('destino' in t.dataset) {
      hoja.modo.destino = t.value;
      refrescarMover();
    }
  }

  async function guardarCapacidad(mesaId, valor) {
    const capacidad = Math.min(30, Math.max(1, Math.round(valor) || 1));
    await intentar(() => data.actualizarMesa(mesaId, { capacidad }), `Ahora caben ${capacidad}.`);
  }

  async function alTocarEnHoja(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.capPaso) {
      const m = mesas.find((x) => x.id === hoja.mesaId);
      await guardarCapacidad(m.id, m.capacidad + Number(b.dataset.capPaso));
    } else if (b.dataset.sugerir) moverDesdeMesa(b.dataset.sugerir);
    else if (b.dataset.dividir) dividirFamilia(b.dataset.dividir);
    else if (b.hasAttribute('data-volver-mesa')) {
      hoja.modo = { tipo: 'mesa' };
      pintarHoja();
    } else if (b.hasAttribute('data-confirmar-mover')) {
      const { candidatas, destino } = hoja.modo.datos();
      const ids = candidatas.filter((p) => hoja.modo.seleccion.has(p.id) && p.mesaId !== destino).map((p) => p.id);
      const ok = await intentar(() => data.asignarPersonasMesa(ids, destino || null),
        `Movimos a ${personas(ids.length)} a ${destino ? nombreMesa(destino) : '“Sin mesa”'}.`);
      if (ok && hoja) {
        hoja.modo = { tipo: 'mesa' };
        pintarHoja();
      }
    } else if (b.dataset.quitarMesa) quitarMesa(b.dataset.quitarMesa);
  }

  // Mini hoja de una persona del plano: nombre completo, familia y RSVP.
  function verPersona(personaId) {
    const p = gente.find((x) => x.id === personaId);
    const f = familiaDe(p);
    const dividida = textoDividida(f);
    const cuerpo = document.createElement('div');
    cuerpo.className = 'persona-info';
    cuerpo.innerHTML = html`
      <div class="persona-info__dato"><span class="label">Familia</span><span class="t-body t-strong">${f.nombre}</span></div>
      <div class="persona-info__dato"><span class="label">Confirmación</span>${crudo(statusTag(TAG_PERSONA[p.estado], ESTADO_PERSONA[p.estado]))}</div>
      <div class="persona-info__dato"><span class="label">Mesa</span><span class="t-body">${nombreMesa(p.mesaId)}${dividida ? ` · ${dividida}` : ''}</span></div>
      ${p.mesaId ? crudo(html`<button class="btn btn--secondary btn--full" type="button" data-ver-mesa>Ver ${nombreMesa(p.mesaId)}</button>`) : ''}`;
    const mini = abrirBottomSheet({ titulo: p.nombre, contenido: cuerpo });
    cuerpo.querySelector('[data-ver-mesa]')?.addEventListener('click', () => {
      mini.cerrar();
      abrirDetalle(p.mesaId);
    });
  }

  // --- Acciones de la vista -------------------------------------------------------

  async function liberar(mesaId) {
    const m = mesas.find((x) => x.id === mesaId);
    await intentar(() => data.asignarPersonasMesa(m.noAsisten.map((p) => p.id), null),
      `Liberamos ${plural(m.noAsisten.length, 'lugar', 'lugares')} en la ${m.nombre}.`);
  }

  async function agregarMesa() {
    // El siguiente número después de la mesa más alta ("Mesa 12" → "Mesa 13").
    const n = Math.max(0, ...mesas.map((m) => Number(m.nombre.match(/(\d+)\s*$/)?.[1] ?? 0))) + 1;
    await intentar(() => data.crearMesa(evento.id, { nombre: `Mesa ${n}`, capacidad: 10 }), `Agregamos la Mesa ${n}.`);
  }

  function quitarMesa(mesaId) {
    const m = mesas.find((x) => x.id === mesaId);
    const n = m.sentadas.length;
    abrirConfirmacion({
      titulo: `¿Quitar la ${m.nombre}?`,
      texto: n === 0 ? 'La mesa está vacía. ¿Quitar?'
        : n === 1 ? 'La persona de esta mesa quedará sin mesa. ¿Quitar?'
          : `Las ${n} personas de esta mesa quedarán sin mesa. ¿Quitar?`,
      confirmar: 'Sí, quitar la mesa',
      alConfirmar: async () => {
        hoja?.cerrar();
        await intentar(() => data.eliminarMesa(m.id), `Quitamos la ${m.nombre}.`);
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
    } else if (b.dataset.persona) verPersona(b.dataset.persona);
    else if ('mesa' in b.dataset) abrirDetalle(b.dataset.mesa);
    else if (b.dataset.liberar) liberar(b.dataset.liberar);
    else if (b.hasAttribute('data-agregar-mesa')) agregarMesa();
    else if (b.hasAttribute('data-ir-invitados')) ir('invitados');
  });

  await cargar();
  pintar();
}
