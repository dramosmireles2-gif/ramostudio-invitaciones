-- RamoStudio en Supabase: todas las bodas en un solo proyecto, cada una aislada.
--
-- - Cada evento es una fila de `eventos`; sus familias, mesas, mensajes,
--   actividad y regalos llevan su evento_id.
-- - Los objetos se guardan tal cual los usa la app (columna `datos`, jsonb),
--   con la misma forma que en eventos/<slug>/evento.json.
-- - La pareja entra con un código a su correo (Supabase Auth) y solo ve y cambia
--   los eventos donde su correo está en `evento_admins` (RLS).
-- - Los invitados no tocan las tablas: usan funciones que piden el código de
--   su familia y solo dejan cambiar su respuesta, su apertura y sus mensajes.
-- - El diseño de cada evento (tema, fotos, secciones) vive en el repo; en
--   `eventos.datos` solo va lo que la pareja edita en el panel.

create table public.eventos (
  id text primary key,
  slug text not null unique,
  datos jsonb not null default '{}'::jsonb,
  creado timestamptz not null default now()
);

create table public.evento_admins (
  evento_id text not null references public.eventos (id) on delete cascade,
  correo text not null check (correo = lower(correo)),
  primary key (evento_id, correo)
);

create table public.familias (
  id text primary key,
  evento_id text not null references public.eventos (id) on delete cascade,
  codigo text not null,
  datos jsonb not null,
  actualizado timestamptz not null default now(),
  unique (evento_id, codigo)
);

create table public.mesas (
  id text primary key,
  evento_id text not null references public.eventos (id) on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);

create table public.mensajes (
  id text primary key,
  evento_id text not null references public.eventos (id) on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);

create table public.actividad (
  id text primary key,
  evento_id text not null references public.eventos (id) on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);

create table public.regalos (
  id text primary key,
  evento_id text not null references public.eventos (id) on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);

create index on public.mesas (evento_id);
create index on public.mensajes (evento_id);
create index on public.actividad (evento_id);
create index on public.regalos (evento_id);

-- ¿El correo de la sesión administra este evento?
create function public.es_admin(p_evento text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.evento_admins a
    where a.evento_id = p_evento and a.correo = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );
$$;

alter table public.eventos enable row level security;
alter table public.evento_admins enable row level security;
alter table public.familias enable row level security;
alter table public.mesas enable row level security;
alter table public.mensajes enable row level security;
alter table public.actividad enable row level security;
alter table public.regalos enable row level security;

create policy "la pareja ve su evento" on public.eventos
  for select to authenticated using (public.es_admin(id));
create policy "la pareja edita su evento" on public.eventos
  for update to authenticated using (public.es_admin(id)) with check (public.es_admin(id));
create policy "cada correo ve sus eventos" on public.evento_admins
  for select to authenticated using (correo = lower((select auth.jwt() ->> 'email')));
create policy "la pareja administra sus familias" on public.familias
  for all to authenticated using (public.es_admin(evento_id)) with check (public.es_admin(evento_id));
create policy "la pareja administra sus mesas" on public.mesas
  for all to authenticated using (public.es_admin(evento_id)) with check (public.es_admin(evento_id));
create policy "la pareja administra sus mensajes" on public.mensajes
  for all to authenticated using (public.es_admin(evento_id)) with check (public.es_admin(evento_id));
create policy "la pareja administra su actividad" on public.actividad
  for all to authenticated using (public.es_admin(evento_id)) with check (public.es_admin(evento_id));
create policy "la pareja administra sus regalos" on public.regalos
  for all to authenticated using (public.es_admin(evento_id)) with check (public.es_admin(evento_id));

-- ---------------------------------------------------------------------------
-- Funciones para la invitación (sin sesión)
-- ---------------------------------------------------------------------------

