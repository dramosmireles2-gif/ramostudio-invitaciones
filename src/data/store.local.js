// Implementación local del módulo de datos: lee el JSON de prueba y guarda los
// cambios en localStorage. Misma firma que tendrá store.supabase.js.
// No importar este archivo desde las pantallas: usar src/data/index.js.
import seed from './seed/mariana-diego.json';
import { DEMO_LOGIN_CODE } from '../config.js';
import { generarCodigo, normalizarCodigo } from './codigos.js';

const STORAGE_KEY = 'ramostudio:demo:v1';
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
// Persistencia
// ---------------------------------------------------------------------------

let memoria = null; // Respaldo si localStorage no está disponible.

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

function haceHorasAIso(horas) {
  return horas == null ? null : new Date(Date.now() - horas * HORA).toISOString();
}

// Convierte los tiempos relativos del seed (haceHoras) en fechas reales.
function hidratarSeed() {
  const s = structuredClone(seed);
  delete s._nota;
  for (const f of s.familias) {
    f.rsvp.fecha = haceHorasAIso(f.rsvp.haceHoras);
    delete f.rsvp.haceHoras;
  }
  for (const lista of [s.mensajes, s.actividad]) {
    for (const item of lista) {
      item.fecha = haceHorasAIso(item.haceHoras);
      delete item.haceHoras;
    }
  }
  return s;
}

