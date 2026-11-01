// Conexión con Supabase para los eventos de clientes (el demo sigue local).
// Sin librerías: Auth y la API REST de Supabase con fetch.
//
// - La pareja entra con la contraseña de su boda (Supabase Auth) y, con su
//   sesión, lee y guarda directo en las tablas; las reglas (RLS) solo le dejan
//   ver su evento (ver supabase/migrations/).
// - Los invitados no tienen sesión: usan las funciones invitado_* con el
//   código de su familia.
// No importar desde las pantallas: store.local.js lo usa por dentro.
import { SUPABASE_URL, SUPABASE_KEY, DEMO_EVENT_SLUG } from '../config.js';

const SESION_KEY = 'ramostudio:sesion';
export const TABLAS = ['familias', 'mesas', 'mensajes', 'actividad', 'regalos'];

// ¿Este evento guarda en Supabase? El demo no; tampoco en las pruebas
// (VITE_DATOS=local, ver playwright.config.js).
export const activo = (slug) =>
  Boolean(SUPABASE_URL && SUPABASE_KEY) && slug !== DEMO_EVENT_SLUG && import.meta.env.VITE_DATOS !== 'local';

export class ErrorRemoto extends Error {
  constructor(mensaje, status, cuerpo) {
    super(mensaje);
    this.name = 'ErrorRemoto';
    this.status = status;
    this.cuerpo = cuerpo;
  }
}

async function pedir(ruta, { metodo = 'GET', cuerpo, token = null, prefer = null } = {}) {
  let r;
  try {
    r = await fetch(`${SUPABASE_URL}${ruta}`, {
      method: metodo,
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorRemoto('sin_conexion', 0, null);
  }
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { json = texto; }
  if (!r.ok) throw new ErrorRemoto(json?.message || json?.msg || json?.error_description || r.statusText, r.status, json);
  return json;
}

const rpc = (funcion, args, token = null) => pedir(`/rest/v1/rpc/${funcion}`, { metodo: 'POST', cuerpo: args, token });

// ---------------------------------------------------------------------------
// Sesión de la pareja
// ---------------------------------------------------------------------------

function leerSesion() {
  try { return JSON.parse(localStorage.getItem(SESION_KEY)); } catch { return null; }
}

function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
    else localStorage.removeItem(SESION_KEY);
  } catch { /* sin almacenamiento: la sesión dura lo que la página */ }
}

const conTokens = (base, t) => ({
  ...base,
  token: t.access_token,
  refresco: t.refresh_token,
  expira: Date.now() + (t.expires_in ?? 3600) * 1000,
});

// Cada evento tiene un usuario del panel (lo damos de alta nosotros, ver
// supabase/README.md) con este correo interno, que nunca recibe correos.
export const correoPanel = (slug) => `${slug}@paneles.ramostudio.mx`;

// Cambia la contraseña de la boda por una sesión de este evento.
export async function entrar(contrasena, { eventoId, slug }) {
  const correo = correoPanel(slug);
  const t = await pedir('/auth/v1/token?grant_type=password', { metodo: 'POST', cuerpo: { email: correo, password: contrasena } });
  const sesion = conTokens({ correo, eventoId, slug }, t);
  guardarSesion(sesion);
  return sesion;
}

// La sesión con su token vigente (lo renueva si está por vencer); null si no hay o ya no sirve.
export async function sesion() {
  const s = leerSesion();
  if (!s?.token) return null;
  if (s.expira - Date.now() > 60_000) return s;
  try {
    const t = await pedir('/auth/v1/token?grant_type=refresh_token', { metodo: 'POST', cuerpo: { refresh_token: s.refresco } });
    const nueva = conTokens(s, t);
    guardarSesion(nueva);
    return nueva;
  } catch (e) {
    if (e.status) guardarSesion(null); // El servidor la rechazó; sin conexión se conserva.
    return e.status ? null : s;
  }
}

export async function salir() {
  const s = leerSesion();
  guardarSesion(null);
  if (s?.token) await pedir('/auth/v1/logout', { metodo: 'POST', token: s.token }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

// Todo el evento, para la pareja: { evento: datos editados, familias: [...], … }.
export async function cargarEvento(eventoId, token) {
  const id = encodeURIComponent(eventoId);
  const [eventos, ...tablas] = await Promise.all([
    pedir(`/rest/v1/eventos?id=eq.${id}&select=datos`, { token }),
    ...TABLAS.map((t) => pedir(`/rest/v1/${t}?evento_id=eq.${id}&select=datos`, { token })),
  ]);
  if (!eventos.length) throw new ErrorRemoto('evento_no_encontrado', 404, null);
  return {
    evento: eventos[0].datos ?? {},
    ...Object.fromEntries(TABLAS.map((t, i) => [t, tablas[i].map((fila) => fila.datos)])),
  };
}

// Lo público del evento para la invitación: { id, datos, regalos } o null.
export const eventoPublico = (slug) => rpc('evento_publico', { p_slug: slug });

// La familia de un enlace personal (o null si el código no existe).
export const familiaInvitado = (slug, codigo) => rpc('invitado_familia', { p_slug: slug, p_codigo: codigo });

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

// Cambios de la pareja: { eventoDatos?, [tabla]: { guardar: [obj], borrar: [id] } }.
export async function subir(eventoId, cambios, token) {
  const id = encodeURIComponent(eventoId);
  const tareas = [];
  if (cambios.eventoDatos) {
    tareas.push(pedir(`/rest/v1/eventos?id=eq.${id}`, { metodo: 'PATCH', cuerpo: { datos: cambios.eventoDatos }, token }));
  }
  for (const t of TABLAS) {
    const { guardar = [], borrar = [] } = cambios[t] ?? {};
    if (guardar.length) {
      const filas = guardar.map((o) => ({
        id: o.id, evento_id: eventoId, datos: o, actualizado: new Date().toISOString(),
        ...(t === 'familias' ? { codigo: o.codigo } : {}),
      }));
      tareas.push(pedir(`/rest/v1/${t}?on_conflict=id`, { metodo: 'POST', cuerpo: filas, token, prefer: 'resolution=merge-duplicates,return=minimal' }));
    }
    if (borrar.length) {
      const lista = borrar.map((x) => `"${String(x).replace(/"/g, '')}"`).join(',');
      tareas.push(pedir(`/rest/v1/${t}?evento_id=eq.${id}&id=in.(${encodeURIComponent(lista)})`, { metodo: 'DELETE', token }));
    }
  }
  await Promise.all(tareas);
}

// Lo que guarda un invitado (su respuesta, su apertura, sus mensajes).
export const invitadoGuardar = (slug, codigo, familia, actividad, mensajes) =>
  rpc('invitado_guardar', { p_slug: slug, p_codigo: codigo, p_familia: familia, p_actividad: actividad, p_mensajes: mensajes });
