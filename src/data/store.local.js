// Implementación local del módulo de datos: lee el JSON de prueba y guarda los
// cambios en localStorage. Misma firma que tendrá store.supabase.js.
// No importar este archivo desde las pantallas: usar src/data/index.js.
import seed from './seed/mariana-diego.json';
import { DEMO_LOGIN_CODE } from '../config.js';
import { generarCodigo, normalizarCodigo } from './codigos.js';

const STORAGE_KEY = 'ramostudio:demo:v5'; // Subir la versión cuando cambie la forma del seed.
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
function hidratarSeed() {
  const s = structuredClone(seed);
  delete s._nota;
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
    mesaId: null,
    abrioFecha: null,
    rsvp: { estado: 'pendiente', pasesConfirmados: 0, nota: '', fecha: null },
  };
  estado().familias.push(f);
  registrarActividad(eventoId, 'familia', 'Se agregó a {familia}', f.id);
  guardar();
  return copia(f);
}

export async function actualizarFamilia(familiaId, cambios) {
  const f = familiaPorId(familiaId);
  if ('nombre' in cambios) f.nombre = String(cambios.nombre).trim() || f.nombre;
  if ('telefono' in cambios) f.telefono = cambios.telefono;
  if ('grupo' in cambios) f.grupo = cambios.grupo;
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