function estado() {
  if (!memoria) {
    memoria = leerStorage(STORAGE_KEY) ?? hidratarSeed();
  }
  return memoria;
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

function registrarActividad(eventoId, tipo, texto, familiaId = null) {
  estado().actividad.push({
    id: nuevoId('act'),
    eventoId,
    tipo,
    familiaId,
    texto,
    fecha: new Date().toISOString(),
  });
}

// Pases que ocupa una familia en una mesa: los confirmados si ya respondió,
// los asignados si sigue pendiente.
function pasesOcupados(f) {
  if (f.rsvp.estado === 'confirmado') return f.rsvp.pasesConfirmados;
  if (f.rsvp.estado === 'no_asiste') return 0;
  return f.pasesAsignados;
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
  const e = estado().eventos.find((x) => x.slug === slug);
  if (!e) throw new DataError('evento_no_encontrado', 'No encontramos este evento.');
  return conFechas(e);
}

export async function getEventoPorId(eventoId) {
  return conFechas(eventoPorId(eventoId));
}

const CAMPOS_EVENTO = [
  'titulo', 'anfitriones', 'hora', 'frase', 'padres', 'padrinos', 'sedes',
  'itinerario', 'vestimenta', 'musica', 'tema', 'fechaLimiteRsvpDiasAntes',
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

export async function crearFamilia(eventoId, { nombre, pasesAsignados = 1, telefono = '' }) {
  eventoPorId(eventoId);
  if (!String(nombre ?? '').trim()) throw new DataError('nombre_requerido', 'Escribe el nombre de la familia.');
  const f = {
    id: nuevoId('fam'),
    eventoId,
    nombre: nombre.trim(),
    telefono,
    codigo: generarCodigo(codigosExistentes()),
    pasesAsignados: Math.max(1, Number(pasesAsignados) || 1),
    mesaId: null,
    rsvp: { estado: 'pendiente', pasesConfirmados: 0, nota: '', fecha: null },
  };
  estado().familias.push(f);
  registrarActividad(eventoId, 'familia', `Se agregó a ${f.nombre}`, f.id);
  guardar();
  return copia(f);
}

export async function actualizarFamilia(familiaId, cambios) {
  const f = familiaPorId(familiaId);
  if ('nombre' in cambios) f.nombre = String(cambios.nombre).trim() || f.nombre;
  if ('telefono' in cambios) f.telefono = cambios.telefono;
  if ('pasesAsignados' in cambios) {
    f.pasesAsignados = Math.max(1, Number(cambios.pasesAsignados) || 1);
    f.rsvp.pasesConfirmados = Math.min(f.rsvp.pasesConfirmados, f.pasesAsignados);
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
  if (!asiste) f.mesaId = null;

  const texto = asiste
    ? pases === f.pasesAsignados
      ? `${f.nombre} confirmó ${plural(pases, 'pase', 'pases')}`
      : `${f.nombre} confirmó ${pases} de ${plural(f.pasesAsignados, 'pase', 'pases')}`
    : `${f.nombre} no podrá asistir`;
  registrarActividad(eventoId, 'rsvp', texto, f.id);
  guardar();
  return copia(f);
}

// Se llama cuando un invitado abre su invitación (para la vista de actividad).
export async function registrarApertura(eventoId, codigo) {
  const c = normalizarCodigo(codigo);
  const f = estado().familias.find((x) => x.eventoId === eventoId && x.codigo === c);
  if (!f) return;
  registrarActividad(eventoId, 'apertura', `${f.nombre} abrió la invitación`, f.id);
  guardar();
}

// ---------------------------------------------------------------------------
// Mesas
// ---------------------------------------------------------------------------

export async function getMesas(eventoId) {
  const familias = estado().familias.filter((f) => f.eventoId === eventoId);
  return estado().mesas
    .filter((m) => m.eventoId === eventoId)
    .map((m) => {
      const sentadas = familias.filter((f) => f.mesaId === m.id);
      return {
        ...copia(m),
        familiaIds: sentadas.map((f) => f.id),
        ocupados: sentadas.reduce((n, f) => n + pasesOcupados(f), 0),
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
  for (const f of s.familias) if (f.mesaId === mesaId) f.mesaId = null;
  s.mesas = s.mesas.filter((x) => x.id !== mesaId);
  guardar();
}

// mesaId = null quita a la familia de su mesa.
export async function asignarMesa(familiaId, mesaId) {
  const f = familiaPorId(familiaId);
  if (mesaId == null) {
    f.mesaId = null;
    guardar();
    return copia(f);
  }
  const m = mesaPorId(mesaId);
  if (f.rsvp.estado === 'no_asiste') {
    throw new DataError('familia_no_asiste', `${f.nombre} indicó que no asistirá.`);
  }
  const ocupados = estado().familias
    .filter((x) => x.mesaId === m.id && x.id !== f.id)
    .reduce((n, x) => n + pasesOcupados(x), 0);
  if (ocupados + pasesOcupados(f) > m.capacidad) {
    throw new DataError('mesa_llena', `${m.nombre} no tiene lugares suficientes.`);
  }
  f.mesaId = m.id;
  guardar();
  return copia(f);
}

// ---------------------------------------------------------------------------
// Mensajes, regalos y actividad
// ---------------------------------------------------------------------------

export async function getMensajes(eventoId) {
  return copia(estado().mensajes.filter((m) => m.eventoId === eventoId))
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
  registrarActividad(eventoId, 'mensaje', `${m.autor} dejó un mensaje`, m.familiaId);
  guardar();
  return copia(m);
}

export async function getRegalos(eventoId) {
  return copia(estado().regalos.filter((r) => r.eventoId === eventoId));
}

export async function getActividad(eventoId, { limite = 50 } = {}) {
  return copia(estado().actividad.filter((a) => a.eventoId === eventoId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, limite);
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
  const suma = (lista, fn) => lista.reduce((n, f) => n + fn(f), 0);

  return {
    diasRestantes: diasDeCalendario(evento.fecha),
    familias: {
      total: familias.length,
      confirmadas: confirmadas.length,
      noAsisten: por('no_asiste').length,
      pendientes: pendientes.length,
    },
    pases: {
      asignados: suma(familias, (f) => f.pasesAsignados),
      confirmados: suma(confirmadas, (f) => f.rsvp.pasesConfirmados),
      pendientes: suma(pendientes, (f) => f.pasesAsignados),
    },
    mesas: {
      familiasSinMesa: familias.filter((f) => !f.mesaId && f.rsvp.estado !== 'no_asiste').length,
    },
    mensajes: estado().mensajes.filter((m) => m.eventoId === eventoId).length,
  };
}

// ---------------------------------------------------------------------------
// Sesión del panel (simulada, solo demo)
// ---------------------------------------------------------------------------

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(correo, codigo) {
  if (!CORREO_VALIDO.test(String(correo ?? '').trim())) {
    throw new DataError('correo_invalido', 'Escribe un correo válido.');
  }
  if (String(codigo ?? '').trim() !== DEMO_LOGIN_CODE) {
    throw new DataError('codigo_incorrecto', 'El código no es correcto.');
  }
  // En la demo, cualquier sesión administra el primer evento.
  const sesion = { correo: correo.trim(), eventoId: estado().eventos[0].id };
  escribirStorage(SESION_KEY, sesion);
  return copia(sesion);
}

export async function getSesion() {
  return leerStorage(SESION_KEY);
}

export async function logout() {
  escribirStorage(SESION_KEY, null);
}

// Borra todos los cambios hechos en la demo y vuelve a los datos de prueba.
export async function reiniciarDemo() {
  escribirStorage(STORAGE_KEY, null);
  memoria = null;
}
