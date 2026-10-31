// Implementación local del módulo de datos: lee eventos/<slug>/evento.json y
// guarda los cambios en localStorage. Misma firma que tendrá store.supabase.js.
// No importar este archivo desde las pantallas: usar src/data/index.js.
import { DEMO_EVENT_SLUG, DEMO_LOGIN_CODE } from '../config.js';
import { generarCodigo, normalizarCodigo } from './codigos.js';
import { personasDe } from './reglas.js';

const STORAGE_KEY = 'ramostudio:demo:v7'; // Subir la versión cuando cambie la forma del seed.
// Versiones anteriores: v3–v5 traen la mesa por familia (familia.mesaId) y a
// v3–v6 les falta la familia demo (código DEMO). Se migran.
const KEYS_ANTERIORES = ['ramostudio:demo:v6', 'ramostudio:demo:v5', 'ramostudio:demo:v4', 'ramostudio:demo:v3'];
// Familia del recorrido invitado → panel (?f=demo). Único código no aleatorio.
const CODIGO_DEMO = 'DEMO';
const SESION_KEY = 'ramostudio:demo:sesion';
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

export class DataError extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = 'DataError';
    this.codigo = codigo;
  }
}

// ---------------------------------------------------------------------------
// Eventos (uno por carpeta)
// ---------------------------------------------------------------------------

// Cada evento es un chunk aparte: solo se descarga el que se abre.
const ARCHIVOS = Object.fromEntries(
  Object.entries(import.meta.glob('/eventos/*/evento.json', { import: 'default' }))
    .map(([ruta, cargar]) => [ruta.split('/')[2], cargar]),
);
const COLECCIONES = ['eventos', 'familias', 'mesas', 'mensajes', 'regalos', 'actividad'];

// ---------------------------------------------------------------------------
// Persistencia
// ---------------------------------------------------------------------------

let memoria = null; // Respaldo si localStorage no está disponible.
let viejo = null; // Datos de una versión anterior del demo, por migrar al cargar su evento.

function leerStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function escribirStorage(key, valor) {
  try {
    if (valor === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(valor));
  } catch {
    // Modo privado o almacenamiento bloqueado: la demo sigue en memoria.
  }
}

// "Y-M-D" de hoy en la zona del evento.
function hoyEnZona(zona) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

// Diferencia (en minutos) entre la zona y UTC en este momento, p. ej. -360 en CDMX.
function desfaseMinutos(zona) {
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: zona, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const comoUtc = Date.UTC(partes.year, partes.month - 1, partes.day, partes.hour, partes.minute);
  return Math.round((comoUtc - Date.now()) / 60000 / 15) * 15; // Las zonas van de 15 en 15 minutos.
}

// Convierte los tiempos del seed ({ dias, hora } en la zona del evento) en
// fechas reales, para que la actividad de la demo tenga horas creíbles (de
// 8:00 a. m. a 11:00 p. m.) a cualquier hora que se abra.
function hidratarSeed(seed) {
  const s = structuredClone(seed);
  delete s._nota;
  for (const k of COLECCIONES) s[k] ??= [];
  const zona = s.eventos[0].zonaHoraria;
  const [a, m, d] = hoyEnZona(zona).split('-').map(Number);
  const desfase = desfaseMinutos(zona);
  const ahora = Date.now();
  const minutosHoy = (ahora / 60000 + desfase) % 1440;
  // Antes de las 8:30 nada de "hoy" sería creíble: toda la demo se recorre un día.
  const extra = minutosHoy < 8 * 60 + 30 ? 1 : 0;
  const aMs = (c) => {
    const [h, min] = c.hora.split(':').map(Number);
    return Date.UTC(a, m - 1, d - c.dias - extra, h, min) - desfase * 60000;
  };

  const tiempos = []; // [objeto, campo, cuando]
  for (const f of s.familias) {
    tiempos.push([f.rsvp, 'fecha', f.rsvp.cuando], [f, 'abrioFecha', f.abrioCuando]);
    delete f.rsvp.cuando;
    delete f.abrioCuando;
  }
  for (const item of [...s.mensajes, ...s.actividad]) {
    tiempos.push([item, 'fecha', item.cuando]);
    delete item.cuando;
  }
  // Lo de hoy que aún no ha pasado se acomoda justo antes de ahora, en el
  // mismo orden (lo mismo de una familia comparte la misma hora).
  const futuras = [...new Set(tiempos.filter(([, , c]) => c && aMs(c) > ahora).map(([, , c]) => aMs(c)))]
    .sort((x, y) => y - x);
  const ajuste = new Map(futuras.map((t, i) => [t, ahora - (i + 1) * 7 * 60000]));
  for (const [obj, campo, c] of tiempos) {
    if (!c) { obj[campo] = null; continue; }
    const t = aMs(c);
    obj[campo] = new Date(ajuste.get(t) ?? t).toISOString();
  }
  return s;
}

