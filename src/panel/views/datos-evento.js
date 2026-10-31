// Subvista "Datos del evento" (Más): nombres, fecha, ceremonia, recepción y
// fecha límite para confirmar. Las fechas se escriben como dd/mm/aaaa.
import { fechaNumerica, leerFechaNumerica, formatearMientrasEscribe } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';
import { toast } from '../../lib/ui.js';
import { esLinkGoogleMaps, leerCoordenadas, mapaAlTocar, activarMapas } from '../../lib/mapas.js';
import { subvista } from '../componentes.js';

const DIA = 24 * 60 * 60 * 1000;
const ERROR_FECHA = 'Escríbanla como día/mes/año, por ejemplo 07/11/2026.';
const AYUDA_MAPA = 'En Google Maps busquen el lugar, toquen «Compartir» y peguen aquí el link.';
const medianoche = ({ dia, mes, anio }) => new Date(anio, mes - 1, dia).getTime();
const AYUDA_FRASE = 'Con sus palabras. Aparece tal cual en su invitación.';
const AYUDA_CANCION = 'Busquen el video oficial en YouTube, toquen «Compartir» y peguen aquí el link. Suena cuando sus invitados abren el sobre.';

// Id del video de YouTube desde cualquier link (youtu.be, watch?v=, shorts, embed) o el id solo.
function idYouTube(texto) {
  const t = String(texto ?? '').trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  return t.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/)?.[1] ?? null;
}

