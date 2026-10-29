// Subvista "Exportar lista a Excel" (Más): toda la lista, solo confirmados o
// por mesa (para el salón y su coordinadora). Descarga un .xlsx real con una
// hoja "Resumen" de totales; "Por mesa" agrega una hoja con cada mesa y sus invitados.
import { enlaceFamilia } from '../../lib/links.js';
import { fechaNumerica } from '../../lib/fechas.js';
import { crearXlsx, descargar } from '../../lib/xlsx.js';
import { html, crudo } from '../../lib/dom.js';
import { toast, plural } from '../../lib/ui.js';
import { subvista } from '../componentes.js';

const ESTADO = { confirmado: 'Confirmado', no_asiste: 'No asiste', pendiente: 'Pendiente' };

let elegida = 'todo';

export async function montar(destino, ctx) {
  const { evento, data } = ctx;
  const el = subvista(destino, ctx);
  const [familias, mesas, mensajes, totales] = await Promise.all([
    data.getFamilias(evento.id), data.getMesas(evento.id), data.getMensajes(evento.id), data.getResumen(evento.id),
  ]);
  const confirmadas = familias.filter((f) => f.rsvp.estado === 'confirmado');
  const nombreMesa = (id) => mesas.find((m) => m.id === id)?.nombre ?? 'Sin mesa';
  // Mesa de la familia: una, varias ("Mesa 5 (3) · Mesa 12 (2)") o sin mesa.
  const mesa = (f) => {
    const partes = data.mesasDeFamilia(f);
    if (!partes.length) return 'Sin mesa';
    return partes.length === 1 ? nombreMesa(partes[0].mesaId) : partes.map((x) => `${nombreMesa(x.mesaId)} (${x.n})`).join(' · ');
  };
  const ESTADO_PERSONA = { confirmado: 'Confirmado', pendiente: 'Pendiente', no: 'No asiste' };
  // Personas que van (o siguen pendientes), con su familia, para las hojas por mesa.
  const gente = familias.flatMap((f) => data.personasDe(f).map((p) => ({ ...p, grupo: f.grupo ?? '' }))).filter((p) => p.ocupa);
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

  const zona = { zona: evento.zonaHoraria };
  const enlace = (f) => {
    const url = enlaceFamilia(evento.slug, f.codigo, f);
    return { texto: url, enlace: url };
  };

  // Hoja "Resumen": totales de la boda, en personas (pases) y familias.
  function resumen() {
    const r = totales;
    return {
      nombre: 'Resumen',
      encabezado: false,
      negritas: [0, 3, 8],
      filas: [
        [evento.titulo],
        [`Boda: ${fechaNumerica(evento.fecha, zona)} · Lista descargada el ${fechaNumerica(new Date().toISOString(), zona)}`],
        [],
        ['', 'Personas', 'Familias'],
        ['Confirmados', r.pases.confirmados, r.familias.confirmadas],
        ['Pendientes', r.pases.pendientes, r.familias.pendientes],
        ['No asisten', r.pases.noAsisten, r.familias.noAsisten],
        [],
        ['Pases asignados', r.pases.asignados, r.familias.total],
      ],
    };
  }

  // Hoja "Mesas": cada mesa con sus personas y, al final, quienes no tienen mesa.
  function mesasAgrupadas() {
    const filas = [];
    const negritas = [];
    const bloque = (titulo, detalle, lista) => {
      negritas.push(filas.length, filas.length + 1);
      filas.push([titulo, detalle], ['Persona', 'Familia', 'Estado', 'Grupo']);
      for (const p of lista) filas.push([p.nombre, p.familia, ESTADO_PERSONA[p.estado], p.grupo]);
      if (!lista.length) filas.push(['Mesa libre']);
      filas.push([]);
    };
    for (const m of mesas) {
      const cap = data.textoCapacidad(m.ocupados, m.capacidad);
      bloque(m.nombre, `${m.ocupados} de ${m.capacidad} lugares · ${cap.texto}`, gente.filter((p) => p.mesaId === m.id));
    }
    const sinMesa = gente.filter((p) => !p.mesaId);
    if (sinMesa.length) bloque('Sin mesa', plural(sinMesa.length, 'persona', 'personas'), sinMesa);
    return { nombre: 'Mesas', encabezado: false, negritas, filas };
  }

  function hojas() {
    if (elegida === 'mesa') {
      // Una fila por persona, ordenada por mesa (las sin mesa al final).
      const orden = [...mesas.map((m) => m.id), null];
      const porMesa = [...gente].sort((a, b) => orden.indexOf(a.mesaId ?? null) - orden.indexOf(b.mesaId ?? null)
        || a.familia.localeCompare(b.familia, 'es'));
      return [resumen(), mesasAgrupadas(), {
        nombre: 'Por mesa',
        filas: [['Mesa', 'Persona', 'Familia', 'Estado', 'Grupo'],
          ...porMesa.map((p) => [nombreMesa(p.mesaId), p.nombre, p.familia, ESTADO_PERSONA[p.estado], p.grupo])],
      }];
    }
    const lista = elegida === 'conf' ? confirmadas : familias;
    return [resumen(), {
      nombre: elegida === 'conf' ? 'Confirmados' : 'Invitados',
      filas: [['Familia', 'Grupo', 'Estado', 'Pases', 'Confirmados', 'Mesa', 'WhatsApp', 'Enlace de invitación', 'Mensaje'],
        ...lista.map((f) => [f.nombre, f.grupo ?? '', ESTADO[f.rsvp.estado], f.pasesAsignados, f.rsvp.pasesConfirmados,
          f.rsvp.estado === 'no_asiste' ? '' : mesa(f), f.telefono ?? '', enlace(f), mensaje(f)])],
    }];
  }

  cuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.opcion) {
      elegida = b.dataset.opcion;
      pintar();
      cuerpo.querySelector(`[data-opcion="${elegida}"]`).focus();
    } else if (b.hasAttribute('data-descargar')) {
      const sufijo = { todo: '', conf: '-confirmados', mesa: '-por-mesa' }[elegida];
      const archivo = `invitados-${evento.slug}${sufijo}.xlsx`;
      descargar(crearXlsx({ hojas: hojas() }), archivo);
      toast(`Listo: descargamos ${archivo}.`);
    }
  });
  pintar();
}
