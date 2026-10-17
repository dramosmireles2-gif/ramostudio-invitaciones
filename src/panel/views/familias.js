// Vista "Invitados" del panel (diseño de Claude Design, PanelInvitados.jsx).
// Celular: lista con búsqueda y filtros; la ficha de una familia abre en
// #invitados?familia=<id> (con "Volver a la lista"). Escritorio: lista a la
// izquierda y la ficha fija a la derecha.
import { enlaceFamilia, enlaceWhatsApp } from '../../lib/links.js';
import { fechaNumerica } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';
import {
  goldRule, statusTag, guestRow, chips, paperNote, abrirBottomSheet, abrirConfirmacion, toast, plural,
} from '../../lib/ui.js';

const FILTROS = [['todos', 'Todos'], ['confirmado', 'Confirmados'], ['pend', 'Pendientes'], ['no', 'No asisten'], ['sinabrir', 'No han abierto']];
const FILTRO_URL = { pendientes: 'pend', confirmados: 'confirmado', 'no-asisten': 'no', 'sin-abrir': 'sinabrir' };
const GRUPOS = ['Familia de la novia', 'Familia del novio', 'Amigos', 'Trabajo'];
// Valor del selector de mesa cuando la familia está repartida en varias mesas.
const DIVIDIDA = '__dividida';

// La búsqueda y el filtro se conservan al abrir una ficha y volver.
const lista = { q: '', k: 'todos' };

const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const coincide = (f, k) => k === 'todos' || (k === 'pend' ? f.status === 'vio' || f.status === 'sinabrir' : f.status === k);

function estadoDe(f) {
  if (f.rsvp.estado === 'confirmado') return 'confirmado';
  if (f.rsvp.estado === 'no_asiste') return 'no';
  return f.abrioFecha ? 'vio' : 'sinabrir';
}

