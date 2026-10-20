-- Aula Sierra: la guía de prompts reemplaza a WhatsApp Business como actividad 2.
-- WhatsApp se oculta (no se borra): sus borradores y entregas se conservan para el instructor.
begin;
update public.workshop_forms set position = 2 where id = 'guia-prompts';
update public.workshop_forms set position = 98, is_published = false where id = 'whatsapp';
notify pgrst,'reload schema';
commit;
