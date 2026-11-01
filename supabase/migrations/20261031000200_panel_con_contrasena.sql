-- El panel entra con la contraseña de la boda (un usuario por evento), ya no
-- con un código al correo: esta función ya no se usa.
drop function if exists public.correo_autorizado(text, text);
