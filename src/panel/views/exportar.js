// Subvista "Exportar lista a Excel" (Más): toda la lista, solo confirmados o
// por mesa (para el salón y su coordinadora). Descarga un .xlsx real.
import { enlaceFamilia } from '../../lib/links.js';
import { crearXlsx, descargar } from '../../lib/xlsx.js';
import { html, crudo } from '../../lib/dom.js';
import { toast, plural } from '../../lib/ui.js';
import { subvista } from '../componentes.js';

const ESTADO = { confirmado: 'Confirmado', no_asiste: 'No asiste', pendiente: 'Pendiente' };

// Lugares que ocupa: confirmados si ya respondió, pases si sigue pendiente.
const lugares = (f) => (f.rsvp.estado === 'confirmado' ? f.rsvp.pasesConfirmados : f.rsvp.estado === 'no_asiste' ? 0 : f.pasesAsignados);

let elegida = 'todo';

export async function montar(destino, ctx) {
  const { evento, data } = ctx;
  const el = subvista(destino, ctx);
  const [familias, mesas, mensajes] = await Promise.all([
    data.getFamilias(evento.id), data.getMesas(evento.id), data.getMensajes(evento.id),
  ]);
  const confirmadas = familias.filter((f) => f.rsvp.estado === 'confirmado');
  const mesa = (f) => mesas.find((m) => m.id === f.mesaId)?.nombre ?? 'Sin mesa';
  const mensaje = (f) => mensajes.find((m) => m.familiaId === f.id)?.texto ?? '';

  const opciones = [
    ['todo', 'Toda la lista', `${plural(familias.length, 'familia', 'familias')} · ${familias.reduce((n, f) => n + f.pasesAsignados, 0)} pases`],
    ['conf', 'Solo confirmados', `${plural(confirmadas.length, 'familia', 'familias')} · ${plural(confirmadas.reduce((n, f) => n + f.rsvp.pasesConfirmados, 0), 'persona', 'personas')}`],
    ['mesa', 'Por mesa', 'Para el salón y su coordinadora'],
  ];

  const cuerpo = document.createElement('div');
  cuerpo.className = 'exportar';
  el.append(cuerpo);
  const pintar = () => {
    cuerpo.innerHTML = html`
      <p class="t-body">Descarguen su lista en Excel con nombre, pases, confirmados, mesa, grupo y mensaje.</p>
      <div class="exportar__opciones" role="radiogroup" aria-label="Qué lista descargar">${opciones.map(([k, t, d]) => crudo(html`
        <button class="sheet exportar__opcion" type="button" role="radio" aria-checked="${elegida === k}" data-opcion="${k}">
          <span class="exportar__radio" aria-hidden="true"></span>
          <span class="exportar__textos"><span class="t-h3">${t}</span><span class="t-meta">${d}</span></span>
        </button>`))}</div>
      <button class="btn btn--full btn--lg" type="button" data-descargar${crudo(familias.length ? '' : ' disabled')}>Descargar Excel</button>`;
  };

  function filas() {
    if (elegida === 'mesa') {
      const orden = [...mesas.map((m) => m.id), null];
      const sentadas = familias
        .filter((f) => f.rsvp.estado !== 'no_asiste')
        .sort((a, b) => orden.indexOf(a.mesaId ?? null) - orden.indexOf(b.mesaId ?? null) || a.nombre.localeCompare(b.nombre, 'es'));
      return {
        filas: [['Mesa', 'Familia', 'Personas', 'Estado', 'Grupo'],
          ...sentadas.map((f) => [mesa(f), f.nombre, lugares(f), ESTADO[f.rsvp.estado], f.grupo ?? ''])],
        anchos: [12, 32, 10, 14, 22],
      };
    }
    const lista = elegida === 'conf' ? confirmadas : familias;
    return {
      filas: [['Familia', 'Grupo', 'Estado', 'Pases', 'Confirmados', 'Mesa', 'WhatsApp', 'Enlace de invitación', 'Mensaje'],
        ...lista.map((f) => [f.nombre, f.grupo ?? '', ESTADO[f.rsvp.estado], f.pasesAsignados, f.rsvp.pasesConfirmados,
          f.rsvp.estado === 'no_asiste' ? '' : mesa(f), f.telefono ?? '', enlaceFamilia(evento.slug, f.codigo), mensaje(f)])],
      anchos: [32, 20, 14, 8, 12, 12, 16, 60, 60],
    };
  }

  cuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.opcion) {
      elegida = b.dataset.opcion;
      pintar();
      cuerpo.querySelector(`[data-opcion="${elegida}"]`).focus();
    } else if (b.hasAttribute('data-descargar')) {
      const { filas: f, anchos } = filas();
      const sufijo = { todo: '', conf: '-confirmados', mesa: '-por-mesa' }[elegida];
      const archivo = `invitados-${evento.slug}${sufijo}.xlsx`;
      descargar(crearXlsx({ hoja: 'Invitados', filas: f, anchos }), archivo);
      toast(`Listo: descargamos ${archivo}.`);
    }
  });
  pintar();
}
