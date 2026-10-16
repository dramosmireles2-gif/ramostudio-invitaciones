// Piezas del panel que comparten varias vistas.
import { enlaceFamilia, enlaceWhatsApp } from '../lib/links.js';
import { diaRelativo, fechaNumerica, hora } from '../lib/fechas.js';
import { html, crudo } from '../lib/dom.js';
import { abrirBottomSheet, statusTag, toast, plural } from '../lib/ui.js';

const ETIQUETA_ACTIVIDAD = {
  apertura: ['vio', 'Abrió'],
  confirmacion: ['confirmado', 'Confirmó'],
  no_asiste: ['no', 'No asistirá'],
};

// Lista de actividad agrupada por día ("Hoy", "Ayer", "14/10/2026").
export function actividadLista(items, zona) {
  let ultimo = null;
  return html`<div class="actividad">${items.map((a) => {
    const dia = diaRelativo(a.fecha, new Date(), zona);
    const cabeza = dia !== ultimo ? crudo(html`<div class="label actividad__dia">${dia}</div>`) : '';
    ultimo = dia;
    const etiqueta = ETIQUETA_ACTIVIDAD[a.tipo];
    return crudo(html`${cabeza}<div class="actividad__fila">
      <span class="t-meta">${hora(a.fecha, zona)}</span>
      <div class="actividad__texto"><p class="t-body t-strong">${a.texto}</p>
        ${etiqueta ? crudo(statusTag(...etiqueta)) : ''}</div>
    </div>`);
  })}</div>`;
}

// Familias para las que ya abrieron WhatsApp en esta visita al panel.
const abiertas = new Set();

function mensajeRecordatorio(evento, familia) {
  const novios = evento.anfitriones.join(' y ');
  const limite = evento.fechaLimiteRsvp
    ? ` ¿Nos confirman antes del ${fechaNumerica(evento.fechaLimiteRsvp, { zona: evento.zonaHoraria })}?`
    : ' ¿Nos confirman?';
  return `Hola, ${familia.nombre}. Somos ${novios}. Nos encantaría saber si nos acompañan el `
    + `${fechaNumerica(evento.fecha, { zona: evento.zonaHoraria })}.${limite} `
    + `Aquí está su invitación: ${enlaceFamilia(evento.slug, familia.codigo)}`;
}

// Hoja "Recordatorios por WhatsApp": una familia a la vez; los novios mandan
// cada mensaje desde su propio WhatsApp. Nada se envía solo.
export async function abrirRecordatorios({ evento, data }) {
  const pendientes = await data.getFamiliasPendientes(evento.id);
  const cuerpo = document.createElement('div');
  cuerpo.className = 'recordar';

  const pintar = () => {
    const primera = pendientes[0];
    const abiertasAqui = pendientes.filter((f) => abiertas.has(f.id)).length;
    cuerpo.innerHTML = html`
      <div class="sheet recordar__como">
        <div class="label">Así funciona</div>
        <p class="t-body">1. Toquen «Abrir WhatsApp» en una familia.</p>
        <p class="t-body">2. Se abre su propio WhatsApp con el mensaje ya escrito para esa familia.</p>
        <p class="t-body">3. Lo revisan y ustedes lo mandan. Regresan aquí para la siguiente.</p>
        <p class="t-meta">RamoStudio no manda mensajes por ustedes ni en automático.</p>
      </div>
      ${primera ? crudo(html`<div class="recordar__ejemplo">
        <div class="label">Mensaje que verán escrito</div>
        <p class="t-body recordar__burbuja">${mensajeRecordatorio(evento, primera)}</p>
        <span class="t-meta">Pueden cambiarlo en WhatsApp antes de mandarlo.</span>
      </div>`) : ''}
      <div class="recordar__cuenta">
        <h3 class="t-h3">${plural(pendientes.length, 'familia pendiente', 'familias pendientes')}</h3>
        <span class="t-meta">${abiertasAqui} de ${pendientes.length} abiertas</span>
      </div>
      ${pendientes.length ? crudo(html`<div class="sheet recordar__lista">${pendientes.map((f) => crudo(html`
        <div class="recordar__familia">
          <div class="recordar__fila"><span class="t-body t-strong">${f.nombre}</span>
            <span class="t-meta">${plural(f.pasesAsignados, 'pase', 'pases')}</span></div>
          ${abiertas.has(f.id)
            ? crudo(html`<span class="t-meta">Ya abrieron su WhatsApp para esta familia.</span>`)
            : crudo(html`<a class="btn btn--secondary btn--full" data-familia="${f.id}" target="_blank" rel="noopener"
                href="${enlaceWhatsApp(mensajeRecordatorio(evento, f), f.telefono)}">Abrir WhatsApp</a>`)}
        </div>`))}</div>`) : ''}`;
  };

  cuerpo.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-familia]');
    if (!boton) return;
    const f = pendientes.find((x) => x.id === boton.dataset.familia);
    abiertas.add(f.id);
    // Se deja seguir el enlace (abre WhatsApp en otra pestaña) y se actualiza la lista.
    setTimeout(pintar);
    toast(`Abrimos su WhatsApp con el mensaje para ${f.nombre}.`);
  });

  pintar();
  return abrirBottomSheet({ titulo: 'Recordatorios por WhatsApp', contenido: cuerpo });
}