export async function montar(destino, ctx) {
  const { data } = ctx;
  const el = subvista(destino, ctx);
  const evento = await data.getEventoPorId(ctx.evento.id);
  const sede = (id) => evento.sedes?.find((s) => s.id === id) ?? {};
  // Solo se ajusta lo que su invitación muestra (evento.secciones).
  const tiene = (s) => !evento.secciones || evento.secciones.includes(s);
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
  // "Ubicación en mapa": link de Google Maps y su vista previa (se carga al tocarla).
  const mapa = (clave, s) => crudo(html`<div class="field">
    <label class="field__label" for="ev-${clave}-mapa">Ubicación en mapa</label>
    <input class="field__control" id="ev-${clave}-mapa" name="${clave}Mapa" type="url" inputmode="url" value="${s.mapaUrl ?? ''}"
      placeholder="Peguen aquí el link de Google Maps" autocomplete="off">
    <span class="field__hint" data-ayuda="${AYUDA_MAPA}">${AYUDA_MAPA}</span>
    <div class="datos-evento__mapa" data-vista-mapa="${clave}"></div>
  </div>`);

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
    ${mapa('cer', cer)}
    <h3 class="t-h2">Recepción</h3>
    ${campo('ev-rh', 'recHora', 'Hora', rec.hora, { tipo: 'time' })}
    ${campo('ev-rl', 'recLugar', 'Lugar', rec.nombre)}
    ${campo('ev-rd', 'recDir', 'Dirección', rec.direccion)}
    ${mapa('rec', rec)}
    <h3 class="t-h2">Confirmaciones</h3>
    ${campo('ev-rsvp', 'fechaLimite', 'Fecha límite para confirmar', limiteInicial, { ayuda: 'Después de esta fecha, la invitación ya no deja confirmar.', extra: fecha })}
    ${tiene('frase') ? crudo(html`<h3 class="t-h2">Su frase</h3>
    <div class="field">
      <label class="field__label" for="ev-frase">Texto que va bajo la portada</label>
      <textarea class="field__control" id="ev-frase" name="frase" maxlength="600">${evento.frase ?? ''}</textarea>
      <span class="field__hint" data-ayuda="${AYUDA_FRASE}">${AYUDA_FRASE}</span>
    </div>`) : ''}
    ${tiene('vestimenta') ? crudo(html`<h3 class="t-h2">Código de vestimenta</h3>
    ${campo('ev-vc', 'vestCodigo', 'Código', evento.vestimenta?.codigo, { ayuda: 'Por ejemplo: Formal, Etiqueta, Casual elegante.' })}
    ${campo('ev-vd', 'vestDetalle', 'Detalle (opcional)', evento.vestimenta?.detalle, { ayuda: 'Por ejemplo: De negro, o Evitar el color blanco.' })}`) : ''}
    ${tiene('cancion') ? crudo(html`<h3 class="t-h2">Su canción</h3>
    ${campo('ev-mu', 'musicaLink', 'Link del video oficial en YouTube', evento.musica?.youtube ? `https://youtu.be/${evento.musica.youtube}` : '', { tipo: 'url', ayuda: AYUDA_CANCION })}
    ${campo('ev-mt', 'musicaTitulo', 'Nombre de la canción', evento.musica?.titulo)}
    ${campo('ev-ma', 'musicaArtista', 'Artista', evento.musica?.artista)}`) : ''}
    <button class="btn btn--full btn--lg" type="submit">Guardar cambios</button>`;
  el.append(form);
  activarMapas(form);

  // Vista previa del lugar con lo que llevan escrito (nombre, dirección y link).
  const pintarMapa = (clave, original) => {
    const v = (n) => form.elements[`${clave}${n}`].value.trim();
    const url = v('Mapa');
    const caja = form.querySelector(`[data-vista-mapa="${clave}"]`);
    if (url && !esLinkGoogleMaps(url)) { caja.innerHTML = ''; return; }
    const coordenadas = url ? leerCoordenadas(url) ?? (url === original.mapaUrl ? original.coordenadas : null) : null;
    const nota = !url ? '' : coordenadas
      ? 'El link trae las coordenadas del lugar.'
      : 'Este link no trae coordenadas; el mapa buscará el lugar por su nombre y dirección.';
    caja.innerHTML = html`${crudo(mapaAlTocar({ nombre: v('Lugar'), direccion: v('Dir'), coordenadas }))}
      ${nota ? crudo(html`<span class="field__hint">${nota}</span>`) : ''}`;
  };
  pintarMapa('cer', cer);
  pintarMapa('rec', rec);
  for (const [clave, original] of [['cer', cer], ['rec', rec]]) {
    form.elements[`${clave}Mapa`].addEventListener('change', () => pintarMapa(clave, original));
    form.elements[`${clave}Mapa`].addEventListener('input', () => marcar(`${clave}Mapa`, null));
  }

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
    for (const clave of ['cer', 'rec']) {
      const url = v[`${clave}Mapa`].trim();
      marcar(`${clave}Mapa`, url && !esLinkGoogleMaps(url) ? 'Este link no es de Google Maps. Cópienlo desde «Compartir» en Google Maps.' : null);
    }
    const video = tiene('cancion') && v.musicaLink.trim() ? idYouTube(v.musicaLink) : null;
    if (tiene('cancion')) marcar('musicaLink', v.musicaLink.trim() && !video ? 'Este link no es de un video de YouTube. Cópienlo desde «Compartir».' : null);
    if (form.querySelector('[aria-invalid="true"]')) return;

    // Si el link trae coordenadas se guardan; si es el mismo link de antes, se conservan.
    const ubicacion = (s, url) => ({
      mapaUrl: url || null,
      coordenadas: url ? leerCoordenadas(url) ?? (url === s.mapaUrl ? s.coordenadas ?? null : null) : null,
    });
    const sedes = (evento.sedes ?? []).map((s) => {
      if (s.id === 'ceremonia') return { ...s, hora: v.cerHora || s.hora, nombre: v.cerLugar.trim(), direccion: v.cerDir.trim(), ...ubicacion(s, v.cerMapa.trim()) };
      if (s.id === 'recepcion') return { ...s, hora: v.recHora || s.hora, nombre: v.recLugar.trim(), direccion: v.recDir.trim(), ...ubicacion(s, v.recMapa.trim()) };
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
    if (tiene('frase')) cambios.frase = v.frase.trim() || evento.frase;
    if (tiene('vestimenta')) {
      cambios.vestimenta = { ...evento.vestimenta, codigo: v.vestCodigo.trim() || evento.vestimenta?.codigo, detalle: v.vestDetalle.trim() };
    }
    if (tiene('cancion')) {
      const { _nota, ...musica } = evento.musica ?? {};
      cambios.musica = { ...musica, youtube: video ?? musica.youtube, titulo: v.musicaTitulo.trim(), artista: v.musicaArtista.trim() };
    }
    await data.actualizarEvento(evento.id, cambios);
    evento.sedes = sedes;
    toast('Guardamos los cambios. Su invitación ya se actualizó.');
  });
}
