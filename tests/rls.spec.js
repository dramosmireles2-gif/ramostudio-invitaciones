// Seguridad entre familias (RLS): las migraciones reales de supabase/migrations
// en un Postgres en memoria (PGlite). No toca Supabase. Respalda lo que dice la
// web en preguntas frecuentes: una familia no confirma más lugares de los que
// tiene, no ve ni cambia a otra familia y su código no se puede adivinar.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test, expect } from '@playwright/test';
import { PGlite } from '@electric-sql/pglite';
import { generarCodigo } from '../src/data/codigos.js';

const MIGRACIONES = resolve(import.meta.dirname, '..', 'supabase', 'migrations');

// Lo que Supabase ya trae y las migraciones dan por hecho: los roles anon y
// authenticated, auth.jwt() con los datos de la sesión y los permisos por
// defecto sobre lo nuevo en public (RLS decide qué filas se ven).
const SUPABASE = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`;

const familia = (id, eventoId, codigo, pases, extra = {}) => ({
  id, eventoId, codigo, nombre: `Familia ${id}`, grupo: 'Familia de la novia', telefono: '',
  pasesAsignados: pases,
  personas: Array.from({ length: pases }, (_, i) => ({ id: `${id}_${i}`, nombre: `Persona ${i + 1}`, mesaId: null })),
  rsvp: { estado: 'pendiente', pasesConfirmados: 0 },
  ...extra,
});

// Dos bodas: en "boda-a", la familia A1 (2 pases) y A2 (4); en "boda-b", B1.
const A1 = familia('fam_a1', 'evt_a', 'ABCDEF', 2);
const A2 = familia('fam_a2', 'evt_a', 'GHJKMN', 4);
const B1 = familia('fam_b1', 'evt_b', 'PQRSTU', 3);

async function nuevaBase() {
  const db = new PGlite();
  await db.exec(SUPABASE);
  for (const f of readdirSync(MIGRACIONES).filter((n) => n.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(MIGRACIONES, f), 'utf8'));
  }
  await db.exec(`
    insert into public.eventos (id, slug) values ('evt_a', 'boda-a'), ('evt_b', 'boda-b');
    insert into public.evento_admins (evento_id, correo) values ('evt_a', 'pareja@a.mx');
  `);
  for (const f of [A1, A2, B1]) {
    await db.query('insert into public.familias (id, evento_id, codigo, datos) values ($1, $2, $3, $4)', [f.id, f.eventoId, f.codigo, f]);
  }
  return db;
}

// Como un invitado sin sesión (la llave pública de la invitación).
async function comoInvitado(db) {
  await db.exec("set role anon; set request.jwt.claims = '{}';");
}

const guardar = (db, slug, codigo, datos) =>
  db.query('select public.invitado_guardar($1, $2, $3, $4, $5)', [slug, codigo, datos, [], []]);

const confirmar = (f, personas) => ({ ...f, rsvp: { estado: 'confirmado', pasesConfirmados: personas } });

test('un invitado sin sesión no puede leer ninguna tabla', async () => {
  const db = await nuevaBase();
  await comoInvitado(db);
  for (const tabla of ['eventos', 'evento_admins', 'familias', 'mesas', 'mensajes', 'actividad', 'regalos']) {
    const { rows } = await db.query(`select count(*)::int as n from public.${tabla}`);
    expect(rows[0].n, tabla).toBe(0);
  }
});

test('con su código, cada familia ve solo su familia y solo en su boda', async () => {
  const db = await nuevaBase();
  await comoInvitado(db);
  const ver = async (slug, codigo) => (await db.query('select public.invitado_familia($1, $2) as f', [slug, codigo])).rows[0].f;
  expect((await ver('boda-a', 'ABCDEF')).id).toBe('fam_a1');
  expect((await ver('boda-a', ' abcdef ')).id).toBe('fam_a1');
  expect(await ver('boda-a', 'PQRSTU')).toBeNull(); // El código de otra boda no sirve aquí.
  expect(await ver('boda-a', 'ZZZZZZ')).toBeNull();
});

test('una familia no puede confirmar más lugares de los que le dieron', async () => {
  const db = await nuevaBase();
  await comoInvitado(db);
  await expect(guardar(db, 'boda-a', 'ABCDEF', confirmar(A1, 3))).rejects.toThrow(/respuesta_invalida/);
  // Tampoco subiéndose los pases a sí misma.
  await expect(guardar(db, 'boda-a', 'ABCDEF', confirmar({ ...A1, pasesAsignados: 5 }, 5))).rejects.toThrow(/familia_invalida/);
  // Ni agregándose personas.
  const conOtra = { ...confirmar(A1, 2), personas: [...A1.personas, { id: 'colado', nombre: 'Colado', mesaId: null }] };
  await expect(guardar(db, 'boda-a', 'ABCDEF', conOtra)).rejects.toThrow(/familia_invalida/);
  // Lo permitido sí se guarda.
  await guardar(db, 'boda-a', 'ABCDEF', confirmar(A1, 2));
  expect((await db.query("select public.invitado_familia('boda-a', 'ABCDEF') as f")).rows[0].f.rsvp.pasesConfirmados).toBe(2);
});

test('con su código, una familia no puede cambiar la respuesta de otra', async () => {
  const db = await nuevaBase();
  await comoInvitado(db);
  // Su código con los datos de otra familia de la misma boda.
  await expect(guardar(db, 'boda-a', 'ABCDEF', confirmar(A2, 4))).rejects.toThrow(/familia_invalida/);
  // Su código en la otra boda.
  await expect(guardar(db, 'boda-b', 'ABCDEF', confirmar(B1, 3))).rejects.toThrow(/familia_invalida/);
  // Nadie cambió.
  await db.exec('reset role;');
  const { rows } = await db.query("select codigo, datos -> 'rsvp' ->> 'estado' as estado from public.familias order by codigo");
  expect(rows.map((r) => r.estado)).toEqual(['pendiente', 'pendiente', 'pendiente']);
});

test('la pareja ve solo las familias de su boda', async () => {
  const db = await nuevaBase();
  await db.exec(`set role authenticated; set request.jwt.claims = '{"email": "pareja@a.mx"}';`);
  const { rows } = await db.query('select id from public.familias order by id');
  expect(rows.map((r) => r.id)).toEqual(['fam_a1', 'fam_a2']);
  // Y no puede meter una familia en la boda de otros.
  await expect(db.query("insert into public.familias (id, evento_id, codigo, datos) values ('x', 'evt_b', 'XXXXXX', '{}')"))
    .rejects.toThrow(/row-level security/);
});

test('los códigos de familia son aleatorios, de 6 a 8 caracteres y sin ambiguos', () => {
  const codigos = new Set();
  for (let i = 0; i < 2000; i++) codigos.add(generarCodigo(codigos));
  expect(codigos.size).toBe(2000);
  for (const c of codigos) expect(c).toMatch(/^[A-HJKMNP-Z2-9]{6,8}$/);
  // Los tres largos salen (no es un patrón fijo).
  expect(new Set([...codigos].map((c) => c.length))).toEqual(new Set([6, 7, 8]));
});
