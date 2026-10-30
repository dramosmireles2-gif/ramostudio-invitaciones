// Cuenta regresiva: días, horas, minutos y segundos. Se arma una vez y cada
// segundo solo cambian los números (los lectores de pantalla no la anuncian).
import { cuentaRegresiva } from '../../lib/fechas.js';
import { html, crudo } from '../../lib/dom.js';

const UNIDADES = [['dias', 'día', 'días'], ['horas', 'hora', 'horas'], ['minutos', 'minuto', 'minutos'], ['segundos', 'segundo', 'segundos']];

export function montar(contenedor, { evento }) {
  contenedor.className = 'cuenta';
  contenedor.innerHTML = html`
    <p class="ev-etiqueta">Faltan</p>
    <div class="cuenta__numeros" role="timer" aria-live="off">
      ${UNIDADES.map(([k]) => crudo(html`<div class="cuenta__unidad" data-unidad="${k}">
        <span class="cuenta__numero"></span><span class="cuenta__texto"></span>
      </div>`))}
    </div>`;

  const pintar = () => {
    const c = cuentaRegresiva(evento.fecha);
    if (!c.dias && !c.horas && !c.minutos && !c.segundos) {
      contenedor.innerHTML = html`<p class="cuenta__hoy">Hoy es el día</p>`;
      return false;
    }
    for (const [k, uno, varios] of UNIDADES) {
      const u = contenedor.querySelector(`[data-unidad="${k}"]`);
      u.querySelector('.cuenta__numero').textContent = k === 'dias' ? c[k] : String(c[k]).padStart(2, '0');
      u.querySelector('.cuenta__texto').textContent = c[k] === 1 ? uno : varios;
    }
    return true;
  };
  if (pintar()) {
    const t = setInterval(() => { if (!pintar()) clearInterval(t); }, 1000);
  }
}
