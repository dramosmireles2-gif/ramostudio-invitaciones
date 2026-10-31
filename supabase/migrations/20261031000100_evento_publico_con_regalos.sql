-- La invitación también lee los regalos que la pareja captura en el panel.
create or replace function public.evento_publico(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', e.id,
    'datos', e.datos,
    'regalos', coalesce((select jsonb_agg(r.datos) from public.regalos r where r.evento_id = e.id), '[]'::jsonb)
  )
  from public.eventos e where e.slug = p_slug;
$$;
