// Subvista "Mesa de regalos" (Más): las opciones que verán sus invitados, la
// lluvia de sobres y una vista previa con el tema del evento.
// Celular: la vista previa va abajo y cada opción se edita en una hoja.
// Escritorio: la vista previa va a la derecha y la opción se edita en la
// columna izquierda, así la vista previa cambia mientras escriben.
// Los números de la demo son de ejemplo (00000000); la etiqueta "Demo" del
// encabezado lo avisa una sola vez.
import { aplicarTema } from '../../lib/theme.js';
import { html, crudo } from '../../lib/dom.js';
import { goldRule, segmented, abrirBottomSheet, abrirConfirmacion, toast } from '../../lib/ui.js';
import { subvista } from '../componentes.js';

const TIPOS = [['mesa', 'Mesa de regalos'], ['lista', 'Lista en línea'], ['transferencia', 'Transferencia']];
const ACCION = { mesa: 'Ver mesa', lista: 'Ver lista', transferencia: 'Copiar datos' };
const nombreTipo = (t) => TIPOS.find(([k]) => k === t)?.[1] ?? 'Mesa de regalos';

export async function montar(destino, ctx) {
  const { evento, data, escritorio } = ctx;
  const el = subvista(destino, ctx);
  el.classList.add('mas--ancha');
  const contenido = document.createElement('div');
  contenido.className = `regalos${escritorio ? ' regalos--escritorio' : ''}`;
  el.append(contenido);

  let regalos = [];
  let sobres = true;
  // Escritorio: la opción que se está editando en línea ({ id: null } si es nueva).
  let borrador = null;

  async function cargar() {
    const [rs, ev] = await Promise.all([data.getRegalos(evento.id), data.getEventoPorId(evento.id)]);
    regalos = rs;
    sobres = ev.lluviaDeSobres !== false;
  }

  // Con borrador, la vista previa muestra lo que llevan escrito.
  function opcionesVisibles() {
    if (!borrador) return regalos;
    const b = { ...borrador, titulo: borrador.titulo || 'Nombre de la tienda' };
    return borrador.id ? regalos.map((r) => (r.id === borrador.id ? b : r)) : [...regalos, b];
  }

  function vistaPrevia() {
    return html`<div class="regalo-preview">
      <div class="regalo-preview__label">Mesa de regalos</div>
      <h3 class="regalo-preview__titulo">Su compañía es nuestro mejor regalo</h3>
      <p class="regalo-preview__texto">Si desean tener un detalle con nosotros, aquí les dejamos algunas opciones.</p>
      ${opcionesVisibles().map((r) => crudo(html`<div class="regalo-preview__opcion">
        <div class="regalo-preview__nombre">${r.titulo}</div>
        ${r.detalle ? crudo(html`<div class="regalo-preview__detalle">${r.detalle}</div>`) : ''}
        <span class="btn btn--secondary" aria-hidden="true">${ACCION[r.tipo] ?? 'Ver mesa'}</span>
      </div>`))}
      ${sobres ? crudo(html`<p class="regalo-preview__texto">También habrá lluvia de sobres en la recepción.</p>`) : ''}
    </div>`;
  }

  function pintarVistaPrevia() {
    const lugar = contenido.querySelector('[data-vista-previa]');
    lugar.innerHTML = vistaPrevia();
    aplicarTema(evento.tema, lugar.firstElementChild);
  }

  function lista() {
    return html`${regalos.map((r) => crudo(html`<div class="sheet regalos__opcion">
        <div class="label">${nombreTipo(r.tipo)}</div>
        <h3 class="t-h3">${r.titulo}</h3>
        <p class="t-meta regalos__detalle">${[r.detalle, r.url].filter(Boolean).join(' · ')}</p>
        <div class="regalos__acciones">
          <button class="btn btn--secondary" type="button" data-editar="${r.id}">Editar</button>
          <button class="btn btn--quiet btn--quitar" type="button" data-quitar="${r.id}">Quitar</button>
        </div>
      </div>`))}
      <button class="btn btn--secondary btn--full" type="button" data-agregar>Agregar otra opción</button>
      <div class="regalos__sobres"><span class="label">Lluvia de sobres en la recepción</span>
        ${crudo(segmented('sobres', [['si', 'Mostrar'], ['no', 'No mostrar']], sobres ? 'si' : 'no', 'Lluvia de sobres'))}</div>`;
  }

  function pintar() {
    const intro = html`<p class="t-body">Esto es lo que sus invitados verán en la sección “Mesa de regalos” de su invitación.</p>`;
    const previa = html`<h2 class="t-h2">Así se ve en su invitación</h2><div data-vista-previa></div>`;
    if (escritorio) {
      contenido.innerHTML = html`<div class="regalos__editor">${crudo(intro)}<div data-editor></div></div>
        <div class="regalos__vista">${crudo(previa)}</div>`;
      const editor = contenido.querySelector('[data-editor]');
      if (borrador) {
        editor.className = 'sheet regalos__en-linea';
        editor.innerHTML = html`<h3 class="t-h2">${borrador.id ? 'Editar opción' : 'Nueva opción'}</h3>`;
        editor.append(formulario(borrador, { alCancelar: () => { borrador = null; pintar(); } }));
      } else {
        editor.className = 'regalos__lista';
        editor.innerHTML = lista();
      }
    } else {
      contenido.innerHTML = html`${crudo(intro)}${crudo(lista())}
        ${crudo(goldRule({ ornament: true, width: '50%' }))}${crudo(previa)}`;
    }
    pintarVistaPrevia();
  }

  // Formulario de una opción. Al guardar cierra la hoja (celular) o vuelve a la
  // lista (escritorio).
  function formulario(r, { alGuardar, alCancelar } = {}) {
    const form = document.createElement('form');
    form.className = 'familia-form';
    form.noValidate = true;
    const tipo = r?.tipo ?? 'mesa';
    form.innerHTML = html`
      <div class="field">
        <label class="field__label" for="rg-tipo">Tipo</label>
        <select class="field__control" id="rg-tipo" name="tipo">${TIPOS.map(([k, t]) =>
          crudo(html`<option value="${k}"${crudo(k === tipo ? ' selected' : '')}>${t}</option>`))}</select>
      </div>
      <div class="field">
        <label class="field__label" for="rg-nombre">Nombre</label>
        <input class="field__control" id="rg-nombre" name="titulo" placeholder="Liverpool" value="${r?.titulo ?? ''}" autocomplete="off">
        <span class="field__hint field__hint--error" data-error hidden></span>
      </div>
      <div class="field">
        <label class="field__label" for="rg-detalle" data-etiqueta-detalle></label>
        <input class="field__control" id="rg-detalle" name="detalle" value="${r?.detalle ?? ''}" autocomplete="off">
      </div>
      <div class="field" data-enlace>
        <label class="field__label" for="rg-enlace">Enlace</label>
        <input class="field__control" id="rg-enlace" name="url" type="url" placeholder="Enlace de su mesa o lista" value="${r?.url ?? ''}" autocomplete="off">
      </div>
      <button class="btn btn--full btn--lg" type="submit">Guardar</button>
      ${alCancelar ? crudo(html`<button class="btn btn--quiet regalos__cancelar" type="button" data-cancelar>Cancelar</button>`) : ''}`;

    const ajustar = () => {
      const t = form.elements.tipo.value;
      form.querySelector('[data-etiqueta-detalle]').textContent = t === 'transferencia' ? 'Banco, titular y CLABE' : 'Número de evento o nombre de la lista';
      form.querySelector('[data-enlace]').hidden = t === 'transferencia';
    };
    ajustar();
    form.querySelector('[data-cancelar]')?.addEventListener('click', alCancelar);
    form.addEventListener('input', () => {
      ajustar();
      if (!borrador) return;
      Object.assign(borrador, Object.fromEntries(new FormData(form)));
      pintarVistaPrevia();
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(form));
      if (!v.titulo.trim()) {
        const aviso = form.querySelector('[data-error]');
        aviso.textContent = 'Escriban el nombre de la tienda o del banco.';
        aviso.hidden = false;
        form.elements.titulo.setAttribute('aria-invalid', 'true');
        form.elements.titulo.focus();
        return;
      }
      await data.guardarRegalo(evento.id, { id: r?.id, ...v });
      alGuardar?.();
      borrador = null;
      toast('Guardamos su mesa de regalos.');
      await recargar();
    });
    return form;
  }

  function editar(r) {
    if (escritorio) {
      borrador = r ? { ...r } : { id: null, tipo: 'mesa', titulo: '', detalle: '', url: '' };
      pintar();
      contenido.querySelector('#rg-nombre').focus();
      return;
    }
    const hoja = abrirBottomSheet({
      titulo: r ? 'Editar opción' : 'Nueva opción',
      contenido: formulario(r, { alGuardar: () => hoja.cerrar() }),
    });
  }

  async function recargar() {
    await cargar();
    pintar();
  }

  contenido.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const r = regalos.find((x) => x.id === (b.dataset.editar ?? b.dataset.quitar));
    if (b.dataset.editar) editar(r);
    else if (b.dataset.quitar) {
      abrirConfirmacion({
        titulo: `¿Quitar ${r.titulo}?`,
        texto: 'Dejará de aparecer en su invitación.',
        confirmar: 'Sí, quitar',
        alConfirmar: async () => {
          await data.eliminarRegalo(r.id);
          toast(`Quitamos ${r.titulo}.`);
          await recargar();
        },
      });
    } else if (b.hasAttribute('data-agregar')) editar(null);
    else if (b.dataset.valor) {
      await data.actualizarEvento(evento.id, { lluviaDeSobres: b.dataset.valor === 'si' });
      toast(b.dataset.valor === 'si' ? 'Mostraremos la lluvia de sobres.' : 'Ya no mostraremos la lluvia de sobres.');
      await recargar();
    }
  });

  await recargar();
}
