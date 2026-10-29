// Cuenta regresiva: días, horas y minutos (sin segundos, para que nada
// parpadee). Se actualiza cada 30 s.
import { cuentaRegresiva } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';

const UNIDADES = [['dias', 'día', 'días'], ['horas', 'hora', 'horas'], ['minutos', 'minuto', 'minutos']];

export function montar(contenedor, { evento }) {
  contenedor.className = 'cuenta';
  const pintar = () => {
    const c = cuentaRegresiva(evento.fecha);
    if (!c.dias && !c.horas && !c.minutos) {
      contenedor.innerHTML = html`<p class="cuenta__hoy">Hoy es el día</p>`;
      return false;
    }
    contenedor.innerHTML = html`
      <p class="ev-etiqueta">Faltan</p>
      <div class="cuenta__numeros" role="timer" aria-live="off">
        ${UNIDADES.map(([k, uno, varios]) => crudo(html`<div class="cuenta__unidad">
          <span class="cuenta__numero">${c[k]}</span>
          <span class="cuenta__texto">${c[k] === 1 ? uno : varios}</span>
        </div>`))}
      </div>`;
    return true;
  };
  if (pintar()) {
    const t = setInterval(() => { if (!pintar()) clearInterval(t); }, 30000);
  }
}