// Los textos de actividad del seed llevan {familia}: se pone el nombre actual
// de la familia al leer, para que siempre coincida con su ficha.
function conNombre(item) {
  const f = item.familiaId && estado().familias.find((x) => x.id === item.familiaId);
  const nombre = f?.nombre ?? item.nombre ?? 'Una familia';
  return { ...item, texto: item.texto.replaceAll('{familia}', nombre) };
}

// Migración del formato viejo (una mesa por familia, familia.mesaId) al nuevo
// (familia.personas[], cada persona con su mesaId) sin perder asignaciones:
// cada persona hereda la mesa de su familia. Los nombres salen del seed si la
// familia existe ahí con los mismos pases; si no, "Invitado 1", "Invitado 2"…
function migrarDatos(viejo, seed) {
  const delSeed = new Map(seed.familias.map((f) => [f.id, f]));
  for (const f of viejo.familias ?? []) {
    if (Array.isArray(f.personas)) continue;
    const base = delSeed.get(f.id);
    const nombres = base && base.personas.length === f.pasesAsignados ? base.personas : null;
    f.personas = Array.from({ length: f.pasesAsignados }, (_, i) => ({
      id: nombres?.[i].id ?? `${f.id}_p${i + 1}`,
      nombre: nombres?.[i].nombre ?? `Invitado ${i + 1}`,
      mesaId: f.mesaId ?? null,
    }));
    delete f.mesaId;
  }
  // La familia demo llega sin abrir y sin responder; su mesa solo si aún existe.
  if (!viejo.familias.some((f) => f.codigo === CODIGO_DEMO)) {
    const { abrioCuando, rsvp: { cuando, ...rsvp }, ...demo } = structuredClone(seed.familias.find((f) => f.codigo === CODIGO_DEMO));
    const mesas = new Set(viejo.mesas.map((m) => m.id));
    for (const p of demo.personas) if (!mesas.has(p.mesaId)) p.mesaId = null;
    viejo.familias.push({ ...demo, abrioFecha: null, rsvp: { ...rsvp, fecha: null } });
  }
  return viejo;
}

// Todos los eventos abiertos en este navegador comparten un solo estado; cada
// uno entra la primera vez que se pide (cargarEvento).
function estado() {
  if (!memoria) {
    memoria = leerStorage(STORAGE_KEY);
    if (!memoria) {
      const key = KEYS_ANTERIORES.find((k) => leerStorage(k));
      if (key) viejo = { key, datos: leerStorage(key) };
      memoria = {};
    }
    for (const k of COLECCIONES) memoria[k] ??= [];
  }
  return memoria;
}

// Lo que en la demo no se edita desde el panel y siempre sale del evento.json.
const CAMPOS_DISENO = ['tema', 'fotos', 'secciones', 'frase', 'fraseSobres', 'creditoFotos', 'rsvp'];

// La familia del recorrido (código DEMO) se llamaba "Familia Herrera Luna" y la
// Familia Ramos de antes ahora es "Familia Rangel". Solo cambia los nombres que
// siguen como venían del seed; lo que la pareja haya editado se respeta.
const NOMBRES_ANTERIORES = { fam_demo: 'Familia Herrera Luna', fam_02: 'Familia Ramos' };
function renombrarFamiliasDemo(s, seed) {
  for (const [id, anterior] of Object.entries(NOMBRES_ANTERIORES)) {
    const f = s.familias.find((x) => x.id === id);
    const nueva = seed.familias.find((x) => x.id === id);
    if (!f || !nueva || f.nombre !== anterior) continue;
    f.nombre = nueva.nombre;
    for (const p of f.personas ?? []) {
      const base = nueva.personas.find((x) => x.id === p.id);
      if (base) p.nombre = base.nombre;
    }
  }
}

