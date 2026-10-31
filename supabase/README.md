# Supabase de RamoStudio

Un solo proyecto (`ramostudio`, us-east-1) para todas las bodas de clientes; cada
una queda aislada por reglas (RLS). El demo (`mariana-diego`) no usa Supabase.

- `migrations/`: el esquema, en orden. Se aplican con el MCP de Supabase o con
  `supabase db push`.
- La URL y la llave pública (publishable) van en `src/config.js`. Nunca subir la
  llave `service_role` ni secretos al repo.

## Agregar una boda

```sql
insert into public.eventos (id, slug) values ('<id de evento.json>', '<slug>');
insert into public.evento_admins (evento_id, correo) values ('<id>', '<correo de la novia en minúsculas>');
```

Cada correo de `evento_admins` entra al panel de ese evento con un código que le
llega por correo. Sin fila en `eventos`, la invitación funciona pero no guarda.

## Correo (pendiente de configurar en el dashboard)

- Authentication → Emails → plantilla "Magic Link": debe incluir `{{ .Token }}`
  (el código de 6 números que la pareja escribe en el panel).
- El servidor de correo incluido en Supabase solo manda a los correos del equipo
  del proyecto y unos pocos por hora: para clientes hay que poner un SMTP propio
  (Authentication → Emails → SMTP Settings).
