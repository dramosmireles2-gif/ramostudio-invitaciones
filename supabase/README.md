# Supabase de RamoStudio

Un solo proyecto (`ramostudio`, us-east-1) para todas las bodas de clientes; cada
una queda aislada por reglas (RLS). El demo (`mariana-diego`) no usa Supabase.

- `migrations/`: el esquema, en orden. Se aplican con el MCP de Supabase o con
  `supabase db push`.
- La URL y la llave pública (publishable) van en `src/config.js`. Nunca subir la
  llave `service_role` ni contraseñas al repo.

## El panel: una contraseña por boda

Cada boda tiene un usuario de Supabase Auth con un correo interno
`<slug>@paneles.ramostudio.mx` (nunca recibe correos) y una contraseña que se
le entrega a la pareja. En el panel solo escriben la contraseña; la sesión se
queda en ese teléfono o computadora hasta "Cerrar sesión".

La contraseña: dos palabras y un número (p. ej. `Palabra-Palabra-00`), nunca
derivada de los nombres ni de la fecha. Entrada del panel:
`<dominio>/panel/?e=<slug>`.

## Agregar una boda

En el SQL editor (cambiar `<id>`, `<slug>` y `<contraseña>`; la contraseña no se
guarda en ningún archivo):

```sql
insert into public.eventos (id, slug) values ('<id de evento.json>', '<slug>');

do $$
declare
  v_id uuid := gen_random_uuid();
  v_correo text := '<slug>@paneles.ramostudio.mx';
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_correo,
    extensions.crypt('<contraseña>', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_correo, 'email_verified', true), 'email', now(), now(), now());
  insert into public.evento_admins (evento_id, correo) values ('<id>', v_correo);
end $$;
```

Cambiar la contraseña de una boda:

```sql
update auth.users set encrypted_password = extensions.crypt('<nueva>', extensions.gen_salt('bf'))
where email = '<slug>@paneles.ramostudio.mx';
```

Sin fila en `eventos`, la invitación funciona pero no guarda.