export async function montar(destino, ctx) {
  const { evento, data, params, escritorio, ir } = ctx;
  // Raíz propia: main.js reutiliza el contenedor entre vistas y así los
  // escuchadores de abajo no se acumulan.
  const contenedor = document.createElement('div');
  destino.append(contenedor);
  if (params.filtro) lista.k = FILTRO_URL[params.filtro] ?? 'todos';

  let familias = [];
  let mesas = [];
  let abiertaId = params.familia ?? null;

  async function cargar() {
    const [fams, ms, msgs] = await Promise.all([data.getFamilias(evento.id), data.getMesas(evento.id), data.getMensajes(evento.id)]);
    mesas = ms;
    familias = fams.map((f) => {
      const msg = msgs.find((m) => m.familiaId === f.id); // getMensajes ya viene del más reciente al más viejo.
      // La mesa sale de sus personas: una sola mesa, repartida en varias o sin mesa.
      const partes = data.mesasDeFamilia(f);
      const nombre = (id) => ms.find((m) => m.id === id)?.nombre;
      const conMesa = partes.filter((x) => x.mesaId);
      return {
        ...f,
        status: estadoDe(f),
        mesaId: partes.length === 1 ? partes[0].mesaId : partes.length ? DIVIDIDA : null,
        mesa: partes.length > 1
          ? partes.map((x) => `${x.mesaId ? nombre(x.mesaId) : 'Sin mesa'} (${x.n})`).join(' · ')
          : conMesa.length ? nombre(conMesa[0].mesaId) : null,
        msg: msg?.texto ?? null,
        msgFecha: msg ? fechaNumerica(msg.fecha, { zona: evento.zonaHoraria }) : null,
      };
    });
  }

  // --- Pintado ---------------------------------------------------------------

  function filas() {
    const visibles = familias.filter((f) => coincide(f, lista.k) && norm(f.nombre).includes(norm(lista.q)));
    if (!visibles.length) {
      return html`<div class="sheet invitados__ninguna">
        <p class="t-body">Ninguna familia coincide${lista.q ? ` con “${lista.q}”` : ' con este filtro'}.</p>
        <button class="btn btn--quiet" type="button" data-ver-todo>Ver toda la lista</button>
      </div>`;
    }
    return html`<div class="sheet invitados__filas">${visibles.map((f) => crudo(guestRow({
      id: f.id, name: f.nombre, passes: f.pasesAsignados, confirmed: f.rsvp.pasesConfirmados,
      status: f.status, table: f.mesa, message: f.msg, selected: escritorio && f.id === abiertaId,
    })))}</div>`;
  }

  function vistaLista() {
    if (!familias.length) {
      return html`<div class="sheet invitados__vacio">
        ${crudo(goldRule({ ornament: true, width: '50%' }))}
        <h2 class="t-h2">Aquí vivirá su lista de invitados</h2>
        <p class="t-body">Agreguen a la primera familia con sus pases. Le preparamos su enlace personal para que se lo manden por WhatsApp.</p>
        <button class="btn btn--full" type="button" data-agregar>Agregar la primera familia</button>
      </div>`;
    }
    const pases = familias.reduce((n, f) => n + f.pasesAsignados, 0);
    return html`<p class="t-body"><strong class="t-strong">${plural(familias.length, 'familia', 'familias')}</strong> · ${pases} pases</p>
      <div class="field">
        <label class="sr-only" for="buscar-familia">Buscar familia</label>
        <input class="field__control" id="buscar-familia" type="search" placeholder="Buscar por familia o nombre" value="${lista.q}" autocomplete="off">
      </div>
      ${crudo(chips(FILTROS, lista.k, 'Filtrar por respuesta'))}
      <button class="btn btn--full" type="button" data-agregar>Agregar familia</button>
      <div data-filas>${crudo(filas())}</div>`;
  }

  function ficha(f) {
    const enlace = enlaceFamilia(evento.slug, f.codigo);
    const dato = (valor, etiqueta) => crudo(html`<div class="ficha__dato">
      <span class="t-body">${etiqueta}</span>
      <span class="ficha__valor${typeof valor === 'number' ? ' ficha__valor--numero' : ''}">${valor}</span>
    </div>`);
    return html`<div class="ficha">
      <div class="sheet ficha__datos">
        <div class="ficha__titulo">
          <h2 class="t-h1">${f.nombre}</h2>
          <span class="t-meta">${[f.grupo, f.telefono ? `WhatsApp ${f.telefono}` : 'Sin WhatsApp registrado'].filter(Boolean).join(' · ')}</span>
        </div>
        ${crudo(statusTag(f.status))}
        <div class="ficha__lista">
          ${dato(f.pasesAsignados, 'Pases asignados')}${dato(f.rsvp.pasesConfirmados, 'Confirmados')}${dato(f.mesa ?? 'Sin mesa', 'Mesa')}
        </div>
      </div>
      ${f.msg ? crudo(paperNote({ name: 'Su mensaje', date: f.msgFecha, msg: f.msg })) : ''}
      <div class="sheet ficha__enlace">
        <div class="label">Su enlace personal</div>
        <p class="t-body t-strong ficha__url">${enlace}</p>
        <p class="t-meta">Con este enlace solo esta familia ve sus ${plural(f.pasesAsignados, 'pase', 'pases')} y puede confirmar.</p>
        <a class="btn btn--full" href="${enlaceWhatsApp(mensajeInvitacion(evento, f, enlace), f.telefono)}" target="_blank" rel="noopener" data-compartir>Compartir por WhatsApp</a>
        <div class="ficha__par">
          <button class="btn btn--secondary" type="button" data-copiar>Copiar enlace</button>
          <button class="btn btn--secondary" type="button" data-qr>Ver QR</button>
        </div>
      </div>
      <div class="ficha__acciones">
        <button class="btn btn--secondary btn--full" type="button" data-editar>Editar datos</button>
        <button class="btn btn--quiet btn--quitar" type="button" data-quitar>Quitar de la lista</button>
      </div>
    </div>`;
  }

  function pintar() {
    const abierta = familias.find((f) => f.id === abiertaId);
    if (escritorio) {
      const lado = abierta
        ? ficha(abierta)
        : familias.length ? html`<div class="sheet t-body">Elijan una familia para ver su ficha.</div>` : '';
      contenedor.innerHTML = html`<div class="invitados invitados--escritorio">
        <div class="invitados__lista">${crudo(vistaLista())}</div>
        <div class="invitados__lado">${crudo(lado)}</div>
      </div>`;
    } else if (abierta) {
      contenedor.innerHTML = html`<div class="invitados">
        <button class="btn btn--quiet btn--flush invitados__volver" type="button" data-volver>Volver a la lista</button>
        ${crudo(ficha(abierta))}
      </div>`;
    } else {
      contenedor.innerHTML = html`<div class="invitados">${crudo(vistaLista())}</div>`;
    }
  }

  const pintarFilas = () => { contenedor.querySelector('[data-filas]').innerHTML = filas(); };

  // Celular: la ficha va en el hash para que el botón Atrás regrese a la lista.
  function abrir(id) {
    if (escritorio) {
      abiertaId = id;
      pintar();
    } else {
      ir(id ? `invitados?familia=${id}` : 'invitados');
    }
  }

  // --- Acciones ----------------------------------------------------------------

  async function recargar(id = abiertaId) {
    await cargar();
    abiertaId = familias.some((f) => f.id === id) ? id : null;
    pintar();
  }

  function abrirFormulario(fam) {
    const cuerpo = document.createElement('form');
    cuerpo.className = 'familia-form';
    cuerpo.noValidate = true;
    const opcion = (valor, texto, actual) => crudo(html`<option value="${valor}"${crudo(valor === actual ? ' selected' : '')}>${texto}</option>`);
    const pases = String(fam?.pasesAsignados ?? 2);
    const grupo = fam?.grupo || GRUPOS[0];
    cuerpo.innerHTML = html`
      <div class="field">
        <label class="field__label" for="ff-nombre">Cómo aparecerá en la invitación</label>
        <input class="field__control" id="ff-nombre" name="nombre" placeholder="Familia Martínez" value="${fam?.nombre ?? ''}" autocomplete="off">
        <span class="field__hint field__hint--error" data-error="nombre" hidden></span>
      </div>
      <div class="familia-form__par">
        <div class="field">
          <label class="field__label" for="ff-pases">Pases</label>
          <select class="field__control" id="ff-pases" name="pases">${['1', '2', '3', '4', '5', '6', '7', '8'].map((n) => opcion(n, n, pases))}</select>
        </div>
        <div class="field">
          <label class="field__label" for="ff-mesa">Mesa</label>
          <select class="field__control" id="ff-mesa" name="mesa">${[
            ...(fam?.mesaId === DIVIDIDA ? [opcion(DIVIDIDA, 'Dividida (sin cambios)', DIVIDIDA)] : []),
            opcion('', 'Sin mesa', fam?.mesaId ?? ''), ...mesas.map((m) => opcion(m.id, m.nombre, fam?.mesaId))]}</select>
        </div>
      </div>
      <span class="field__hint field__hint--error" data-error="mesa" hidden></span>
      <div class="field">
        <label class="field__label" for="ff-tel">WhatsApp</label>
        <input class="field__control" id="ff-tel" name="telefono" type="tel" inputmode="tel" placeholder="899 123 4567" value="${fam?.telefono ?? ''}" autocomplete="off">
        <span class="field__hint" data-error="telefono" data-ayuda="Para mandarles su enlace personal.">Para mandarles su enlace personal.</span>
      </div>
      <div class="field">
        <label class="field__label" for="ff-grupo">Grupo</label>
        <select class="field__control" id="ff-grupo" name="grupo">${GRUPOS.map((g) => opcion(g, g, grupo))}</select>
      </div>
      <button class="btn btn--full btn--lg" type="submit">${fam ? 'Guardar cambios' : 'Agregar a la lista'}</button>`;

    const hoja = abrirBottomSheet({ titulo: fam ? 'Editar datos' : 'Agregar familia', contenido: cuerpo });

    const marcar = (campo, texto) => {
      const aviso = cuerpo.querySelector(`[data-error="${campo}"]`);
      cuerpo.elements[campo].setAttribute('aria-invalid', String(Boolean(texto)));
      if (campo === 'telefono') {
        aviso.textContent = texto || aviso.dataset.ayuda;
        aviso.classList.toggle('field__hint--error', Boolean(texto));
      } else {
        aviso.textContent = texto ?? '';
        aviso.hidden = !texto;
      }
    };
    cuerpo.elements.nombre.addEventListener('input', () => marcar('nombre', null));
    cuerpo.elements.telefono.addEventListener('input', () => marcar('telefono', null));
    cuerpo.elements.mesa.addEventListener('change', () => marcar('mesa', null));

    cuerpo.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(cuerpo));
      const digitos = v.telefono.replace(/\D/g, '');
      let error = false;
      if (!v.nombre.trim()) {
        marcar('nombre', 'Escriban cómo aparecerá en la invitación, por ejemplo “Familia Martínez”.');
        error = true;
      }
      if (digitos && digitos.length !== 10) {
        marcar('telefono', 'Escriban los 10 números del celular, sin el 52.');
        error = true;
      }
      if (error) return;

      const datos = { nombre: v.nombre, pasesAsignados: Number(v.pases), telefono: v.telefono.trim(), grupo: v.grupo };
      const f = fam ? await data.actualizarFamilia(fam.id, datos) : await data.crearFamilia(evento.id, datos);
      const mesaId = v.mesa || null;
      let sinLugar = null;
      // "Dividida (sin cambios)" deja a cada persona en su mesa; para moverlas
      // una por una está la hoja de cada mesa.
      if (mesaId !== DIVIDIDA && (mesaId || fam?.mesaId)) {
        try {
          await data.asignarMesa(f.id, mesaId);
        } catch (err) {
          if (err.codigo !== 'mesa_llena') throw err;
          sinLugar = err.message;
        }
      }
      if (sinLugar && fam) {
        // Los demás datos ya se guardaron; solo falta elegir otra mesa.
        marcar('mesa', `${sinLugar} Elijan otra o déjenla sin mesa.`);
        return;
      }
      hoja.cerrar();
      toast(sinLugar
        ? `Agregamos a ${f.nombre}, pero quedó sin mesa. ${sinLugar}`
        : fam ? 'Guardamos los cambios.' : 'Listo. Ya pueden mandarles su invitación.');
      if (escritorio || fam) await recargar(f.id);
      else abrir(f.id);
    });
  }

  function abrirQR(f) {
    const enlace = enlaceFamilia(evento.slug, f.codigo);
    const cuerpo = document.createElement('div');
    cuerpo.className = 'qr';
    // PENDIENTE: generar el QR real (necesita una librería; preguntar antes de agregarla).
    cuerpo.innerHTML = html`
      <div class="qr__marco t-meta">Aquí va el código QR de su enlace</div>
      <p class="t-body">Sirve para un pase impreso o para mostrarlo en la entrada. Lleva a <span class="ficha__url">${enlace}</span>.</p>
      <button class="btn btn--full" type="button" data-descargar>Descargar QR</button>
      <a class="btn btn--secondary btn--full" href="${enlaceWhatsApp(mensajeInvitacion(evento, f, enlace), f.telefono)}" target="_blank" rel="noopener">Mandar el enlace por WhatsApp</a>`;
    cuerpo.querySelector('[data-descargar]').addEventListener('click', () => toast('En esta demo el QR todavía no se descarga.'));
    abrirBottomSheet({ titulo: 'Su código QR', contenido: cuerpo });
  }

  function quitar(f) {
    abrirConfirmacion({
      titulo: `¿Quitar a ${f.nombre}?`,
      texto: `Su enlace personal dejará de funcionar y se liberan sus ${plural(f.pasesAsignados, 'pase', 'pases')}. No se puede deshacer.`,
      confirmar: 'Sí, quitar de la lista',
      alConfirmar: async () => {
        await data.eliminarFamilia(f.id);
        toast(`Quitamos a ${f.nombre} de su lista.`);
        if (escritorio) await recargar(null);
        else abrir(null);
      },
    });
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      toast('Enlace copiado.');
    } catch {
      toast('No pudimos copiarlo. Mantengan presionado el enlace para copiarlo.');
    }
  }

  // --- Eventos (delegados: el contenido se vuelve a pintar) ---------------------

  contenedor.addEventListener('input', (e) => {
    if (e.target.id !== 'buscar-familia') return;
    lista.q = e.target.value;
    pintarFilas();
  });

  contenedor.addEventListener('click', (e) => {
    const b = e.target.closest('button, a');
    if (!b) return;
    const abierta = familias.find((f) => f.id === abiertaId);
    if (b.dataset.familia) abrir(b.dataset.familia);
    else if (b.dataset.chip) {
      lista.k = b.dataset.chip;
      for (const c of contenedor.querySelectorAll('[data-chip]')) c.setAttribute('aria-pressed', String(c === b));
      pintarFilas();
    } else if (b.hasAttribute('data-ver-todo')) {
      lista.q = '';
      lista.k = 'todos';
      pintar();
    } else if (b.hasAttribute('data-agregar')) abrirFormulario(null);
    else if (b.hasAttribute('data-volver')) abrir(null);
    else if (b.hasAttribute('data-editar')) abrirFormulario(abierta);
    else if (b.hasAttribute('data-qr')) abrirQR(abierta);
    else if (b.hasAttribute('data-quitar')) quitar(abierta);
    else if (b.hasAttribute('data-copiar')) copiar(enlaceFamilia(evento.slug, abierta.codigo));
    else if (b.hasAttribute('data-compartir')) toast('Abrimos su WhatsApp con la invitación lista para enviar.');
  });

  await cargar();
  if (!familias.some((f) => f.id === abiertaId)) abiertaId = escritorio ? familias[0]?.id ?? null : null;
  pintar();
}

function mensajeInvitacion(evento, familia, enlace) {
  return `Hola, ${familia.nombre}. Somos ${evento.anfitriones.join(' y ')} y nos encantaría que nos acompañen `
    + `en nuestra boda el ${fechaNumerica(evento.fecha, { zona: evento.zonaHoraria })}. `
    + `Esta es su invitación personal; ahí mismo pueden confirmar: ${enlace}`;
}
