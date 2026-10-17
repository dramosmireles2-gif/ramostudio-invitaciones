// Subvista "Datos del evento" (Más): nombres, fecha, ceremonia, recepción y
// fecha límite para confirmar. Las fechas se escriben como dd/mm/aaaa.
import { fechaNumerica, leerFechaNumerica, formatearMientrasEscribe } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';
import { toast } from '../../lib/ui.js';
import { subvista } from '../componentes.js';

const DIA = 24 * 60 * 60 * 1000;
const ERROR_FECHA = 'Escríbanla como día/mes/año, por ejemplo 07/11/2026.';
const medianoche = ({ dia, mes, anio }) => new Date(anio, mes - 1, dia).getTime();

export async function montar(destino, ctx) {
  const { data } = ctx;
  const el = subvista(destino, ctx);
  const evento = await data.getEventoPorId(ctx.evento.id);
  const sede = (id) => evento.sedes?.find((s) => s.id === id) ?? {};
  const cer = sede('ceremonia');
  const rec = sede('recepcion');
  const zona = { zona: evento.zonaHoraria };
  const fechaInicial = fechaNumerica(evento.fecha, zona);
  const limiteInicial = evento.fechaLimiteRsvp ? fechaNumerica(evento.fechaLimiteRsvp, zona) : '';

  const campo = (id, nombre, etiqueta, valor, { tipo = 'text', ayuda = '', extra = '' } = {}) => crudo(html`<div class="field">
    <label class="field__label" for="${id}">${etiqueta}</label>
    <input class="field__control" id="${id}" name="${nombre}" type="${tipo}" value="${valor ?? ''}" autocomplete="off"${crudo(extra)}>
    ${ayuda || nombre.startsWith('fecha') ? crudo(html`<span class="field__hint" data-ayuda="${ayuda}">${ayuda}</span>`) : ''}
  </div>`);
  const fecha = ' inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10"';

  const form = document.createElement('form');
  form.className = 'sheet datos-evento';
  form.noValidate = true;
  form.innerHTML = html`
    <h3 class="t-h2">La boda</h3>
    ${campo('ev-nombres', 'titulo', 'Nombres en la invitación', evento.titulo)}
    ${campo('ev-fecha', 'fecha', 'Fecha de la boda', fechaInicial, { ayuda: 'Día/mes/año', extra: fecha })}
    <h3 class="t-h2">Ceremonia</h3>
    ${campo('ev-ch', 'cerHora', 'Hora', cer.hora, { tipo: 'time' })}
    ${campo('ev-cl', 'cerLugar', 'Lugar', cer.nombre)}
    ${campo('ev-cd', 'cerDir', 'Dirección', cer.direccion)}
    <h3 class="t-h2">Recepción</h3>
    ${campo('ev-rh', 'recHora', 'Hora', rec.hora, { tipo: 'time' })}
    ${campo('ev-rl', 'recLugar', 'Lugar', rec.nombre)}
    ${campo('ev-rd', 'recDir', 'Dirección', rec.direccion)}
    <h3 class="t-h2">Confirmaciones</h3>
    ${campo('ev-rsvp', 'fechaLimite', 'Fecha límite para confirmar', limiteInicial, { ayuda: 'Después de esta fecha, la invitación ya no deja confirmar.', extra: fecha })}
    <button class="btn btn--full btn--lg" type="submit">Guardar cambios</button>`;
  el.append(form);

  const marcar = (nombre, texto) => {
    const control = form.elements[nombre];
    const aviso = control.parentElement.querySelector('.field__hint');
    control.setAttribute('aria-invalid', String(Boolean(texto)));
    aviso.textContent = texto || aviso.dataset.ayuda;
    aviso.classList.toggle('field__hint--error', Boolean(texto));
  };

  for (const nombre of ['fecha', 'fechaLimite']) {
    form.elements[nombre].addEventListener('input', (e) => {
      // El teclado numérico del celular no tiene "/": la ponemos nosotros.
      const borrando = e.inputType?.startsWith('delete');
      if (!borrando) e.target.value = formatearMientrasEscribe(e.target.value);
      marcar(nombre, null);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(form));
    const boda = leerFechaNumerica(v.fecha);
    const limite = v.fechaLimite.trim() ? leerFechaNumerica(v.fechaLimite) : null;
    marcar('fecha', boda ? null : ERROR_FECHA);
    if (v.fechaLimite.trim() && !limite) marcar('fechaLimite', ERROR_FECHA);
    else if (boda && limite && medianoche(limite) > medianoche(boda)) marcar('fechaLimite', 'La fecha límite tiene que ser antes de la boda.');
    else marcar('fechaLimite', null);
    if (form.querySelector('[aria-invalid="true"]')) return;

    const sedes = (evento.sedes ?? []).map((s) => {
      if (s.id === 'ceremonia') return { ...s, hora: v.cerHora || s.hora, nombre: v.cerLugar.trim(), direccion: v.cerDir.trim() };
      if (s.id === 'recepcion') return { ...s, hora: v.recHora || s.hora, nombre: v.recLugar.trim(), direccion: v.recDir.trim() };
      return s;
    });
    const hora = v.cerHora || evento.hora;
    const cambios = { titulo: v.titulo.trim() || evento.titulo, sedes, hora };
    // Si no cambian la fecha, la demo sigue calculándola como "hoy + 58 días".
    if (v.fecha !== fechaInicial) {
      const [h, m] = hora.split(':').map(Number);
      cambios.fecha = new Date(boda.anio, boda.mes - 1, boda.dia, h, m).toISOString();
    }
    cambios.fechaLimiteRsvpDiasAntes = limite ? Math.round((medianoche(boda) - medianoche(limite)) / DIA) : null;
    await data.actualizarEvento(evento.id, cambios);
    toast('Guardamos los cambios. Su invitación ya se actualizó.');
  });
}