// Eventos reales: cuando evento.json cambia (una corrección publicada), los
// datos del evento y sus regalos se vuelven a tomar de ahí, para que llegue a
// quien ya abrió la invitación. Mientras no cambie, se respeta lo editado en
// el panel. Sus familias, mesas, mensajes y actividad quedan en este navegador.
const refrescados = new Set();

// Huella corta del evento.json (para saber si cambió).
function huellaSeed(seed) {
  const texto = JSON.stringify([seed.eventos[0], seed.regalos ?? []]);
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (Math.imul(31, h) + texto.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function cargarEvento(slug) {
  const s = estado();
  const presente = s.eventos.find((x) => x.slug === slug);
  if (presente && refrescados.has(slug)) return presente;
  // null: el evento es del otro sitio (demo o clientes) y no se publicó aquí.
  const seed = await ARCHIVOS[slug]?.();
  if (!seed) throw new DataError('evento_no_encontrado', 'No encontramos este evento.');
  // Otra llamada pudo cargarlo mientras se descargaba.
  const ya = s.eventos.find((x) => x.slug === slug);
  if (ya) {
    if (slug !== DEMO_EVENT_SLUG && !refrescados.has(slug)) {
      // Solo si evento.json cambió desde la última vez: así lo que la pareja
      // edita en el panel no se pierde al recargar.
      const huella = huellaSeed(seed);
      if (ya._semilla !== huella) {
        s.eventos[s.eventos.indexOf(ya)] = { ...structuredClone(seed.eventos[0]), _semilla: huella };
        s.regalos = [...s.regalos.filter((r) => r.eventoId !== ya.id), ...structuredClone(seed.regalos ?? [])];
      }
      refrescados.add(slug);
      guardar();
    } else if (slug === DEMO_EVENT_SLUG && !refrescados.has(slug)) {
      // En la demo los datos se pueden editar desde el panel, pero el diseño
      // no: se trae del evento.json para que una corrección de diseño llegue.
      for (const k of CAMPOS_DISENO) {
        if (k in seed.eventos[0]) ya[k] = structuredClone(seed.eventos[0][k]);
      }
      renombrarFamiliasDemo(s, seed);
      refrescados.add(slug);
      guardar();
    }
    return s.eventos.find((x) => x.slug === slug);
  }
  refrescados.add(slug);
  let datos;
  if (slug === DEMO_EVENT_SLUG && viejo) {
    datos = migrarDatos(viejo.datos, seed);
    renombrarFamiliasDemo(datos, seed);
    const demo = datos.eventos?.find((x) => x.slug === slug);
    for (const k of CAMPOS_DISENO) {
      if (demo && k in seed.eventos[0]) demo[k] = structuredClone(seed.eventos[0][k]);
    }
    escribirStorage(viejo.key, null);
    viejo = null;
  } else datos = hidratarSeed(seed);
  for (const k of COLECCIONES) s[k].push(...(datos[k] ?? []));
  const nuevo = s.eventos.find((x) => x.slug === slug);
  if (nuevo && slug !== DEMO_EVENT_SLUG) nuevo._semilla = huellaSeed(seed);
  guardar();
  return nuevo;
}

// El panel solo conoce el id (lo guarda la sesión): si aún no está, se cargan
// todos los eventos para encontrarlo.
async function cargarEventoPorId(eventoId) {
  if (!estado().eventos.some((x) => x.id === eventoId)) {
    await Promise.allSettled(Object.keys(ARCHIVOS).map(cargarEvento));
  }
  return eventoPorId(eventoId);
}

function guardar() {
  escribirStorage(STORAGE_KEY, memoria);
}

const copia = (v) => structuredClone(v);
const nuevoId = (prefijo) =>
  `${prefijo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// La fecha del evento demo se recalcula en cada lectura (hoy + N días) para que
// la demo siempre muestre la misma distancia al evento.
function conFechas(evento) {
  const e = copia(evento);
  if (e.fechaRelativaDias != null) {
    const [h, m] = e.hora.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setDate(d.getDate() + e.fechaRelativaDias);
    e.fecha = d.toISOString();
  }
  e.fechaLimiteRsvp = e.fechaLimiteRsvpDiasAntes != null && e.fecha
    ? new Date(new Date(e.fecha).getTime() - e.fechaLimiteRsvpDiasAntes * DIA).toISOString()
    : null;
  return e;
}

function eventoPorId(eventoId) {
  const e = estado().eventos.find((x) => x.id === eventoId);
  if (!e) throw new DataError('evento_no_encontrado', 'No encontramos este evento.');
  return e;
}

function familiaPorId(familiaId) {
  const f = estado().familias.find((x) => x.id === familiaId);
  if (!f) throw new DataError('familia_no_encontrada', 'No encontramos a esta familia.');
  return f;
}

function mesaPorId(mesaId) {
  const m = estado().mesas.find((x) => x.id === mesaId);
  if (!m) throw new DataError('mesa_no_encontrada', 'No encontramos esta mesa.');
  return m;
}

// En el texto, {familia} se cambia por el nombre actual de la familia al leer
// (se guarda también el nombre de ese momento por si después la quitan).
function registrarActividad(eventoId, tipo, texto, familiaId = null) {
  const f = familiaId && estado().familias.find((x) => x.id === familiaId);
  estado().actividad.push({
    id: nuevoId('act'),
    eventoId,
    tipo,
    familiaId,
    nombre: f?.nombre ?? null,
    texto,
    fecha: new Date().toISOString(),
  });
}

// Días de calendario entre hoy y la fecha (no horas / 24), para que "faltan 58
// días" no cambie según la hora del día.
function diasDeCalendario(iso) {
  const inicio = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(0, Math.round((inicio(new Date(iso)) - inicio(new Date())) / DIA));
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

export async function getEvento(slug) {
  return conFechas(await cargarEvento(slug));
}

export async function getEventoPorId(eventoId) {
  return conFechas(await cargarEventoPorId(eventoId));
}

const CAMPOS_EVENTO = [
  'titulo', 'anfitriones', 'ciudad', 'hora', 'frase', 'padres', 'padrinos', 'sedes',
  'itinerario', 'vestimenta', 'musica', 'tema', 'fechaLimiteRsvpDiasAntes', 'lluviaDeSobres',
];

export async function actualizarEvento(eventoId, cambios) {
  const e = eventoPorId(eventoId);
  for (const k of CAMPOS_EVENTO) if (k in cambios) e[k] = copia(cambios[k]);
  if ('fecha' in cambios) {
    e.fecha = cambios.fecha;
    delete e.fechaRelativaDias;
  }
  registrarActividad(eventoId, 'evento', 'Se actualizaron los datos del evento');
  guardar();
  return conFechas(e);
}

// ---------------------------------------------------------------------------
// Familias y confirmaciones
// ---------------------------------------------------------------------------

export async function getFamilias(eventoId) {
  return copia(estado().familias.filter((f) => f.eventoId === eventoId));
}

export async function getFamiliaPorCodigo(eventoId, codigo) {
  const c = normalizarCodigo(codigo);
  const f = estado().familias.find((x) => x.eventoId === eventoId && x.codigo === c);
  if (!f) throw new DataError('codigo_invalido', 'Este enlace no corresponde a ninguna invitación.');
  return copia(f);
}

function codigosExistentes() {
  return new Set(estado().familias.map((f) => f.codigo));
}

export async function crearFamilia(eventoId, { nombre, pasesAsignados = 1, telefono = '', grupo = '' }) {
  eventoPorId(eventoId);
  if (!String(nombre ?? '').trim()) throw new DataError('nombre_requerido', 'Escribe el nombre de la familia.');
  const f = {
    id: nuevoId('fam'),
    eventoId,
    nombre: nombre.trim(),
    grupo,
    telefono,
    codigo: generarCodigo(codigosExistentes()),
    pasesAsignados: Math.max(1, Number(pasesAsignados) || 1),
    personas: [],
    abrioFecha: null,
    rsvp: { estado: 'pendiente', pasesConfirmados: 0, nota: '', fecha: null },
  };
  ajustarPersonas(f);
  estado().familias.push(f);
  registrarActividad(eventoId, 'familia', 'Se agregó a {familia}', f.id);
  guardar();
  return copia(f);
}

// Una persona por pase. Si suben los pases, las nuevas se sientan donde está
// la familia (si toda está en una sola mesa); si bajan, salen las últimas.
function ajustarPersonas(f) {
  f.personas ??= [];
  const mesas = new Set(f.personas.map((p) => p.mesaId));
  const mesa = mesas.size === 1 ? [...mesas][0] : null;
  while (f.personas.length < f.pasesAsignados) {
    f.personas.push({ id: nuevoId('per'), nombre: `Invitado ${f.personas.length + 1}`, mesaId: mesa });
  }
  f.personas.length = f.pasesAsignados;
}

export async function actualizarFamilia(familiaId, cambios) {
  const f = familiaPorId(familiaId);
  if ('nombre' in cambios) f.nombre = String(cambios.nombre).trim() || f.nombre;
  if ('telefono' in cambios) f.telefono = cambios.telefono;
  if ('grupo' in cambios) f.grupo = cambios.grupo;
  if ('pasesAsignados' in cambios) {
    f.pasesAsignados = Math.max(1, Number(cambios.pasesAsignados) || 1);
    f.rsvp.pasesConfirmados = Math.min(f.rsvp.pasesConfirmados, f.pasesAsignados);
    ajustarPersonas(f);
  }
  guardar();
  return copia(f);
}

export async function eliminarFamilia(familiaId) {
  const s = estado();
  const f = familiaPorId(familiaId);
  s.familias = s.familias.filter((x) => x.id !== familiaId);
  registrarActividad(f.eventoId, 'familia', `Se eliminó a ${f.nombre}`);
  guardar();
}

// Invalida el enlace anterior de la familia y le da uno nuevo.
export async function regenerarCodigo(familiaId) {
  const f = familiaPorId(familiaId);
  f.codigo = generarCodigo(codigosExistentes());
  guardar();
  return copia(f);
}

export async function confirmarAsistencia(eventoId, codigo, { asiste, pasesConfirmados = 0, nota = '' }) {
  const c = normalizarCodigo(codigo);
  const f = estado().familias.find((x) => x.eventoId === eventoId && x.codigo === c);
  if (!f) throw new DataError('codigo_invalido', 'Este enlace no corresponde a ninguna invitación.');

  const pases = asiste ? Number(pasesConfirmados) : 0;
  if (asiste && (!Number.isInteger(pases) || pases < 1 || pases > f.pasesAsignados)) {
    throw new DataError('pases_invalidos', `Puedes confirmar de 1 a ${f.pasesAsignados} pases.`);
  }

  f.rsvp = {
    estado: asiste ? 'confirmado' : 'no_asiste',
    pasesConfirmados: pases,
    nota: String(nota ?? '').trim(),
    fecha: new Date().toISOString(),
  };
  // Quien no asiste deja libre su lugar.
  for (const p of personasDe(f)) if (!p.ocupa) f.personas.find((x) => x.id === p.id).mesaId = null;

  f.abrioFecha ??= f.rsvp.fecha;

  const texto = asiste
    ? pases === f.pasesAsignados
      ? `{familia} confirmó ${plural(pases, 'persona', 'personas')}.`
      : `{familia} confirmó ${pases} de ${plural(f.pasesAsignados, 'pase', 'pases')}.`
    : '{familia} respondió que no podrá ir.';
  registrarActividad(eventoId, asiste ? 'confirmacion' : 'no_asiste', texto, f.id);
  guardar();
  return copia(f);
}

// La familia del enlace personal (?f= y &d= con nombre y pases). En local, si
// este navegador no la conoce (otro teléfono), se registra aquí para que su
// confirmación se guarde. Con Supabase solo se busca por código.
export async function familiaDeEnlace(eventoId, { codigo, nombre, pasesAsignados }) {
  const c = normalizarCodigo(codigo);
  const existente = estado().familias.find((x) => x.eventoId === eventoId && x.codigo === c);
  if (existente) return copia(existente);
  eventoPorId(eventoId);
  const f = {
    id: nuevoId('fam'), eventoId, nombre, grupo: '', telefono: '', codigo: c,
    pasesAsignados, personas: [], abrioFecha: null,
    rsvp: { estado: 'pendiente', pasesConfirmados: 0, nota: '', fecha: null },
  };
  ajustarPersonas(f);
  estado().familias.push(f);
  guardar();
  return copia(f);
}

// Invitados que confirman sin enlace personal: escriben su nombre y cuántos
// van, y entran a la lista de los novios como una familia nueva.
export async function confirmarSinEnlace(eventoId, { nombre, asiste, pasesConfirmados = 1 }) {
  const limpio = String(nombre ?? '').trim();
  if (!limpio) throw new DataError('nombre_requerido', 'Escriban el nombre de su familia.');
  const pases = asiste ? Math.max(1, Number(pasesConfirmados) || 1) : 1;
  const f = await crearFamilia(eventoId, { nombre: limpio, pasesAsignados: pases, grupo: 'Confirmó sin enlace' });
  return confirmarAsistencia(eventoId, f.codigo, { asiste, pasesConfirmados: pases });
}

// Se llama cuando un invitado abre su invitación (para la vista de actividad).
export async function registrarApertura(eventoId, codigo) {
  const c = normalizarCodigo(codigo);
  const f = estado().familias.find((x) => x.eventoId === eventoId && x.codigo === c);
  if (!f || f.abrioFecha) return; // Solo cuenta la primera vez.
  f.abrioFecha = new Date().toISOString();
  registrarActividad(eventoId, 'apertura', '{familia} abrió su invitación.', f.id);
  guardar();
}

// ---------------------------------------------------------------------------
// Mesas
// ---------------------------------------------------------------------------

// En Supabase, cada persona es una fila de la tabla personas:
//   personas (id uuid pk, familia_id uuid -> familias.id on delete cascade,
//             nombre text, orden int, mesa_id uuid null -> mesas.id on delete set null)
// getMesas cuenta las personas por mesa_id (una vista o un select con count),
// y asignarPersonasMesa es una función RPC que, en una transacción, revisa el
// cupo de la mesa y hace update personas set mesa_id = $mesa where id = any($ids).
// Las políticas RLS dejan ver y cambiar solo las personas de las familias del
// evento de la pareja.

export async function getMesas(eventoId) {
  const personas = estado().familias.filter((f) => f.eventoId === eventoId).flatMap(personasDe);
  return estado().mesas
    .filter((m) => m.eventoId === eventoId)
    .map((m) => {
      const sentadas = personas.filter((p) => p.mesaId === m.id);
      return {
        ...copia(m),
        personaIds: sentadas.map((p) => p.id),
        familiaIds: [...new Set(sentadas.map((p) => p.familiaId))],
        ocupados: sentadas.filter((p) => p.ocupa).length,
      };
    });
}

export async function crearMesa(eventoId, { nombre, capacidad = 10 }) {
  eventoPorId(eventoId);
  const m = {
    id: nuevoId('mesa'),
    eventoId,
    nombre: String(nombre ?? '').trim() || `Mesa ${estado().mesas.filter((x) => x.eventoId === eventoId).length + 1}`,
    capacidad: Math.max(1, Number(capacidad) || 10),
  };
  estado().mesas.push(m);
  guardar();
  return copia(m);
}

export async function actualizarMesa(mesaId, cambios) {
  const m = mesaPorId(mesaId);
  if ('nombre' in cambios) m.nombre = String(cambios.nombre).trim() || m.nombre;
  if ('capacidad' in cambios) m.capacidad = Math.max(1, Number(cambios.capacidad) || m.capacidad);
  guardar();
  return copia(m);
}

export async function eliminarMesa(mesaId) {
  const s = estado();
  mesaPorId(mesaId);
  for (const f of s.familias) for (const p of f.personas) if (p.mesaId === mesaId) p.mesaId = null;
  s.mesas = s.mesas.filter((x) => x.id !== mesaId);
  guardar();
}

// Sienta a varias personas en una mesa (mesaId = null las deja sin mesa). Es
// todo o nada: si no caben, no mueve a nadie. Quien no asiste no se puede sentar.
export async function asignarPersonasMesa(personaIds, mesaId) {
  const ids = new Set(personaIds);
  const familias = estado().familias;
  const elegidas = familias.flatMap((f) => personasDe(f).filter((p) => ids.has(p.id)));
  if (elegidas.length !== ids.size) throw new DataError('persona_no_encontrada', 'No encontramos a una de las personas.');
  const real = (p) => familias.find((f) => f.id === p.familiaId).personas.find((x) => x.id === p.id);

  if (mesaId != null) {
    const m = mesaPorId(mesaId);
    const noVan = elegidas.filter((p) => !p.ocupa);
    if (noVan.length) {
      throw new DataError('persona_no_asiste', `${noVan.map((p) => p.nombre).join(' y ')} no ${noVan.length === 1 ? 'asistirá' : 'asistirán'}.`);
    }
    const yaSentados = familias.flatMap(personasDe).filter((p) => p.mesaId === m.id && p.ocupa && !ids.has(p.id)).length;
    const libres = m.capacidad - yaSentados;
    if (elegidas.length > libres) {
      throw new DataError('mesa_llena', libres > 0
        ? `En ${m.nombre} solo ${libres === 1 ? 'queda 1 lugar libre' : `quedan ${libres} lugares libres`}.`
        : `${m.nombre} ya no tiene lugares libres.`);
    }
  }
  for (const p of elegidas) real(p).mesaId = mesaId ?? null;
  guardar();
}

export async function asignarPersonaMesa(personaId, mesaId) {
  return asignarPersonasMesa([personaId], mesaId);
}

// Atajo: mueve a toda la familia (a quienes asisten o siguen pendientes).
export async function asignarMesa(familiaId, mesaId) {
  const f = familiaPorId(familiaId);
  if (mesaId != null && f.rsvp.estado === 'no_asiste') {
    throw new DataError('familia_no_asiste', `${f.nombre} indicó que no asistirá.`);
  }
  const ids = personasDe(f).filter((p) => p.ocupa || mesaId == null).map((p) => p.id);
  await asignarPersonasMesa(ids, mesaId);
  return copia(f);
}

// ---------------------------------------------------------------------------
// Mensajes, regalos y actividad
// ---------------------------------------------------------------------------

export async function getMensajes(eventoId) {
  const familias = estado().familias;
  // El autor es el nombre actual de la familia, igual que en su ficha.
  return copia(estado().mensajes.filter((m) => m.eventoId === eventoId))
    .map((m) => ({ ...m, autor: familias.find((f) => f.id === m.familiaId)?.nombre ?? m.autor }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function enviarMensaje(eventoId, { codigo = null, autor, texto }) {
  eventoPorId(eventoId);
  const limpio = String(texto ?? '').trim();
  if (!limpio) throw new DataError('mensaje_vacio', 'Escribe tu mensaje.');
  const familia = codigo
    ? estado().familias.find((x) => x.eventoId === eventoId && x.codigo === normalizarCodigo(codigo))
    : null;
  const m = {
    id: nuevoId('msg'),
    eventoId,
    familiaId: familia?.id ?? null,
    autor: String(autor ?? '').trim() || familia?.nombre || 'Invitado',
    texto: limpio.slice(0, 500),
    fecha: new Date().toISOString(),
  };
  estado().mensajes.push(m);
  registrarActividad(eventoId, 'mensaje', `${familia ? '{familia}' : m.autor} les dejó un mensaje.`, m.familiaId);
  guardar();
  return copia(m);
}

export async function getRegalos(eventoId) {
  return copia(estado().regalos.filter((r) => r.eventoId === eventoId));
}

const TIPOS_REGALO = ['mesa', 'lista', 'transferencia'];

// Crea la opción si no trae id; si lo trae, la actualiza.
export async function guardarRegalo(eventoId, { id = null, tipo, titulo, detalle = '', url = null }) {
  eventoPorId(eventoId);
  if (!String(titulo ?? '').trim()) throw new DataError('titulo_requerido', 'Escriban el nombre de la tienda o del banco.');
  const datos = {
    tipo: TIPOS_REGALO.includes(tipo) ? tipo : 'mesa',
    titulo: titulo.trim(),
    detalle: String(detalle ?? '').trim(),
    url: tipo === 'transferencia' ? null : String(url ?? '').trim() || null,
  };
  let r = id && estado().regalos.find((x) => x.id === id && x.eventoId === eventoId);
  if (r) Object.assign(r, datos);
  else {
    r = { id: nuevoId('reg'), eventoId, ...datos };
    estado().regalos.push(r);
  }
  guardar();
  return copia(r);
}

export async function eliminarRegalo(regaloId) {
  const s = estado();
  s.regalos = s.regalos.filter((x) => x.id !== regaloId);
  guardar();
}

export async function getActividad(eventoId, { limite = 50 } = {}) {
  return copia(estado().actividad.filter((a) => a.eventoId === eventoId))
    .map(conNombre)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, limite);
}

// Familias que no han respondido, para los recordatorios por WhatsApp.
// Primero las que ya abrieron su invitación, luego las que no la han abierto.
export async function getFamiliasPendientes(eventoId) {
  const pendientes = estado().familias.filter((f) => f.eventoId === eventoId && f.rsvp.estado === 'pendiente');
  return copia([...pendientes.filter((f) => f.abrioFecha), ...pendientes.filter((f) => !f.abrioFecha)]);
}

// ---------------------------------------------------------------------------
// Resumen para el panel
// ---------------------------------------------------------------------------

export async function getResumen(eventoId) {
  const evento = conFechas(eventoPorId(eventoId));
  const familias = estado().familias.filter((f) => f.eventoId === eventoId);
  const por = (estadoRsvp) => familias.filter((f) => f.rsvp.estado === estadoRsvp);
  const confirmadas = por('confirmado');
  const pendientes = por('pendiente');
  const noAsisten = por('no_asiste');
  const suma = (lista, fn) => lista.reduce((n, f) => n + fn(f), 0);

  return {
    diasRestantes: diasDeCalendario(evento.fecha),
    diasParaFechaLimite: evento.fechaLimiteRsvp ? diasDeCalendario(evento.fechaLimiteRsvp) : null,
    familias: {
      total: familias.length,
      confirmadas: confirmadas.length,
      noAsisten: noAsisten.length,
      pendientes: pendientes.length,
      sinAbrir: pendientes.filter((f) => !f.abrioFecha).length,
    },
    // En el panel, "personas" son pases: confirmados, por responder y liberados.
    pases: {
      asignados: suma(familias, (f) => f.pasesAsignados),
      confirmados: suma(confirmadas, (f) => f.rsvp.pasesConfirmados),
      pendientes: suma(pendientes, (f) => f.pasesAsignados),
      noAsisten: suma(noAsisten, (f) => f.pasesAsignados),
    },
    mesas: {
      familiasSinMesa: familias.filter((f) => personasDe(f).some((p) => p.ocupa && !p.mesaId)).length,
      personasSinMesa: familias.flatMap(personasDe).filter((p) => p.ocupa && !p.mesaId).length,
      personasConMesa: familias.flatMap(personasDe).filter((p) => p.ocupa && p.mesaId).length,
    },
    mensajes: estado().mensajes.filter((m) => m.eventoId === eventoId).length,
  };
}

// ---------------------------------------------------------------------------
// Sesión del panel (simulada, solo demo)
// ---------------------------------------------------------------------------

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(correo, codigo, eventoId) {
  if (!CORREO_VALIDO.test(String(correo ?? '').trim())) {
    throw new DataError('correo_invalido', 'Escribe un correo válido.');
  }
  if (String(codigo ?? '').trim() !== DEMO_LOGIN_CODE) {
    throw new DataError('codigo_incorrecto', 'El código no es correcto.');
  }
  // Login simulado: la sesión administra el evento desde el que se entró.
  const sesion = { correo: correo.trim(), eventoId: (await cargarEventoPorId(eventoId)).id };
  escribirStorage(SESION_KEY, sesion);
  return copia(sesion);
}

// Modo demo: abre el panel del evento demo sin pedir correo ni código.
export async function entrarDemo(eventoId) {
  const sesion = { correo: null, eventoId: eventoPorId(eventoId).id, demo: true };
  escribirStorage(SESION_KEY, sesion);
  return copia(sesion);
}

export async function getSesion() {
  return leerStorage(SESION_KEY);
}

export async function logout() {
  escribirStorage(SESION_KEY, null);
}

// Borra los cambios hechos en el evento demo (también los de versiones viejas,
// para que no se vuelvan a migrar); los demás eventos no se tocan. Sus datos
// de prueba vuelven la próxima vez que se pida el evento.
export async function reiniciarDemo() {
  for (const key of KEYS_ANTERIORES) escribirStorage(key, null);
  viejo = null;
  const s = estado();
  const demo = s.eventos.find((x) => x.slug === DEMO_EVENT_SLUG);
  if (!demo) return;
  s.eventos = s.eventos.filter((x) => x !== demo);
  for (const k of COLECCIONES.slice(1)) s[k] = s[k].filter((x) => x.eventoId !== demo.id);
  guardar();
}
