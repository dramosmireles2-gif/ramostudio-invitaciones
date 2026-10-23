// Vista "Más" del panel (diseño de Claude Design, PanelMas.jsx): menú de las
// demás secciones, "Ver mi invitación" y "Cerrar sesión".
import { rutaInvitacion } from '../../lib/links.js';
import { html, crudo } from '../../lib/dom.js';
import { wordmark, plural } from '../../lib/ui.js';
import { salir } from '../auth.js';

export async function montar(destino, { evento, data, demo }) {
  const [familias, mensajes] = await Promise.all([data.getFamilias(evento.id), data.getMensajes(evento.id)]);
  const opciones = [
    ['mensajes', 'Mensajes de sus invitados', mensajes.length ? plural(mensajes.length, 'mensaje', 'mensajes') : 'Aún no hay mensajes'],
    ['actividad', 'Actividad reciente', familias.length ? 'Quién abrió y quién confirmó' : 'Aquí verán quién abre su invitación'],
    ['regalos', 'Mesa de regalos', 'Tiendas y cuentas en su invitación'],
    ['datos-evento', 'Datos del evento', 'Fecha, lugares y fecha límite'],
    ['exportar', 'Exportar lista a Excel', 'Para el salón o su coordinadora'],
  ];
  const el = document.createElement('div');
  el.className = 'mas';
  el.innerHTML = html`
    <nav class="sheet mas__menu" aria-label="Más secciones">${opciones.map(([id, titulo, sub]) => crudo(html`
      <a class="mas__opcion" href="#${id}"><span class="mas__opcion-titulo">${titulo}</span><span class="t-meta">${sub}</span></a>`))}</nav>
    <a class="btn btn--secondary btn--full" href="${rutaInvitacion(evento.slug)}" target="_blank" rel="noopener">Ver mi invitación</a>
    ${demo ? '' : crudo(html`<button class="btn btn--quiet mas__salir" type="button" data-salir>Cerrar sesión</button>`)}
    <div class="mas__marca">${crudo(wordmark({ width: 130, tone: 'pizarra', tagline: false }))}</div>`;
  // En el demo no hay sesión que cerrar: se entra sin login.
  el.querySelector('[data-salir]')?.addEventListener('click', salir);
  destino.append(el);
}