-- Lo que la pareja editó del evento (lo mismo que ya se ve en la invitación).
create function public.evento_publico(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', e.id, 'datos', e.datos) from public.eventos e where e.slug = p_slug;
$$;

-- La familia de un enlace personal, y nada más.
create function public.invitado_familia(p_slug text, p_codigo text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select f.datos from public.familias f join public.eventos e on e.id = f.evento_id
  where e.slug = p_slug and f.codigo = upper(trim(p_codigo));
$$;

-- ¿Este correo puede entrar al panel de este evento? (antes de mandar el código)
create function public.correo_autorizado(p_slug text, p_correo text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.evento_admins a join public.eventos e on e.id = a.evento_id
    where e.slug = p_slug and a.correo = lower(trim(p_correo))
  );
$$;

-- Lo que guarda un invitado: su respuesta y cuándo abrió (o una familia nueva
-- si confirmó sin enlace), y la actividad y mensajes que eso genera.
create function public.invitado_guardar(
  p_slug text, p_codigo text, p_familia jsonb, p_actividad jsonb, p_mensajes jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_evento text;
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
  v_actual jsonb;
  v_familia text;
  v_pases int;
  v_conf int;
  x jsonb;
begin
  select id into v_evento from public.eventos where slug = p_slug;
  if v_evento is null then raise exception 'evento_no_encontrado'; end if;

  if p_familia is not null then
    if p_familia ->> 'codigo' is distinct from v_codigo or p_familia ->> 'eventoId' is distinct from v_evento then
      raise exception 'familia_invalida';
    end if;
    v_pases := (p_familia ->> 'pasesAsignados')::int;
    v_conf := (p_familia -> 'rsvp' ->> 'pasesConfirmados')::int;
    if coalesce(p_familia -> 'rsvp' ->> 'estado', '') not in ('pendiente', 'confirmado', 'no_asiste')
      or v_conf is null or v_conf < 0 or v_conf > v_pases
      or jsonb_typeof(p_familia -> 'personas') <> 'array' then
      raise exception 'respuesta_invalida';
    end if;

    select datos into v_actual from public.familias where evento_id = v_evento and codigo = v_codigo;
    if v_actual is not null then
      -- Solo cambian su respuesta, cuándo abrió y, si alguien no va, que deje libre su lugar.
      if (p_familia - 'rsvp' - 'abrioFecha' - 'personas') <> (v_actual - 'rsvp' - 'abrioFecha' - 'personas')
        or jsonb_array_length(p_familia -> 'personas') <> jsonb_array_length(v_actual -> 'personas')
        or exists (
          select 1
          from jsonb_array_elements(p_familia -> 'personas') with ordinality as n (p, i)
          join jsonb_array_elements(v_actual -> 'personas') with ordinality as a (p, i) using (i)
          where (n.p - 'mesaId') <> (a.p - 'mesaId')
            or (n.p -> 'mesaId' is distinct from a.p -> 'mesaId' and coalesce(n.p -> 'mesaId', 'null'::jsonb) <> 'null'::jsonb)
        ) then
        raise exception 'familia_invalida';
      end if;
      update public.familias set datos = p_familia, actualizado = now()
      where evento_id = v_evento and codigo = v_codigo;
    else
      -- Confirmó sin enlace: una familia nueva, sin mesa.
      if p_familia ->> 'grupo' is distinct from 'Confirmó sin enlace'
        or v_pases not between 1 and 12
        or length(coalesce(p_familia ->> 'nombre', '')) not between 1 and 120
        or v_codigo !~ '^[A-Z2-9]{6,8}$'
        or exists (select 1 from jsonb_array_elements(p_familia -> 'personas') p where coalesce(p -> 'mesaId', 'null'::jsonb) <> 'null'::jsonb)
        or (select count(*) from public.familias where evento_id = v_evento) >= 3000 then
        raise exception 'familia_invalida';
      end if;
      insert into public.familias (id, evento_id, codigo, datos) values (p_familia ->> 'id', v_evento, v_codigo, p_familia);
    end if;
    v_familia := p_familia ->> 'id';
  elsif v_codigo <> '' then
    select datos ->> 'id' into v_familia from public.familias where evento_id = v_evento and codigo = v_codigo;
  end if;

  for x in select * from jsonb_array_elements(coalesce(p_actividad, '[]'::jsonb)) loop
    if x ->> 'eventoId' is distinct from v_evento or x ->> 'familiaId' is distinct from v_familia
      or coalesce(x ->> 'tipo', '') not in ('apertura', 'confirmacion', 'no_asiste', 'mensaje', 'familia')
      or length(coalesce(x ->> 'texto', '')) > 200 or coalesce(x ->> 'id', '') !~ '^act_' then
      raise exception 'actividad_invalida';
    end if;
    insert into public.actividad (id, evento_id, datos) values (x ->> 'id', v_evento, x) on conflict (id) do nothing;
  end loop;

  for x in select * from jsonb_array_elements(coalesce(p_mensajes, '[]'::jsonb)) loop
    if x ->> 'eventoId' is distinct from v_evento or x ->> 'familiaId' is distinct from v_familia
      or length(coalesce(x ->> 'texto', '')) not between 1 and 500 or length(coalesce(x ->> 'autor', '')) > 120
      or coalesce(x ->> 'id', '') !~ '^msg_'
      or (select count(*) from public.mensajes where evento_id = v_evento) >= 5000 then
      raise exception 'mensaje_invalido';
    end if;
    insert into public.mensajes (id, evento_id, datos) values (x ->> 'id', v_evento, x) on conflict (id) do nothing;
  end loop;
end;
$$;

revoke execute on function public.es_admin(text) from public, anon;
grant execute on function public.es_admin(text) to authenticated;
grant execute on function public.evento_publico(text) to anon, authenticated;
grant execute on function public.invitado_familia(text, text) to anon, authenticated;
grant execute on function public.correo_autorizado(text, text) to anon, authenticated;
grant execute on function public.invitado_guardar(text, text, jsonb, jsonb, jsonb) to anon, authenticated;
