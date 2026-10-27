-- Aula Sierra: instalación y actualización completa del curso.
begin;
-- Ejecutar setup.sql (generado), NO esta plantilla, en Supabase SQL Editor.


create table if not exists public.workshop_forms (
  id text primary key,
  title text not null,
  version integer not null,
  definition jsonb not null
);

create table if not exists public.workshop_responses (
  id uuid primary key,
  form_id text not null references public.workshop_forms(id),
  form_version integer not null,
  submitted_at timestamptz not null default now(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null default '' check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 30),
  business text not null default '' check (char_length(business) <= 160),
  municipality text not null default '' check (char_length(municipality) <= 120),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  questions text not null default '' check (char_length(questions) <= 2000),
  consent_at timestamptz not null default now(),
  privacy_version text not null default '2026-10-19'
);
create index if not exists workshop_responses_form_date on public.workshop_responses (form_id, submitted_at desc);

alter table public.workshop_forms enable row level security;
alter table public.workshop_responses enable row level security;
revoke all on table public.workshop_forms, public.workshop_responses from public, anon, authenticated;
-- No policies: participants cannot read, update, delete, or directly insert records.
-- The instructor uses Supabase Table Editor with their own authenticated dashboard.

insert into public.workshop_forms (id, title, version, definition) values
('diagnostico', 'Evaluación diagnóstica', 1, '{"questions":[{"id":"d1","number":1,"label":"¿Tienes celular con WhatsApp?","options":["Sí","No"],"type":"radio","required":true},{"id":"d2","number":2,"label":"¿Usas WhatsApp para atender a tus clientes?","options":["Sí","No"],"type":"radio","required":true},{"id":"d3","number":3,"label":"¿Tienes WhatsApp Business?","options":["Sí","No"],"type":"radio","required":true},{"id":"d4","number":4,"label":"¿Sabes usar una computadora?","options":["Sí","No"],"type":"radio","required":true},{"id":"d5","number":5,"label":"¿Has escuchado hablar de la inteligencia artificial?","options":["Sí","No"],"type":"radio","required":true},{"id":"d6","number":6,"label":"¿Has usado ChatGPT, Gemini o Claude?","options":["Sí","No"],"type":"radio","required":true},{"id":"d7","number":7,"label":"¿Tu negocio tiene página de Facebook o cuenta de Instagram?","options":["Sí","No"],"type":"radio","required":true},{"id":"d8","number":8,"label":"¿Tu negocio aparece en Google Maps?","options":["Sí","No"],"type":"radio","required":true},{"id":"d9","number":9,"label":"¿Alguna vez has usado mensajes automáticos (bienvenida o ausencia)?","options":["Sí","No"],"type":"radio","required":true},{"id":"d10","number":10,"label":"¿Te escriben clientes de noche o en tu día de descanso?","options":["Sí","No"],"type":"radio","required":true},{"id":"d11","number":1,"label":"¿Qué es lo que más te preguntan tus clientes por mensaje?","hint":"","type":"text","required":true},{"id":"d12","number":2,"label":"¿Más o menos cuántos mensajes recibes al día?","hint":"","type":"text","required":true},{"id":"d13","number":3,"label":"¿Quién contesta los mensajes en tu negocio?","hint":"","type":"text","required":true},{"id":"d14","number":4,"label":"¿Qué te gustaría que la inteligencia artificial hiciera por tu negocio?","hint":"","type":"text","required":true}],"uploads":[]}'::jsonb),
('guia-prompts', 'Guía para mejorar tus prompts', 1, '{"questions":[{"id":"g1","number":1,"label":"¿Qué le falta al prompt básico?","options":["Quién eres y dónde está tu negocio","Qué ofreces y a qué precio","Qué mensaje necesitas y para quién","El tono","El formato o el largo"],"type":"multi","required":false},{"id":"g2","number":2,"label":"¿Cómo está enfocado el prompt básico? ¿Qué le agregarías?","hint":"","type":"text","required":false},{"id":"g3","number":3,"label":"¿Quién eres?","hint":"Ej. Soy dueña de Cabañas El Mirador en Pinal de Amoles.","type":"text","required":false},{"id":"g4","number":4,"label":"¿Qué ofreces?","hint":"Ej. Cabañas para 4 personas a $1,200 la noche con desayuno.","type":"text","required":false},{"id":"g5","number":5,"label":"¿Qué necesitas que haga la IA?","hint":"Ej. 3 mensajes para invitar a familias a ver el mar de nubes.","type":"text","required":false},{"id":"g6","number":6,"label":"¿Qué tono quieres?","options":["Amable y cercano","Formal","Divertido","Breve y directo"],"type":"radio","required":false},{"id":"g7","number":7,"label":"¿Qué formato quieres?","options":["Mensaje corto de WhatsApp (máximo 3 líneas)","Publicación para Facebook o Instagram","Lista con viñetas","Tabla"],"type":"radio","required":false},{"id":"g8","number":8,"label":"Tu prompt mejorado","hint":"Toca «Armar mi prompt» y revisa que tenga los 5 ingredientes.","type":"text","required":false,"builder":true,"meter":true},{"id":"g11","number":11,"label":"¿Qué cambió en la respuesta?","hint":"","type":"text","required":false},{"id":"g12","number":12,"label":"Mejora: «Hazme una publicación para Facebook.»","hint":"","type":"text","required":false,"meter":true},{"id":"g13","number":13,"label":"Mejora: «¿Cuánto debo cobrar?»","hint":"","type":"text","required":false,"meter":true},{"id":"g14","number":14,"label":"Mejora: «Contesta a un cliente que pregunta si hay lugar.»","hint":"","type":"text","required":false,"meter":true}],"uploads":["g9","g10"]}'::jsonb),
('whatsapp', 'WhatsApp Business', 1, '{"questions":[{"id":"w1","number":1,"label":"Mensaje de bienvenida","hint":"En WhatsApp Business → Herramientas → Mensaje de bienvenida, activa y guarda tu saludo.","type":"text","required":false},{"id":"w2","number":2,"label":"Mensaje de ausencia y horario","hint":"Activa el mensaje de ausencia fuera del horario comercial y pon tu horario real en Editar perfil.","type":"text","required":false},{"id":"w3","number":3,"label":"/precios","hint":"","type":"text","required":false},{"id":"w4","number":4,"label":"/ubicacion","hint":"","type":"text","required":false},{"id":"w5","number":5,"label":"/horario","hint":"","type":"text","required":false},{"id":"w6","label":"Bienvenida activa","type":"check","required":false},{"id":"w7","label":"Ausencia activa","type":"check","required":false},{"id":"w8","label":"Horario real en el perfil","type":"check","required":false},{"id":"w9","label":"3 respuestas rápidas guardadas","type":"check","required":false},{"id":"w10","label":"Captura enviada al grupo","type":"check","required":false}],"uploads":[]}'::jsonb),
('chatgpt', 'ChatGPT y prompts', 1, '{"questions":[{"id":"c1","number":1,"label":"¿La respuesta fue correcta? ¿Faltó algún lugar?","hint":"","type":"text","required":false},{"id":"c2","number":2,"label":"Tus respuestas rápidas","hint":"Espacio para registrar las tres respuestas que preparaste.","type":"text","required":false},{"id":"c3","number":3,"label":"Mi mensaje elegido","hint":"","type":"text","required":false},{"id":"c4","label":"Escribí mi primer prompt","type":"check","required":false},{"id":"c5","label":"Guardé 3 respuestas rápidas","type":"check","required":false},{"id":"c6","label":"Mejoré mi bienvenida o ausencia con IA","type":"check","required":false}],"uploads":[]}'::jsonb),
('meta', 'Meta Business Suite', 1, '{"questions":[{"id":"m1","number":2,"label":"¿Qué redes conectaste?","options":["Facebook","Instagram","Facebook e Instagram","No aplica: mi negocio no tiene estas cuentas"],"type":"radio","required":false},{"id":"m9","number":4,"label":"¿Qué publicaste y para qué fecha la programaste?","hint":"","type":"text","required":false}],"uploads":["m7","m8","m10"]}'::jsonb),
('agente-ia', 'Chatbot personalizado para WhatsApp', 1, '{"questions":[{"id":"a1","number":1,"label":"¿Qué tipo de negocio tienes?","options":["Hospedaje (hotel, cabañas, posada)","Restaurante o cocina típica","Recorridos o tours","Guía turístico","Transporte","Otro"],"type":"radio","required":false},{"id":"a1_other","type":"text","required":false,"max":300},{"id":"a2","number":2,"label":"¿Cómo se llama tu negocio?","hint":"","type":"text","required":false},{"id":"a3","number":3,"label":"¿Dónde está?","hint":"Dirección, punto de encuentro o una referencia para llegar.","type":"text","required":false},{"id":"a4","number":4,"label":"¿En qué horario atiendes tú?","hint":"","type":"text","required":false},{"id":"a5","number":5,"label":"¿Cuál es tu teléfono y tus redes sociales?","hint":"","type":"text","required":false},{"id":"a6","number":6,"label":"¿Qué servicios vendes?","hint":"Por cada uno escribe: nombre, precio, qué incluye y cuánto dura.","type":"text","required":false},{"id":"a7","number":7,"label":"¿Los niños pagan diferente? ¿Desde qué edad?","hint":"","type":"text","required":false},{"id":"a8","number":8,"label":"¿Qué servicios recomiendas más y a quién?","hint":"Por ejemplo: familias, parejas, grupos, gente que viene de lejos.","type":"text","required":false},{"id":"a9","number":9,"label":"¿Cómo te pagan?","options":["Efectivo","Tarjeta","Transferencia","Otro"],"type":"multi","required":false},{"id":"a9_other","type":"text","required":false,"max":300},{"id":"a10","number":10,"label":"¿Pides anticipo? ¿De cuánto?","hint":"","type":"text","required":false},{"id":"a11","number":11,"label":"¿Qué pasa si un cliente cancela?","hint":"","type":"text","required":false},{"id":"a12","number":12,"label":"¿Qué pasa si llueve o el clima no deja dar el servicio?","hint":"","type":"text","required":false},{"id":"a13","number":13,"label":"¿Tienes promociones?","hint":"","type":"text","required":false},{"id":"a14","number":14,"label":"¿Cómo se llega? ¿Hay estacionamiento?","hint":"","type":"text","required":false},{"id":"a15","number":15,"label":"¿Qué deben llevar tus clientes?","hint":"","type":"text","required":false},{"id":"a16","number":16,"label":"¿Aceptas mascotas? ¿Pueden ir niños?","hint":"","type":"text","required":false},{"id":"a17","number":17,"label":"¿Qué otra pregunta te hacen mucho y qué contestas?","hint":"","type":"text","required":false},{"id":"a18","number":18,"label":"¿Qué datos debe pedirle al cliente?","options":["Nombre","Adultos y niños","Fecha de visita","De dónde viene","Servicio que le interesa","Número de personas","Otro"],"type":"multi","required":false},{"id":"a18_other","type":"text","required":false,"max":300},{"id":"a19","number":19,"label":"¿En qué casos debe pasarte la conversación?","options":["Quiere reservar o pagar","Grupo de más de ____ personas","Pide hablar con una persona","Tiene una queja o quiere cancelar","Pide descuento","Hay una emergencia"],"type":"multi","required":false},{"id":"a19_group","type":"text","required":false,"max":300},{"id":"a20","number":20,"label":"¿Cómo quieres que hable?","options":["Amable y cercano","Con emojis (máximo 2)","Formal","Sin emojis"],"type":"multi","required":false},{"id":"a21","number":21,"label":"¿Dónde hiciste la prueba?","options":["WhatsApp: chatbot configurado","Simulación con IA: herramienta de WhatsApp no disponible"],"type":"radio","required":false},{"id":"a22","number":22,"label":"Resultado de la prueba y ajustes","hint":"Registra qué contestó, cuándo pasó la conversación a una persona y qué corregiste.","type":"text","required":false}],"uploads":["a23","a24"]}'::jsonb),
('pinal-temporadas', '¿Cuándo vienen los turistas a Pinal?', 1, '{"questions":[{"id":"t1","number":1,"label":"¿Qué mes tiene el pico más alto?","hint":"","type":"text","required":false},{"id":"t4","number":4,"label":"¿Qué ofreces en tu promoción?","hint":"","type":"text","required":false},{"id":"t5","number":5,"label":"¿Cuándo la publicarías?","hint":"","type":"text","required":false}],"uploads":["t2","t3"]}'::jsonb),
('pinal-competencia', 'Investiga a tu competencia con IA', 1, '{"questions":[{"id":"k2","number":2,"label":"¿Qué precios confirmaste? ¿Coincidían con la tabla?","hint":"","type":"text","required":false},{"id":"k4","number":4,"label":"¿En qué te puedes diferenciar de ellos?","hint":"","type":"text","required":false}],"uploads":["k1","k3"]}'::jsonb),
('pinal-precios', '¿Cuánto deberías cobrar?', 1, '{"questions":[{"id":"r1","number":1,"label":"Tus costos por servicio","hint":"Escribe cada costo y el total.","type":"text","required":false},{"id":"r2","number":2,"label":"¿Cuánto quieres ganar? (margen en %)","hint":"","type":"text","required":false},{"id":"r3","number":3,"label":"¿Cuánto pagas de comisión? (Booking, Airbnb, tarjeta, en %)","hint":"","type":"text","required":false},{"id":"r5","number":5,"label":"Precio en temporada baja","hint":"","type":"text","required":false},{"id":"r6","number":6,"label":"Precio en temporada media","hint":"","type":"text","required":false},{"id":"r7","number":7,"label":"Precio en temporada alta","hint":"","type":"text","required":false}],"uploads":["r4","r8"]}'::jsonb),
('pinal-estrategia', 'Tu estrategia para atraer clientes', 1, '{"questions":[{"id":"e2","number":2,"label":"Acción 1","hint":"","type":"text","required":false},{"id":"e3","number":3,"label":"Acción 2","hint":"","type":"text","required":false},{"id":"e4","number":4,"label":"Acción 3","hint":"","type":"text","required":false}],"uploads":["e1"]}'::jsonb),
('pinal-cierre', 'Cierre · Mi estrategia turística con IA', 1, '{"questions":[{"id":"z1","number":1,"label":"¿Qué tipo de negocio tienes?","hint":"","type":"text","required":false},{"id":"z2","number":2,"label":"¿Qué descubrí de mi competencia o de la demanda?","hint":"","type":"text","required":false},{"id":"z3","number":3,"label":"¿Qué precio o estrategia voy a probar?","hint":"","type":"text","required":false},{"id":"z4","number":4,"label":"¿Qué acción aplicaré en mi negocio?","hint":"","type":"text","required":false}],"uploads":["z5"]}'::jsonb),
('sesion2-precios', 'Mi tabla de precios por temporada', 1, '{"questions":[{"id":"sp1","number":1,"label":"Nombre y tipo de mi negocio","hint":"","type":"text","required":false},{"id":"sp2","number":2,"label":"Mi localidad y el atractivo más cercano","hint":"","type":"text","required":false},{"id":"sp3","number":3,"label":"Mis meses con más clientes y con menos clientes","hint":"","type":"text","required":false},{"id":"sp4","number":4,"label":"Mis precios entre semana, de fin de semana y lo que incluyo","hint":"","type":"text","required":false},{"id":"sp5","number":5,"label":"Mis costos por cada servicio vendido","hint":"Limpieza y lavandería; luz, gas y agua; insumos; mantenimiento; ayuda y otros. Anota cada importe.","type":"text","required":false},{"id":"sp6","number":6,"label":"Mi ganancia deseada sobre la venta y mi comisión, en %","hint":"Si vendes directo sin comisión, anota 0 en comisión.","type":"text","required":false},{"id":"sp8","number":8,"label":"Mis costos totales","hint":"","type":"text","required":false},{"id":"sp9","number":9,"label":"Mi precio mínimo y la cuenta paso a paso","hint":"","type":"text","required":false},{"id":"sp10","number":10,"label":"Mi tabla de precios de temporada baja, media y alta","hint":"Incluye el precio y la explicación de cada uno.","type":"text","required":false},{"id":"sp11","number":11,"label":"Mi promoción de temporada baja sin perder dinero","hint":"","type":"text","required":false}],"uploads":["sp7","sp12"]}'::jsonb),
('sesion2-competencia', 'Compara mi negocio con 3 competidores', 1, '{"questions":[{"id":"sc1","number":1,"label":"Mi negocio y los precios que voy a comparar","hint":"","type":"text","required":false},{"id":"sc2","number":2,"label":"Mi tabla con al menos 3 competidores y enlaces","hint":"Por negocio: nombre, precio entre semana, precio de fin de semana, qué incluye y enlace de cada precio.","type":"text","required":false},{"id":"sc3","number":3,"label":"¿Estoy caro, en el promedio o barato? ¿Por cuánto?","hint":"","type":"text","required":false},{"id":"sc4","number":4,"label":"Qué ofrecen ellos que yo no y qué ofrezco yo que ellos no","hint":"","type":"text","required":false},{"id":"sc5","number":5,"label":"Mis 3 ideas para diferenciarme sin bajar mi precio","hint":"","type":"text","required":false},{"id":"sc6","number":6,"label":"Precios no encontrados y datos que debo confirmar","hint":"","type":"text","required":false}],"uploads":["sc7"]}'::jsonb),
('sesion2-temporadas', 'Mi calendario de temporadas y plan final', 1, '{"questions":[{"id":"st1","number":1,"label":"Mi calendario de los 12 meses","hint":"Marca alta, media o baja en cada mes y explica en qué datos te basaste.","type":"text","required":false},{"id":"st2","number":2,"label":"Vacaciones, puentes, fiestas de Pinal y mar de nubes","hint":"Anota el año, las fuentes y lo que todavía falta confirmar.","type":"text","required":false},{"id":"st3","number":3,"label":"Cuándo publicaré mis promociones antes de cada temporada alta","hint":"","type":"text","required":false},{"id":"st4","number":5,"label":"Mi tabla final: temporada, meses, precio y promoción","hint":"","type":"text","required":false},{"id":"st5","number":6,"label":"Lo que debo confirmar antes de aplicar mi plan","hint":"","type":"text","required":false}],"uploads":["st6","st7"]}'::jsonb),
('prompt-conjunto', 'Crea el prompt conjunto', 1, '{"questions":[{"id":"pc_prompt","label":"Tu prompt conjunto con los datos de tu negocio","hint":"","type":"text","required":false},{"id":"pc_precios","label":"Parte 1 · Costos, precio mínimo y tabla de precios por temporada","hint":"","type":"text","required":false},{"id":"pc_competencia","label":"Parte 2 · Comparación con al menos 3 competidores y enlaces","hint":"Si no hay un precio publicado, escribe «No encontrado».","type":"text","required":false},{"id":"pc_temporadas","label":"Parte 3 · Temporadas y tabla final de precios y promociones","hint":"","type":"text","required":false},{"id":"pc_revision","label":"¿Qué datos corregiste o necesitas confirmar?","hint":"","type":"text","required":false}],"uploads":["pc_trends","pc_resultado"]}'::jsonb),
('calendario-contenido', 'Calendario de contenido', 1, '{"questions":[{"id":"cc_semana","label":"Semana y 3 o 4 días que elegiste","hint":"","type":"text","required":false},{"id":"cc_calendario","label":"Tu calendario de contenido","hint":"Pega la tabla o adjúntala abajo. Cada día debe incluir foto o flyer, copy y llamado a la acción.","type":"text","required":false},{"id":"cc_dias","label":"Hay 3 o 4 publicaciones con fecha y red social","type":"check","required":false},{"id":"cc_contenido","label":"Cada publicación tiene tema, imagen, texto y llamado a la acción","type":"check","required":false},{"id":"cc_datos","label":"Revisé fechas, precios, servicios y testimonios","type":"check","required":false}],"uploads":["cc_archivo"]}'::jsonb),
('flyers-ia', 'Flyers hechos con IA', 1, '{"questions":[{"id":"fi_prompt","label":"El prompt que usaste para crear tu flyer","hint":"","type":"text","required":false},{"id":"fi_calendario","label":"¿En qué día de tu calendario usarás este flyer?","hint":"","type":"text","required":false},{"id":"fi_cambios","label":"¿Qué corregiste en el diseño o en el texto?","hint":"","type":"text","required":false},{"id":"fi_real","label":"Las fotos, servicios, oferta y precio corresponden a mi negocio","type":"check","required":false},{"id":"fi_legible","label":"El título y el contacto se leen bien en celular","type":"check","required":false},{"id":"fi_revision","label":"Revisé ortografía, precio y teléfono","type":"check","required":false}],"uploads":["fi_flyer"]}'::jsonb),
('tema4-perfiles', 'Perfil turístico: Google Maps, TripAdvisor o Airbnb', 1, '{"questions":[{"id":"pi_plataforma","label":"¿En qué plataforma harás tu perfil?","options":["Google Maps","TripAdvisor","Airbnb"],"type":"radio","required":false},{"id":"pi_palabras","number":2,"label":"Tus 10 palabras clave","hint":"","type":"text","required":false},{"id":"pi_resena5","number":3,"label":"Tu respuesta a una reseña de 5 estrellas","hint":"","type":"text","required":false},{"id":"pi_resena2","number":4,"label":"Tu respuesta a una reseña de 2 estrellas","hint":"Por el camino o por el precio. Responde con amabilidad y sin discutir.","type":"text","required":false},{"id":"pi_fotos","number":5,"label":"Las 10 fotos que subirás, en orden","hint":"","type":"text","required":false},{"id":"pi_google","number":6,"label":"Tu descripción de Google Maps","hint":"Máximo 750 caracteres. Copia el texto de tu ficha y revisa que todo sea verdad.","type":"text","required":false,"max":750},{"id":"pi_maps_nombre","label":"Nombre real y categoría correcta","type":"check","required":false},{"id":"pi_maps_horario","label":"Horario, también días festivos","type":"check","required":false},{"id":"pi_maps_contacto","label":"WhatsApp o teléfono","type":"check","required":false},{"id":"pi_maps_ubicacion","label":"Ubicación exacta","type":"check","required":false},{"id":"pi_maps_fotos","label":"10 fotos o más","type":"check","required":false},{"id":"pi_maps_resenas","label":"Reseñas respondidas","type":"check","required":false},{"id":"pi_modalidad","label":"¿Cómo harás la actividad de Airbnb?","options":["Tengo hospedaje: anuncio real","No tengo hospedaje: borrador de práctica, sin publicar"],"type":"radio","required":false},{"id":"pi_airbnb_titulo","number":9,"label":"Tu título de Airbnb","hint":"Máximo 50 caracteres.","type":"text","required":false,"max":50},{"id":"pi_airbnb_descripcion","number":10,"label":"Tu descripción de Airbnb","hint":"Máximo 500 caracteres.","type":"text","required":false,"max":500},{"id":"pi_airbnb_espacio","number":11,"label":"El espacio: cómo es tu lugar","hint":"","type":"text","required":false},{"id":"pi_airbnb_servicios","number":12,"label":"Tus 10 servicios y 5 reglas de la casa","hint":"Usa lo que preparaste en tu ficha. No inventes servicios.","type":"text","required":false},{"id":"pi_airbnb_precio","number":13,"label":"Tipo de lugar, capacidad y precio por noche","hint":"","type":"text","required":false},{"id":"pi_airbnb_fotos","label":"Agregué al menos 5 fotos","type":"check","required":false},{"id":"pi_airbnb_estado","label":"Estado de tu anuncio","options":["Publicado: hospedaje real","Borrador: hospedaje real","Borrador de práctica: sin hospedaje, no publicado"],"type":"radio","required":false},{"id":"pi_revision_descripcion","label":"La descripción dice qué es, dónde está y qué lo hace especial.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_palabras","label":"Usa palabras clave como Pinal de Amoles o Sierra Gorda.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_limites","label":"Respeta los límites de caracteres.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_fotos","label":"Tiene las fotos reales solicitadas para la plataforma elegida.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_resenas","label":"Las respuestas a reseñas son amables y sin discutir.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_verdad","label":"Todo es verdad: precios, horario y servicios.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_pendientes","number":16,"label":"¿Qué te falta terminar de tarea?","hint":"Si ya terminaste todo, puedes dejarlo en blanco.","type":"text","required":false}],"uploads":["pi_ficha","pi_maps_antes","pi_maps_despues","pi_airbnb_captura","pi_tripadvisor"]}'::jsonb)
on conflict (id) do update set title = excluded.title, version = excluded.version, definition = excluded.definition;

-- This deliberately narrow SECURITY DEFINER function is the only participant write path.
-- It validates against the server-side catalog and never returns personal information.
create or replace function public.submit_workshop_response(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity public.workshop_forms%rowtype;
  person jsonb;
  answers jsonb;
  q jsonb;
  answer jsonb;
  option_value jsonb;
  submission_id uuid;
  key text;
  limit_size integer;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text) > 60000 then
    raise exception 'Invalid submission' using errcode = '22023';
  end if;
  if (p_payload->>'id') is null or (p_payload->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'Invalid submission id' using errcode = '22023';
  end if;
  submission_id := (p_payload->>'id')::uuid;
  select * into activity from public.workshop_forms where id = p_payload->>'form_id';
  if not found or p_payload->'version' is distinct from to_jsonb(activity.version) then
    raise exception 'Invalid activity' using errcode = '22023';
  end if;
  person := p_payload->'participant';
  answers := p_payload->'answers';
  if jsonb_typeof(person) is distinct from 'object' or jsonb_typeof(answers) is distinct from 'object' or p_payload->'consent' is distinct from 'true'::jsonb then
    raise exception 'Invalid participant, answers or consent' using errcode = '22023';
  end if;
  if jsonb_typeof(person->'name') is distinct from 'string' or char_length(btrim(person->>'name')) not between 2 and 120 then
    raise exception 'Invalid name' using errcode = '22023';
  end if;
  foreach key in array array['email', 'phone', 'business', 'municipality'] loop
    limit_size := case key when 'email' then 254 when 'phone' then 30 when 'business' then 160 else 120 end;
    if person ? key and (jsonb_typeof(person->key) is distinct from 'string' or char_length(person->>key) > limit_size) then
      raise exception 'Invalid contact information' using errcode = '22023';
    end if;
  end loop;
  if coalesce(person->>'email', '') <> '' and person->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid email' using errcode = '22023';
  end if;
  if coalesce(person->>'phone', '') <> '' and (person->>'phone' !~ '^[+()0-9 .-]+$' or char_length(regexp_replace(person->>'phone', '[^0-9]', '', 'g')) < 7) then
    raise exception 'Invalid phone' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload->'questions') is distinct from 'string' or char_length(p_payload->>'questions') > 2000 then
    raise exception 'Invalid questions' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_object_keys(answers) as incoming(key)
    where not exists (select 1 from jsonb_array_elements(activity.definition->'questions') as known(q) where known.q->>'id' = incoming.key)
  ) then
    raise exception 'Unknown answer' using errcode = '22023';
  end if;

  for q in select value from jsonb_array_elements(activity.definition->'questions') loop
    key := q->>'id';
    if not answers ? key then
      if (q->>'required')::boolean then raise exception 'Missing required answer' using errcode = '22023'; end if;
      continue;
    end if;
    answer := answers->key;
    case q->>'type'
      when 'text' then
        if jsonb_typeof(answer) is distinct from 'string' or char_length(answers->>key) > coalesce((q->>'max')::integer, 4000) or (coalesce((q->>'required')::boolean, false) and btrim(answers->>key) = '') then
          raise exception 'Invalid text answer' using errcode = '22023';
        end if;
      when 'radio' then
        if jsonb_typeof(answer) is distinct from 'string' or not (q->'options' @> jsonb_build_array(answer)) then
          raise exception 'Invalid selected option' using errcode = '22023';
        end if;
      when 'multi' then
        if jsonb_typeof(answer) is distinct from 'array' then raise exception 'Invalid options' using errcode = '22023'; end if;
        if jsonb_array_length(answer) > jsonb_array_length(q->'options') or (select count(distinct value) from jsonb_array_elements(answer)) <> jsonb_array_length(answer) then
          raise exception 'Invalid options' using errcode = '22023';
        end if;
        for option_value in select value from jsonb_array_elements(answer) loop
          if not (q->'options' @> jsonb_build_array(option_value)) then raise exception 'Invalid selected option' using errcode = '22023'; end if;
        end loop;
      when 'check' then
        if jsonb_typeof(answer) is distinct from 'boolean' then raise exception 'Invalid checkbox' using errcode = '22023'; end if;
      else raise exception 'Invalid question type' using errcode = '22023';
    end case;
  end loop;

  insert into public.workshop_responses (id, form_id, form_version, full_name, email, phone, business, municipality, answers, questions)
  values (submission_id, activity.id, activity.version, btrim(person->>'name'), coalesce(person->>'email', ''), coalesce(person->>'phone', ''), coalesce(person->>'business', ''), coalesce(person->>'municipality', ''), answers, p_payload->>'questions')
  on conflict (id) do nothing;
  -- A receipt confirms these exact answers, including after a timed-out first request.
  if not exists (
    select 1 from public.workshop_responses r where r.id = submission_id
      and r.form_id = activity.id and r.form_version = activity.version
      and r.full_name = btrim(person->>'name')
      and r.email = coalesce(person->>'email', '') and r.phone = coalesce(person->>'phone', '')
      and r.business = coalesce(person->>'business', '') and r.municipality = coalesce(person->>'municipality', '')
      and r.answers = p_payload->'answers' and r.questions = p_payload->>'questions'
  ) then
    raise exception 'This submission id already has different answers' using errcode = '23505';
  end if;
  return jsonb_build_object('saved', true, 'id', submission_id);
end;
$$;
revoke all on function public.submit_workshop_response(jsonb) from public, anon, authenticated;
grant execute on function public.submit_workshop_response(jsonb) to anon, authenticated;
comment on function public.submit_workshop_response(jsonb) is 'Insert-only workshop submissions. Validated server-side; no PII returned. UUID retries are idempotent.';
notify pgrst, 'reload schema';


-- Aula Sierra v2: acceso con usuario y PIN. Ejecutar después del SQL inicial. Conserva todas las entregas.


create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

alter table public.workshop_forms add column if not exists position integer not null default 0;
alter table public.workshop_forms add column if not exists is_published boolean not null default true;
alter table public.workshop_forms add column if not exists due_at timestamptz;
update public.workshop_forms set position = case id when 'diagnostico' then 1 when 'whatsapp' then 2 when 'chatgpt' then 3 when 'meta' then 4 when 'agente-ia' then 5 else 99 end;

-- Retira la versión anterior basada en correo (si llegó a instalarse); sus tablas se conservan.
drop function if exists public.course_context();
drop function if exists public.save_course_activity(jsonb,integer,integer);
drop function if exists public.complete_course_activity(jsonb,integer);
drop function if exists public.set_course_activity(text,boolean,timestamptz);
drop policy if exists course_activity_read on public.workshop_forms;
drop policy if exists course_response_read on public.workshop_responses;
revoke all on public.workshop_forms,public.workshop_responses from public,anon,authenticated;

create table if not exists public.aula_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$'),
  pin_hash text not null,
  role text not null default 'student' check (role in ('student','instructor')),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null default '' check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 30),
  business text not null default '' check (char_length(business) <= 160),
  municipality text not null default '' check (char_length(municipality) <= 120),
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.aula_sessions (
  token_hash bytea primary key,
  user_id uuid not null references public.aula_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists aula_sessions_user on public.aula_sessions(user_id);
create table if not exists public.aula_work (
  user_id uuid not null references public.aula_users(id) on delete cascade,
  form_id text not null references public.workshop_forms(id),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  step integer not null default 0 check (step between 0 and 2),
  revision integer not null default 1 check (revision > 0),
  status text not null default 'draft' check (status in ('draft','submitted')),
  saved_at timestamptz not null default now(),
  submitted_at timestamptz,
  response_id uuid references public.workshop_responses(id),
  primary key(user_id,form_id),
  check ((status = 'submitted') = (submitted_at is not null and response_id is not null))
);
create index if not exists aula_work_form_status on public.aula_work(form_id,status);
create table if not exists public.aula_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.aula_users(id) on delete cascade,
  form_id text not null references public.workshop_forms(id),
  name text not null check (char_length(name) between 1 and 160),
  mime text not null,
  size integer not null check (size between 1 and 5242880),
  data bytea not null,
  created_at timestamptz not null default now()
);
create index if not exists aula_files_owner on public.aula_files(user_id,form_id);
alter table public.aula_files enable row level security;
revoke all on public.aula_files from public,anon,authenticated;
alter table public.workshop_responses add column if not exists student_id uuid references public.aula_users(id) on delete set null;
create index if not exists workshop_responses_student on public.workshop_responses(student_id);
alter table public.aula_users enable row level security;
alter table public.aula_sessions enable row level security;
alter table public.aula_work enable row level security;
-- Sin políticas: el navegador solo accede mediante las funciones de abajo.
revoke all on public.aula_users,public.aula_sessions,public.aula_work from public,anon,authenticated;

create or replace function public.aula_open_session(p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  token text := encode(extensions.gen_random_bytes(32),'hex');
  account public.aula_users%rowtype;
begin
  delete from public.aula_sessions where user_id = p_user and expires_at < now();
  insert into public.aula_sessions(token_hash,user_id,expires_at) values(sha256(convert_to(token,'UTF8')),p_user,now() + interval '30 days');
  select * into account from public.aula_users where id = p_user;
  return jsonb_build_object('ok',true,'token',token,'user',jsonb_build_object('id',account.id,'username',account.username));
end;
$$;

create or replace function public.aula_session_user(p_token text) returns public.aula_users
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype;
  hashed bytea;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Session required' using errcode = 'PT401'; end if;
  hashed := sha256(convert_to(p_token,'UTF8'));
  select u.* into account from public.aula_sessions s join public.aula_users u on u.id = s.user_id where s.token_hash = hashed and s.expires_at > now();
  if not found then raise exception 'Session expired' using errcode = 'PT401'; end if;
  update public.aula_sessions set expires_at = now() + interval '30 days' where token_hash = hashed and expires_at < now() + interval '29 days';
  return account;
end;
$$;

create or replace function public.aula_require_instructor(p_token text) returns public.aula_users
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_session_user(p_token);
begin
  if account.role <> 'instructor' then raise exception 'Instructor required' using errcode = 'PT403'; end if;
  return account;
end;
$$;

-- Los errores de acceso se devuelven como resultado (no excepción) para que el contador de intentos se conserve.
create or replace function public.course_register(p_username text,p_full_name text,p_pin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  name text := lower(btrim(coalesce(p_username,'')));
  created uuid;
begin
  if name !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then return jsonb_build_object('ok',false,'error','invalid_username'); end if;
  if char_length(btrim(coalesce(p_full_name,''))) not between 2 and 120 then return jsonb_build_object('ok',false,'error','invalid_name'); end if;
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then return jsonb_build_object('ok',false,'error','invalid_pin'); end if;
  insert into public.aula_users(username,full_name,pin_hash) values(name,btrim(p_full_name),extensions.crypt(p_pin,extensions.gen_salt('bf',8)))
  on conflict(username) do nothing returning id into created;
  if created is null then return jsonb_build_object('ok',false,'error','username_taken'); end if;
  return public.aula_open_session(created);
end;
$$;

create or replace function public.course_login(p_username text,p_pin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype;
begin
  select * into account from public.aula_users where username = lower(btrim(coalesce(p_username,''))) for update;
  if not found then
    perform extensions.crypt(coalesce(p_pin,''),extensions.gen_salt('bf',8));
    return jsonb_build_object('ok',false,'error','invalid_credentials');
  end if;
  if account.locked_until > now() then
    return jsonb_build_object('ok',false,'error','locked','retry_after',ceil(extract(epoch from account.locked_until - now())));
  end if;
  if p_pin is null or account.pin_hash <> extensions.crypt(p_pin,account.pin_hash) then
    -- Cinco intentos fallidos bloquean la cuenta 15 minutos.
    update public.aula_users set
      locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end,
      failed_attempts = case when failed_attempts + 1 >= 5 then 0 else failed_attempts + 1 end
    where id = account.id;
    return jsonb_build_object('ok',false,'error','invalid_credentials');
  end if;
  update public.aula_users set failed_attempts = 0,locked_until = null where id = account.id;
  return public.aula_open_session(account.id);
end;
$$;

create or replace function public.course_logout(p_token text) returns jsonb
language sql security definer set search_path = '' as $$
  delete from public.aula_sessions where token_hash = sha256(convert_to(coalesce(p_token,''),'UTF8'));
  select jsonb_build_object('ok',true);
$$;

create or replace function public.aula_file_list(p_user uuid,p_form_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'form_id',f.form_id,'name',f.name,'mime',f.mime,'size',f.size,'created_at',f.created_at) order by f.created_at),'[]'::jsonb)
  from public.aula_files f where f.user_id = p_user and (p_form_id is null or f.form_id = p_form_id);
$$;

create or replace function public.course_load(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_session_user(p_token);
begin
  return jsonb_build_object(
    'role',account.role,
    'profile',jsonb_build_object('user_id',account.id,'username',account.username,'full_name',account.full_name,'email',account.email,'phone',account.phone,'business',account.business,'municipality',account.municipality),
    'activities',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'title',f.title,'version',f.version,'position',f.position,'is_published',f.is_published,'due_at',f.due_at) order by f.position)
      from public.workshop_forms f where f.is_published or account.role = 'instructor'),'[]'::jsonb),
    'work',coalesce((select jsonb_agg(to_jsonb(w)) from public.aula_work w where w.user_id = account.id),'[]'::jsonb),
    'files',public.aula_file_list(account.id,null));
end;
$$;

-- Partial responses are validated without requiring completion of the diagnostic.
create or replace function public.validate_course_draft(p_payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  activity public.workshop_forms%rowtype;
  person jsonb;
  answer jsonb;
  answers jsonb;
  q jsonb;
  item jsonb;
  key text;
  max_length integer;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text) > 60000
    or p_payload->>'id' is null or p_payload->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'Invalid draft' using errcode = '22023';
  end if;
  select * into activity from public.workshop_forms where id = p_payload->>'form_id';
  if not found or p_payload->'version' is distinct from to_jsonb(activity.version) then raise exception 'Invalid activity' using errcode = '22023'; end if;
  person := p_payload->'participant'; answers := p_payload->'answers';
  if jsonb_typeof(person) is distinct from 'object' or jsonb_typeof(answers) is distinct from 'object'
    or jsonb_typeof(p_payload->'questions') is distinct from 'string' or char_length(p_payload->>'questions') > 2000
    or jsonb_typeof(p_payload->'consent') is distinct from 'boolean' then
    raise exception 'Invalid draft fields' using errcode = '22023';
  end if;
  foreach key in array array['name','email','phone','business','municipality'] loop
    max_length := case key when 'name' then 120 when 'email' then 254 when 'phone' then 30 when 'business' then 160 else 120 end;
    if person ? key and (jsonb_typeof(person->key) is distinct from 'string' or char_length(person->>key) > max_length) then raise exception 'Invalid participant' using errcode = '22023'; end if;
  end loop;
  if exists(select 1 from jsonb_object_keys(answers) incoming(key) where not exists(
    select 1 from jsonb_array_elements(activity.definition->'questions') known(q) where known.q->>'id' = incoming.key
  )) then raise exception 'Unknown answer' using errcode = '22023'; end if;
  for q in select value from jsonb_array_elements(activity.definition->'questions') loop
    key := q->>'id';
    if not answers ? key then continue; end if;
    answer := answers->key;
    case q->>'type'
      when 'text' then
        if jsonb_typeof(answer) is distinct from 'string' or char_length(answers->>key) > coalesce((q->>'max')::integer,4000) then raise exception 'Invalid text' using errcode = '22023'; end if;
      when 'radio' then
        if jsonb_typeof(answer) is distinct from 'string' or not(q->'options' @> jsonb_build_array(answer)) then raise exception 'Invalid option' using errcode = '22023'; end if;
      when 'multi' then
        if jsonb_typeof(answer) is distinct from 'array' then raise exception 'Invalid options' using errcode = '22023'; end if;
        if jsonb_array_length(answer) > jsonb_array_length(q->'options') or (select count(distinct value) from jsonb_array_elements(answer)) <> jsonb_array_length(answer) then raise exception 'Invalid options' using errcode = '22023'; end if;
        for item in select value from jsonb_array_elements(answer) loop
          if not(q->'options' @> jsonb_build_array(item)) then raise exception 'Invalid option' using errcode = '22023'; end if;
        end loop;
      when 'check' then
        if jsonb_typeof(answer) is distinct from 'boolean' then raise exception 'Invalid checkbox' using errcode = '22023'; end if;
      else raise exception 'Invalid question' using errcode = '22023';
    end case;
  end loop;
end;
$$;

create or replace function public.aula_save_work(p_user uuid,p_payload jsonb,p_step integer,p_revision integer) returns public.aula_work
language plpgsql security definer set search_path = '' as $$
declare work public.aula_work%rowtype;
begin
  if p_step is null or p_step not between 0 and 2 or p_revision is null or p_revision < 0 then raise exception 'Invalid step or revision' using errcode = '22023'; end if;
  perform public.validate_course_draft(p_payload);
  if not exists(select 1 from public.workshop_forms where id = p_payload->>'form_id' and is_published) then raise exception 'Activity closed' using errcode = 'PT403'; end if;
  -- Initial row creation and subsequent revision checks serialize concurrent tabs.
  insert into public.aula_work(user_id,form_id,payload,step,revision)
  values(p_user,p_payload->>'form_id',p_payload,p_step,1) on conflict(user_id,form_id) do nothing;
  select * into work from public.aula_work where user_id = p_user and form_id = p_payload->>'form_id' for update;
  if work.status = 'submitted' then raise exception 'Already submitted' using errcode = 'PT403'; end if;
  if work.payload = p_payload and work.step = p_step then return work; end if;
  if work.revision <> p_revision or work.payload->>'id' <> p_payload->>'id' then raise exception 'Draft changed in another tab' using errcode = 'PT409'; end if;
  update public.aula_work set payload = p_payload,step = p_step,revision = revision + 1,saved_at = now()
  where user_id = p_user and form_id = work.form_id returning * into work;
  return work;
end;
$$;

create or replace function public.course_save(p_token text,p_payload jsonb,p_step integer,p_revision integer default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_session_user(p_token);
begin
  return to_jsonb(public.aula_save_work(account.id,p_payload,p_step,p_revision));
end;
$$;

create or replace function public.course_complete(p_token text,p_payload jsonb,p_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  work public.aula_work%rowtype;
  receipt jsonb;
  person jsonb := p_payload->'participant';
begin
  select * into work from public.aula_work where user_id = account.id and form_id = p_payload->>'form_id' for update;
  if found and work.status = 'submitted' then
    if work.payload <> p_payload then raise exception 'Submitted work cannot be changed' using errcode = 'PT409'; end if;
    return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
  end if;
  perform public.aula_save_work(account.id,p_payload,2,p_revision);
  if exists(select 1 from public.workshop_responses where id = (p_payload->>'id')::uuid and student_id is distinct from account.id) then raise exception 'Submission id unavailable' using errcode = '23505'; end if;
  -- The original, fully validated insertion function remains internal only.
  receipt := public.submit_workshop_response(p_payload);
  update public.workshop_responses set student_id = account.id where id = (receipt->>'id')::uuid;
  update public.aula_work set status = 'submitted',submitted_at = now(),saved_at = now(),response_id = (receipt->>'id')::uuid,revision = revision + 1
  where user_id = account.id and form_id = p_payload->>'form_id' returning * into work;
  update public.aula_users set full_name = btrim(person->>'name'),email = coalesce(person->>'email',''),phone = coalesce(person->>'phone',''),
    business = coalesce(person->>'business',''),municipality = coalesce(person->>'municipality',''),updated_at = now() where id = account.id;
  return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
end;
$$;

create or replace function public.course_instructor(p_token text,p_offset integer default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_require_instructor(p_token);
begin
  return jsonb_build_object(
    'profiles',coalesce((select jsonb_agg(p order by p.updated_at desc) from (
      select u.id as user_id,u.username,u.full_name,u.email,u.phone,u.business,u.municipality,u.role,u.updated_at
      from public.aula_users u where u.id <> account.id order by u.updated_at desc limit 200) p),'[]'::jsonb),
    'work',coalesce((select jsonb_agg(w) from (
      select user_id,form_id,status,saved_at,submitted_at,response_id from public.aula_work limit 1000) w),'[]'::jsonb),
    'responses',coalesce((select jsonb_agg(r order by r.submitted_at desc) from (
      select id,full_name,email,phone,business,municipality,form_id,submitted_at,questions,student_id from public.workshop_responses
      order by submitted_at desc limit 200 offset greatest(coalesce(p_offset,0),0)) r),'[]'::jsonb));
end;
$$;

create or replace function public.course_responses(p_token text,p_ids jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.aula_require_instructor(p_token);
  if jsonb_typeof(p_ids) is distinct from 'array' or jsonb_array_length(p_ids) > 200
    or exists(select 1 from jsonb_array_elements(p_ids) v where jsonb_typeof(v) <> 'string' or v #>> '{}' !~* '^[0-9a-f-]{36}$') then
    raise exception 'Invalid ids' using errcode = '22023';
  end if;
  return coalesce((select jsonb_agg(to_jsonb(r) || jsonb_build_object('files',case when r.student_id is null then '[]'::jsonb else public.aula_file_list(r.student_id,r.form_id) end) order by r.submitted_at desc) from public.workshop_responses r
    where r.id in (select (v #>> '{}')::uuid from jsonb_array_elements(p_ids) v)),'[]'::jsonb);
end;
$$;

create or replace function public.course_set_activity(p_token text,p_form_id text,p_published boolean,p_due_at timestamptz default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare activity public.workshop_forms%rowtype;
begin
  perform public.aula_require_instructor(p_token);
  if p_published is null or (p_due_at is not null and not isfinite(p_due_at)) then raise exception 'Invalid activity settings' using errcode = '22023'; end if;
  update public.workshop_forms set is_published = p_published,due_at = p_due_at where id = p_form_id returning * into activity;
  if not found then raise exception 'Activity not found' using errcode = '22023'; end if;
  return jsonb_build_object('id',activity.id,'title',activity.title,'version',activity.version,'position',activity.position,'is_published',activity.is_published,'due_at',activity.due_at);
end;
$$;

create or replace function public.course_reset_pin(p_token text,p_user_id uuid,p_pin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform public.aula_require_instructor(p_token);
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then raise exception 'Invalid PIN' using errcode = '22023'; end if;
  update public.aula_users set pin_hash = extensions.crypt(p_pin,extensions.gen_salt('bf',8)),failed_attempts = 0,locked_until = null where id = p_user_id;
  if not found then raise exception 'User not found' using errcode = '22023'; end if;
  delete from public.aula_sessions where user_id = p_user_id;
  return jsonb_build_object('ok',true);
end;
$$;

-- Archivos adjuntos: hasta 5 por actividad y 5 MB cada uno; solo tipos que el navegador descarga sin ejecutar.
create or replace function public.course_upload_file(p_token text,p_form_id text,p_name text,p_mime text,p_data text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  content bytea;
  created public.aula_files%rowtype;
  clean_name text := btrim(regexp_replace(coalesce(p_name,''),'[\\/:*?"<>|[:cntrl:]]','_','g'));
begin
  if not exists(select 1 from public.workshop_forms where id = p_form_id and is_published) then raise exception 'Activity closed' using errcode = 'PT403'; end if;
  if exists(select 1 from public.aula_work where user_id = account.id and form_id = p_form_id and status = 'submitted') then raise exception 'Already submitted' using errcode = 'PT403'; end if;
  if p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp','application/pdf','text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation') then raise exception 'File type not allowed' using errcode = 'PT415'; end if;
  if char_length(clean_name) not between 1 and 160 then raise exception 'Invalid file name' using errcode = '22023'; end if;
  if p_data is null or char_length(p_data) > 7000000 then raise exception 'File too large' using errcode = 'PT413'; end if;
  begin content := decode(p_data,'base64'); exception when others then raise exception 'Invalid file data' using errcode = '22023'; end;
  if octet_length(content) = 0 then raise exception 'Empty file' using errcode = '22023'; end if;
  if octet_length(content) > 5242880 then raise exception 'File too large' using errcode = 'PT413'; end if;
  perform 1 from public.aula_users where id = account.id for update;
  if (select count(*) from public.aula_files where user_id = account.id and form_id = p_form_id) >= 5 then raise exception 'Too many files' using errcode = 'PT429'; end if;
  insert into public.aula_files(user_id,form_id,name,mime,size,data) values(account.id,p_form_id,clean_name,p_mime,octet_length(content),content) returning * into created;
  return jsonb_build_object('id',created.id,'form_id',created.form_id,'name',created.name,'mime',created.mime,'size',created.size,'created_at',created.created_at);
end;
$$;

create or replace function public.course_delete_file(p_token text,p_file_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  target public.aula_files%rowtype;
begin
  select * into target from public.aula_files where id = p_file_id and user_id = account.id;
  if not found then raise exception 'File not found' using errcode = 'PT404'; end if;
  if exists(select 1 from public.aula_work where user_id = account.id and form_id = target.form_id and status = 'submitted') then raise exception 'Already submitted' using errcode = 'PT403'; end if;
  delete from public.aula_files where id = target.id;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.course_download_file(p_token text,p_file_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  target public.aula_files%rowtype;
begin
  select * into target from public.aula_files where id = p_file_id and (user_id = account.id or account.role = 'instructor');
  if not found then raise exception 'File not found' using errcode = 'PT404'; end if;
  return jsonb_build_object('id',target.id,'name',target.name,'mime',target.mime,'size',target.size,'data',translate(encode(target.data,'base64'),E'\n',''));
end;
$$;

-- Solo desde SQL Editor: convierte una cuenta ya registrada en instructor.
create or replace function public.course_make_instructor(p_username text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  update public.aula_users set role = 'instructor' where username = lower(btrim(p_username));
  if not found then raise exception 'No existe el usuario %. Créalo primero en la web.', p_username; end if;
  return 'Instructor: ' || lower(btrim(p_username));
end;
$$;

-- Supabase concede EXECUTE por defecto; se retira de todo y se concede solo la API pública.
revoke all on function public.aula_open_session(uuid),public.aula_session_user(text),public.aula_require_instructor(text),
  public.validate_course_draft(jsonb),public.aula_save_work(uuid,jsonb,integer,integer),public.course_make_instructor(text),public.aula_file_list(uuid,text),
  public.course_upload_file(text,text,text,text,text),public.course_delete_file(text,uuid),public.course_download_file(text,uuid),
  public.course_register(text,text,text),public.course_login(text,text),public.course_logout(text),public.course_load(text),
  public.course_save(text,jsonb,integer,integer),public.course_complete(text,jsonb,integer),public.course_instructor(text,integer),
  public.course_responses(text,jsonb),public.course_set_activity(text,text,boolean,timestamptz),public.course_reset_pin(text,uuid,text)
  from public,anon,authenticated;
grant execute on function public.course_register(text,text,text),public.course_login(text,text),public.course_logout(text),public.course_load(text),
  public.course_save(text,jsonb,integer,integer),public.course_complete(text,jsonb,integer),public.course_instructor(text,integer),
  public.course_responses(text,jsonb),public.course_set_activity(text,text,boolean,timestamptz),public.course_reset_pin(text,uuid,text),
  public.course_upload_file(text,text,text,text,text),public.course_delete_file(text,uuid),public.course_download_file(text,uuid)
  to anon,authenticated;
-- Las entregas nuevas requieren una cuenta del curso. Las existentes se conservan.
revoke all on function public.submit_workshop_response(jsonb) from public,anon,authenticated;
notify pgrst,'reload schema';


-- Para dar acceso docente: crea tu cuenta en la web y después ejecuta en SQL Editor:
-- select public.course_make_instructor('TU_USUARIO');

-- Aula Sierra: las entregas se pueden corregir mientras la actividad siga abierta.
-- Conserva usuarios, borradores, entregas y archivos. Se puede ejecutar más de una vez.


alter table public.workshop_forms add column if not exists lock_after_due boolean not null default false;
alter table public.workshop_responses add column if not exists updated_at timestamptz;
alter table public.workshop_responses add column if not exists edit_count integer not null default 0;
alter table public.aula_work add column if not exists resubmitted_at timestamptz;

create table if not exists public.workshop_response_versions (
  id bigint generated always as identity primary key,
  response_id uuid not null references public.workshop_responses(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  questions text not null default '' check (char_length(questions) <= 2000),
  participant jsonb not null check (jsonb_typeof(participant) = 'object'),
  saved_at timestamptz not null default now()
);
create index if not exists workshop_response_versions_response on public.workshop_response_versions(response_id, saved_at desc);
alter table public.workshop_response_versions enable row level security;
revoke all on public.workshop_response_versions from public, anon, authenticated;

-- La actividad acepta guardados solo si está publicada y, si así se configuró, aún no vence.
create or replace function public.aula_activity_open(p_form_id text) returns void
language plpgsql stable security definer set search_path = '' as $$
declare activity public.workshop_forms%rowtype;
begin
  select * into activity from public.workshop_forms where id = p_form_id;
  if not found or not activity.is_published then raise exception 'Activity closed' using errcode = 'PT403'; end if;
  if activity.lock_after_due and activity.due_at is not null and activity.due_at <= now() then raise exception 'Activity closed' using errcode = 'PT403'; end if;
end;
$$;

create or replace function public.aula_save_work(p_user uuid,p_payload jsonb,p_step integer,p_revision integer) returns public.aula_work
language plpgsql security definer set search_path = '' as $$
declare work public.aula_work%rowtype;
begin
  if p_step is null or p_step not between 0 and 2 or p_revision is null or p_revision < 0 then raise exception 'Invalid step or revision' using errcode = '22023'; end if;
  perform public.validate_course_draft(p_payload);
  perform public.aula_activity_open(p_payload->>'form_id');
  insert into public.aula_work(user_id,form_id,payload,step,revision)
  values(p_user,p_payload->>'form_id',p_payload,p_step,1) on conflict(user_id,form_id) do nothing;
  select * into work from public.aula_work where user_id = p_user and form_id = p_payload->>'form_id' for update;
  if work.payload = p_payload and work.step = p_step then return work; end if;
  if work.revision <> p_revision or work.payload->>'id' <> p_payload->>'id' then raise exception 'Draft changed in another tab' using errcode = 'PT409'; end if;
  update public.aula_work set payload = p_payload,step = p_step,revision = revision + 1,saved_at = now()
  where user_id = p_user and form_id = work.form_id returning * into work;
  return work;
end;
$$;

create or replace function public.course_complete(p_token text,p_payload jsonb,p_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  work public.aula_work%rowtype;
  previous public.workshop_responses%rowtype;
  receipt jsonb;
  person jsonb := p_payload->'participant';
  clone_id uuid;
begin
  perform public.validate_course_draft(p_payload);
  if p_payload->'consent' is distinct from 'true'::jsonb or p_revision is null or p_revision < 0 then
    raise exception 'Invalid consent or revision' using errcode = '22023';
  end if;
  select * into work from public.aula_work where user_id = account.id and form_id = p_payload->>'form_id' for update;
  if found and work.status = 'submitted' then
    if work.payload->>'id' is distinct from p_payload->>'id' then raise exception 'Draft changed in another tab' using errcode = 'PT409'; end if;
    select * into previous from public.workshop_responses where id = work.response_id for update;
    if not found or previous.student_id is distinct from account.id then raise exception 'Submission id unavailable' using errcode = '23505'; end if;
    -- El mismo contenido no crea otra versión, aunque la actividad ya esté cerrada.
    if previous.full_name = btrim(coalesce(person->>'name',''))
      and previous.email = coalesce(person->>'email','') and previous.phone = coalesce(person->>'phone','')
      and previous.business = coalesce(person->>'business','') and previous.municipality = coalesce(person->>'municipality','')
      and previous.answers = p_payload->'answers' and previous.questions = coalesce(p_payload->>'questions','') then
      return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
    end if;
    perform public.aula_activity_open(p_payload->>'form_id');
    if work.revision <> p_revision or work.payload->>'id' is distinct from p_payload->>'id' then raise exception 'Draft changed in another tab' using errcode = 'PT409'; end if;
    -- La función original valida la entrega. Se inserta una copia temporal y se descarta tras copiar sus campos.
    clone_id := pg_catalog.gen_random_uuid();
    perform public.submit_workshop_response(jsonb_set(p_payload,'{id}',to_jsonb(clone_id::text)));
    insert into public.workshop_response_versions(response_id,answers,questions,participant)
    values(previous.id,previous.answers,previous.questions,jsonb_build_object('name',previous.full_name,'email',previous.email,'phone',previous.phone,'business',previous.business,'municipality',previous.municipality));
    update public.workshop_responses as orig set full_name = clone.full_name,email = clone.email,phone = clone.phone,
      business = clone.business,municipality = clone.municipality,answers = clone.answers,questions = clone.questions,
      form_version = clone.form_version,updated_at = now(),edit_count = orig.edit_count + 1
    from public.workshop_responses as clone where orig.id = previous.id and clone.id = clone_id;
    delete from public.workshop_responses where id = clone_id;
    perform public.aula_save_work(account.id,p_payload,2,p_revision);
    update public.aula_work set resubmitted_at = now(),saved_at = now(),revision = revision + 1
    where user_id = account.id and form_id = p_payload->>'form_id' returning * into work;
    update public.aula_users set full_name = btrim(person->>'name'),email = coalesce(person->>'email',''),phone = coalesce(person->>'phone',''),
      business = coalesce(person->>'business',''),municipality = coalesce(person->>'municipality',''),updated_at = now() where id = account.id;
    return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
  end if;

  perform public.aula_save_work(account.id,p_payload,2,p_revision);
  if exists(select 1 from public.workshop_responses where id = (p_payload->>'id')::uuid and student_id is distinct from account.id) then raise exception 'Submission id unavailable' using errcode = '23505'; end if;
  receipt := public.submit_workshop_response(p_payload);
  update public.workshop_responses set student_id = account.id where id = (receipt->>'id')::uuid;
  update public.aula_work set status = 'submitted',submitted_at = now(),saved_at = now(),response_id = (receipt->>'id')::uuid,revision = revision + 1
  where user_id = account.id and form_id = p_payload->>'form_id' returning * into work;
  update public.aula_users set full_name = btrim(person->>'name'),email = coalesce(person->>'email',''),phone = coalesce(person->>'phone',''),
    business = coalesce(person->>'business',''),municipality = coalesce(person->>'municipality',''),updated_at = now() where id = account.id;
  return jsonb_build_object('saved',true,'id',work.response_id,'work',to_jsonb(work));
end;
$$;

create or replace function public.course_load(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_session_user(p_token);
begin
  return jsonb_build_object(
    'role',account.role,
    'profile',jsonb_build_object('user_id',account.id,'username',account.username,'full_name',account.full_name,'email',account.email,'phone',account.phone,'business',account.business,'municipality',account.municipality),
    'activities',coalesce((select jsonb_agg(jsonb_build_object(
      'id',f.id,'title',f.title,'version',f.version,'position',f.position,'is_published',f.is_published,'due_at',f.due_at,'lock_after_due',f.lock_after_due,
      'editable',f.is_published and not (f.lock_after_due and f.due_at is not null and f.due_at <= now()),
      'closed_reason',case
        when not f.is_published then 'El instructor ocultó esta actividad.'
        when f.lock_after_due and f.due_at is not null and f.due_at <= now() then 'El plazo para editar esta actividad ya terminó.'
        else null end
    ) order by f.position) from public.workshop_forms f
      where f.is_published or account.role = 'instructor' or exists(select 1 from public.aula_work w where w.user_id = account.id and w.form_id = f.id)),'[]'::jsonb),
    'work',coalesce((select jsonb_agg(to_jsonb(w)) from public.aula_work w where w.user_id = account.id),'[]'::jsonb),
    'files',public.aula_file_list(account.id,null));
end;
$$;

create or replace function public.course_upload_file(p_token text,p_form_id text,p_name text,p_mime text,p_data text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  content bytea;
  created public.aula_files%rowtype;
  clean_name text := btrim(regexp_replace(coalesce(p_name,''),'[\\/:*?"<>|[:cntrl:]]','_','g'));
begin
  perform public.aula_activity_open(p_form_id);
  if p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp','application/pdf','text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation') then raise exception 'File type not allowed' using errcode = 'PT415'; end if;
  if char_length(clean_name) not between 1 and 160 then raise exception 'Invalid file name' using errcode = '22023'; end if;
  if p_data is null or char_length(p_data) > 7000000 then raise exception 'File too large' using errcode = 'PT413'; end if;
  begin content := decode(p_data,'base64'); exception when others then raise exception 'Invalid file data' using errcode = '22023'; end;
  if octet_length(content) = 0 then raise exception 'Empty file' using errcode = '22023'; end if;
  if octet_length(content) > 5242880 then raise exception 'File too large' using errcode = 'PT413'; end if;
  perform 1 from public.aula_users where id = account.id for update;
  if (select count(*) from public.aula_files where user_id = account.id and form_id = p_form_id) >= 5 then raise exception 'Too many files' using errcode = 'PT429'; end if;
  insert into public.aula_files(user_id,form_id,name,mime,size,data) values(account.id,p_form_id,clean_name,p_mime,octet_length(content),content) returning * into created;
  return jsonb_build_object('id',created.id,'form_id',created.form_id,'name',created.name,'mime',created.mime,'size',created.size,'created_at',created.created_at);
end;
$$;

create or replace function public.course_delete_file(p_token text,p_file_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  target public.aula_files%rowtype;
begin
  select * into target from public.aula_files where id = p_file_id and user_id = account.id;
  if not found then raise exception 'File not found' using errcode = 'PT404'; end if;
  perform public.aula_activity_open(target.form_id);
  delete from public.aula_files where id = target.id;
  return jsonb_build_object('ok',true);
end;
$$;

drop function if exists public.course_set_activity(text,text,boolean,timestamptz);
create or replace function public.course_set_activity(p_token text,p_form_id text,p_published boolean,p_due_at timestamptz default null,p_lock_after_due boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare activity public.workshop_forms%rowtype;
begin
  perform public.aula_require_instructor(p_token);
  if p_published is null or p_lock_after_due is null or (p_due_at is not null and not isfinite(p_due_at)) then raise exception 'Invalid activity settings' using errcode = '22023'; end if;
  update public.workshop_forms set is_published = p_published,due_at = p_due_at,lock_after_due = p_lock_after_due where id = p_form_id returning * into activity;
  if not found then raise exception 'Activity not found' using errcode = '22023'; end if;
  return jsonb_build_object('id',activity.id,'title',activity.title,'version',activity.version,'position',activity.position,'is_published',activity.is_published,'due_at',activity.due_at,'lock_after_due',activity.lock_after_due,
    'editable',activity.is_published and not (activity.lock_after_due and activity.due_at is not null and activity.due_at <= now()),
    'closed_reason',case when not activity.is_published then 'El instructor ocultó esta actividad.' when activity.lock_after_due and activity.due_at is not null and activity.due_at <= now() then 'El plazo para editar esta actividad ya terminó.' else null end);
end;
$$;

create or replace function public.course_tracking(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare account public.aula_users%rowtype := public.aula_require_instructor(p_token);
begin
  return jsonb_build_object(
    'students',coalesce((select jsonb_agg(jsonb_build_object('user_id',u.id,'username',u.username,'full_name',u.full_name) order by u.full_name)
      from public.aula_users u where u.role = 'student'),'[]'::jsonb),
    'activities',coalesce((select jsonb_agg(jsonb_build_object(
      'id',f.id,'title',f.title,'position',f.position,
      'total',(select count(*) from public.aula_users where role = 'student'),
      'submitted',(select count(*) from public.aula_work w join public.aula_users stu on stu.id = w.user_id where w.form_id = f.id and w.status = 'submitted' and stu.role = 'student'),
      'missing',(select count(*) from public.aula_users where role = 'student') - (select count(*) from public.aula_work w join public.aula_users stu on stu.id = w.user_id where w.form_id = f.id and w.status = 'submitted' and stu.role = 'student')
    ) order by f.position) from public.workshop_forms f where f.is_published),'[]'::jsonb),
    'cells',coalesce((select jsonb_agg(jsonb_build_object(
      'user_id',stu.id,'form_id',f.id,
      'state',case when w.user_id is null then 'pending' when w.status = 'submitted' and w.resubmitted_at is not null then 'edited' when w.status = 'submitted' then 'submitted' else 'draft' end,
      'saved_at',w.saved_at,'submitted_at',w.submitted_at,
      'files',(select count(*) from public.aula_files file where file.user_id = stu.id and file.form_id = f.id)
    )) from public.aula_users stu join public.workshop_forms f on f.is_published
      left join public.aula_work w on w.user_id = stu.id and w.form_id = f.id where stu.role = 'student'),'[]'::jsonb));
end;
$$;

create or replace function public.course_student_work(p_token text,p_user_id uuid,p_form_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  student public.aula_users%rowtype;
  work public.aula_work%rowtype;
  response public.workshop_responses%rowtype;
  state text;
begin
  perform public.aula_require_instructor(p_token);
  select * into student from public.aula_users where id = p_user_id;
  if not found then raise exception 'User not found' using errcode = '22023'; end if;
  if not exists(select 1 from public.workshop_forms where id = p_form_id) then raise exception 'Activity not found' using errcode = '22023'; end if;
  select * into work from public.aula_work where user_id = student.id and form_id = p_form_id;
  if found and work.response_id is not null then select * into response from public.workshop_responses where id = work.response_id; end if;
  state := case when not found then 'pending' when work.status = 'submitted' and work.resubmitted_at is not null then 'edited' when work.status = 'submitted' then 'submitted' else 'draft' end;
  return jsonb_build_object(
    'user',jsonb_build_object('user_id',student.id,'username',student.username,'full_name',student.full_name),
    'form_id',p_form_id,'state',state,
    'payload',case when found then work.payload else null end,
    'saved_at',work.saved_at,'submitted_at',work.submitted_at,'resubmitted_at',work.resubmitted_at,'revision',work.revision,
    'response',case when response.id is null then null else jsonb_build_object('id',response.id,'answers',response.answers,'questions',response.questions,'full_name',response.full_name,'email',response.email,'phone',response.phone,'business',response.business,'municipality',response.municipality,'edit_count',response.edit_count,'updated_at',response.updated_at,'submitted_at',response.submitted_at) end,
    'files',public.aula_file_list(student.id,p_form_id),
    'versions',coalesce((select jsonb_agg(jsonb_build_object('answers',v.answers,'questions',v.questions,'participant',v.participant,'saved_at',v.saved_at) order by v.saved_at desc)
      from public.workshop_response_versions v where v.response_id = work.response_id),'[]'::jsonb));
end;
$$;

-- Solo SQL Editor. Crea o promueve al instructor. Si la cuenta ya existe, no cambia su PIN.
create or replace function public.course_seed_instructor(p_username text,p_full_name text,p_pin text) returns text
language plpgsql security definer set search_path = '' as $$
declare name text := lower(btrim(coalesce(p_username,'')));
begin
  if name !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then raise exception 'Usuario inválido' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_full_name,''))) not between 2 and 120 then raise exception 'Nombre inválido' using errcode = '22023'; end if;
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then raise exception 'PIN inválido' using errcode = '22023'; end if;
  insert into public.aula_users(username,full_name,pin_hash,role)
  values(name,btrim(p_full_name),extensions.crypt(p_pin,extensions.gen_salt('bf',8)),'instructor')
  on conflict(username) do update set role = 'instructor',full_name = excluded.full_name,failed_attempts = 0,locked_until = null,updated_at = now();
  return 'Instructor listo: ' || name;
end;
$$;

revoke all on function public.aula_activity_open(text),public.course_seed_instructor(text,text,text),
  public.course_set_activity(text,text,boolean,timestamptz,boolean),public.course_tracking(text),public.course_student_work(text,uuid,text)
  from public,anon,authenticated;
grant execute on function public.course_set_activity(text,text,boolean,timestamptz,boolean),public.course_tracking(text),public.course_student_work(text,uuid,text)
  to anon,authenticated;
notify pgrst,'reload schema';


-- Aula Sierra: prácticas de Pinal de Amoles con capturas por apartado. Aditivo; conserva todos los datos.


update public.workshop_forms set position = case id
  when 'pinal-temporadas' then 6 when 'pinal-competencia' then 7 when 'pinal-precios' then 8
  when 'pinal-estrategia' then 9 when 'pinal-cierre' then 10 else position end
where id in ('pinal-temporadas','pinal-competencia','pinal-precios','pinal-estrategia','pinal-cierre');

-- Cada archivo puede pertenecer a un apartado "Sube:" de la actividad (null = archivo general).
alter table public.aula_files add column if not exists slot text;
do $$ begin
  if not exists(select 1 from pg_constraint where conname = 'aula_files_slot_format') then
    alter table public.aula_files add constraint aula_files_slot_format check (slot is null or slot ~ '^[a-z0-9_]{1,40}$');
  end if;
end $$;

create or replace function public.aula_file_list(p_user uuid,p_form_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'form_id',f.form_id,'slot',f.slot,'name',f.name,'mime',f.mime,'size',f.size,'created_at',f.created_at) order by f.created_at),'[]'::jsonb)
  from public.aula_files f where f.user_id = p_user and (p_form_id is null or f.form_id = p_form_id);
$$;

drop function if exists public.course_upload_file(text,text,text,text,text);
create or replace function public.course_upload_file(p_token text,p_form_id text,p_name text,p_mime text,p_data text,p_slot text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  account public.aula_users%rowtype := public.aula_session_user(p_token);
  content bytea;
  created public.aula_files%rowtype;
  clean_name text := btrim(regexp_replace(coalesce(p_name,''),'[\\/:*?"<>|[:cntrl:]]','_','g'));
begin
  perform public.aula_activity_open(p_form_id);
  if p_slot is not null and not exists(select 1 from public.workshop_forms f where f.id = p_form_id and coalesce(f.definition->'uploads','[]'::jsonb) @> jsonb_build_array(p_slot)) then
    raise exception 'Invalid upload slot' using errcode = '22023';
  end if;
  if p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp','application/pdf','text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation') then raise exception 'File type not allowed' using errcode = 'PT415'; end if;
  if char_length(clean_name) not between 1 and 160 then raise exception 'Invalid file name' using errcode = '22023'; end if;
  if p_data is null or char_length(p_data) > 7000000 then raise exception 'File too large' using errcode = 'PT413'; end if;
  begin content := decode(p_data,'base64'); exception when others then raise exception 'Invalid file data' using errcode = '22023'; end;
  if octet_length(content) = 0 then raise exception 'Empty file' using errcode = '22023'; end if;
  if octet_length(content) > 5242880 then raise exception 'File too large' using errcode = 'PT413'; end if;
  perform 1 from public.aula_users where id = account.id for update;
  -- Hasta 3 archivos por apartado y 10 por actividad.
  if (select count(*) from public.aula_files where user_id = account.id and form_id = p_form_id) >= 10
    or (p_slot is not null and (select count(*) from public.aula_files where user_id = account.id and form_id = p_form_id and slot = p_slot) >= 3)
    or (p_slot is null and (select count(*) from public.aula_files where user_id = account.id and form_id = p_form_id and slot is null) >= 5) then
    raise exception 'Too many files' using errcode = 'PT429';
  end if;
  insert into public.aula_files(user_id,form_id,slot,name,mime,size,data) values(account.id,p_form_id,p_slot,clean_name,p_mime,octet_length(content),content) returning * into created;
  return jsonb_build_object('id',created.id,'form_id',created.form_id,'slot',created.slot,'name',created.name,'mime',created.mime,'size',created.size,'created_at',created.created_at);
end;
$$;

revoke all on function public.course_upload_file(text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.course_upload_file(text,text,text,text,text,text) to anon,authenticated;
revoke all on function public.aula_file_list(uuid,text) from public,anon,authenticated;
notify pgrst,'reload schema';


-- Aula Sierra: la guía de prompts reemplaza a WhatsApp Business como actividad 2.
-- WhatsApp se oculta (no se borra): sus borradores y entregas se conservan para el instructor.

update public.workshop_forms set position = 2 where id = 'guia-prompts';
update public.workshop_forms set position = 98, is_published = false where id = 'whatsapp';
notify pgrst,'reload schema';


-- Generado por pnpm schema. Agrega la sesión 2 y ordena las prácticas anteriores como extras.
-- No borra usuarios, trabajos, entregas, archivos ni versiones. Conserva publicación, fechas y bloqueos existentes.

insert into public.workshop_forms (id,title,version,definition,position) values
('sesion2-precios', 'Mi tabla de precios por temporada', 1, '{"questions":[{"id":"sp1","number":1,"label":"Nombre y tipo de mi negocio","hint":"","type":"text","required":false},{"id":"sp2","number":2,"label":"Mi localidad y el atractivo más cercano","hint":"","type":"text","required":false},{"id":"sp3","number":3,"label":"Mis meses con más clientes y con menos clientes","hint":"","type":"text","required":false},{"id":"sp4","number":4,"label":"Mis precios entre semana, de fin de semana y lo que incluyo","hint":"","type":"text","required":false},{"id":"sp5","number":5,"label":"Mis costos por cada servicio vendido","hint":"Limpieza y lavandería; luz, gas y agua; insumos; mantenimiento; ayuda y otros. Anota cada importe.","type":"text","required":false},{"id":"sp6","number":6,"label":"Mi ganancia deseada sobre la venta y mi comisión, en %","hint":"Si vendes directo sin comisión, anota 0 en comisión.","type":"text","required":false},{"id":"sp8","number":8,"label":"Mis costos totales","hint":"","type":"text","required":false},{"id":"sp9","number":9,"label":"Mi precio mínimo y la cuenta paso a paso","hint":"","type":"text","required":false},{"id":"sp10","number":10,"label":"Mi tabla de precios de temporada baja, media y alta","hint":"Incluye el precio y la explicación de cada uno.","type":"text","required":false},{"id":"sp11","number":11,"label":"Mi promoción de temporada baja sin perder dinero","hint":"","type":"text","required":false}],"uploads":["sp7","sp12"]}'::jsonb, 6),
('sesion2-competencia', 'Compara mi negocio con 3 competidores', 1, '{"questions":[{"id":"sc1","number":1,"label":"Mi negocio y los precios que voy a comparar","hint":"","type":"text","required":false},{"id":"sc2","number":2,"label":"Mi tabla con al menos 3 competidores y enlaces","hint":"Por negocio: nombre, precio entre semana, precio de fin de semana, qué incluye y enlace de cada precio.","type":"text","required":false},{"id":"sc3","number":3,"label":"¿Estoy caro, en el promedio o barato? ¿Por cuánto?","hint":"","type":"text","required":false},{"id":"sc4","number":4,"label":"Qué ofrecen ellos que yo no y qué ofrezco yo que ellos no","hint":"","type":"text","required":false},{"id":"sc5","number":5,"label":"Mis 3 ideas para diferenciarme sin bajar mi precio","hint":"","type":"text","required":false},{"id":"sc6","number":6,"label":"Precios no encontrados y datos que debo confirmar","hint":"","type":"text","required":false}],"uploads":["sc7"]}'::jsonb, 7),
('sesion2-temporadas', 'Mi calendario de temporadas y plan final', 1, '{"questions":[{"id":"st1","number":1,"label":"Mi calendario de los 12 meses","hint":"Marca alta, media o baja en cada mes y explica en qué datos te basaste.","type":"text","required":false},{"id":"st2","number":2,"label":"Vacaciones, puentes, fiestas de Pinal y mar de nubes","hint":"Anota el año, las fuentes y lo que todavía falta confirmar.","type":"text","required":false},{"id":"st3","number":3,"label":"Cuándo publicaré mis promociones antes de cada temporada alta","hint":"","type":"text","required":false},{"id":"st4","number":5,"label":"Mi tabla final: temporada, meses, precio y promoción","hint":"","type":"text","required":false},{"id":"st5","number":6,"label":"Lo que debo confirmar antes de aplicar mi plan","hint":"","type":"text","required":false}],"uploads":["st6","st7"]}'::jsonb, 8)
on conflict (id) do update set title = excluded.title,version = excluded.version,definition = excluded.definition,position = excluded.position;
update public.workshop_forms set position = case id
  when 'pinal-temporadas' then 20 when 'pinal-competencia' then 21 when 'pinal-precios' then 22
  when 'pinal-estrategia' then 23 when 'pinal-cierre' then 24 else position end
where id in ('pinal-temporadas','pinal-competencia','pinal-precios','pinal-estrategia','pinal-cierre');
notify pgrst,'reload schema';


-- Generado por pnpm schema. Añade la práctica integradora al final de Tema IV.
-- Conserva usuarios, trabajos, entregas, archivos y la configuración de las actividades existentes.

insert into public.workshop_forms (id,title,version,definition,position) values
('tema4-perfiles', 'Práctica integradora · Configura tus perfiles turísticos', 1, '{"questions":[{"id":"pi_modalidad","label":"¿Cómo harás la actividad de Airbnb?","options":["Tengo hospedaje: anuncio real","No tengo hospedaje: borrador de práctica, sin publicar"],"type":"radio","required":false},{"id":"pi_palabras","number":2,"label":"Tus 10 palabras clave","hint":"","type":"text","required":false},{"id":"pi_resena5","number":3,"label":"Tu respuesta a una reseña de 5 estrellas","hint":"","type":"text","required":false},{"id":"pi_resena2","number":4,"label":"Tu respuesta a una reseña de 2 estrellas","hint":"Por el camino o por el precio. Responde con amabilidad y sin discutir.","type":"text","required":false},{"id":"pi_fotos","number":5,"label":"Las 10 fotos que subirás, en orden","hint":"","type":"text","required":false},{"id":"pi_google","number":6,"label":"Tu descripción de Google Maps","hint":"Máximo 750 caracteres. Copia el texto de tu ficha y revisa que todo sea verdad.","type":"text","required":false,"max":750},{"id":"pi_maps_nombre","label":"Nombre real y categoría correcta","type":"check","required":false},{"id":"pi_maps_horario","label":"Horario, también días festivos","type":"check","required":false},{"id":"pi_maps_contacto","label":"WhatsApp o teléfono","type":"check","required":false},{"id":"pi_maps_ubicacion","label":"Ubicación exacta","type":"check","required":false},{"id":"pi_maps_fotos","label":"10 fotos o más","type":"check","required":false},{"id":"pi_maps_resenas","label":"Reseñas respondidas","type":"check","required":false},{"id":"pi_airbnb_titulo","number":9,"label":"Tu título de Airbnb","hint":"Máximo 50 caracteres.","type":"text","required":false,"max":50},{"id":"pi_airbnb_descripcion","number":10,"label":"Tu descripción de Airbnb","hint":"Máximo 500 caracteres.","type":"text","required":false,"max":500},{"id":"pi_airbnb_espacio","number":11,"label":"El espacio: cómo es tu lugar","hint":"","type":"text","required":false},{"id":"pi_airbnb_servicios","number":12,"label":"Tus 10 servicios y 5 reglas de la casa","hint":"Usa lo que preparaste en tu ficha. No inventes servicios.","type":"text","required":false},{"id":"pi_airbnb_precio","number":13,"label":"Tipo de lugar, capacidad y precio por noche","hint":"","type":"text","required":false},{"id":"pi_airbnb_fotos","label":"Agregué al menos 5 fotos","type":"check","required":false},{"id":"pi_airbnb_estado","label":"Estado de tu anuncio","options":["Publicado: hospedaje real","Borrador: hospedaje real","Borrador de práctica: sin hospedaje, no publicado"],"type":"radio","required":false},{"id":"pi_revision_descripcion","label":"La descripción dice qué es, dónde está y qué lo hace especial.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_palabras","label":"Usa palabras clave como Pinal de Amoles o Sierra Gorda.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_limites","label":"Respeta los límites de caracteres.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_fotos","label":"Tiene 10 fotos reales o más.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_resenas","label":"Las respuestas a reseñas son amables y sin discutir.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_verdad","label":"Todo es verdad: precios, horario y servicios.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_pendientes","number":16,"label":"¿Qué te falta terminar de tarea?","hint":"Si ya terminaste todo, puedes dejarlo en blanco.","type":"text","required":false}],"uploads":["pi_ficha","pi_maps_antes","pi_maps_despues","pi_airbnb_captura","pi_tripadvisor"]}'::jsonb, 9)
on conflict (id) do update set title = excluded.title,version = excluded.version,definition = excluded.definition,position = excluded.position;
notify pgrst,'reload schema';


-- Generado por pnpm schema. Publica solo los seis trabajos acordados.
-- No modifica usuarios, borradores, entregas, respuestas, archivos, folios ni versiones.
-- Los trabajos anteriores siguen consultables por sus dueños y por el docente.

insert into public.workshop_forms (id,title,version,definition,position,is_published) values
('diagnostico', 'Evaluación diagnóstica', 1, '{"questions":[{"id":"d1","number":1,"label":"¿Tienes celular con WhatsApp?","options":["Sí","No"],"type":"radio","required":true},{"id":"d2","number":2,"label":"¿Usas WhatsApp para atender a tus clientes?","options":["Sí","No"],"type":"radio","required":true},{"id":"d3","number":3,"label":"¿Tienes WhatsApp Business?","options":["Sí","No"],"type":"radio","required":true},{"id":"d4","number":4,"label":"¿Sabes usar una computadora?","options":["Sí","No"],"type":"radio","required":true},{"id":"d5","number":5,"label":"¿Has escuchado hablar de la inteligencia artificial?","options":["Sí","No"],"type":"radio","required":true},{"id":"d6","number":6,"label":"¿Has usado ChatGPT, Gemini o Claude?","options":["Sí","No"],"type":"radio","required":true},{"id":"d7","number":7,"label":"¿Tu negocio tiene página de Facebook o cuenta de Instagram?","options":["Sí","No"],"type":"radio","required":true},{"id":"d8","number":8,"label":"¿Tu negocio aparece en Google Maps?","options":["Sí","No"],"type":"radio","required":true},{"id":"d9","number":9,"label":"¿Alguna vez has usado mensajes automáticos (bienvenida o ausencia)?","options":["Sí","No"],"type":"radio","required":true},{"id":"d10","number":10,"label":"¿Te escriben clientes de noche o en tu día de descanso?","options":["Sí","No"],"type":"radio","required":true},{"id":"d11","number":1,"label":"¿Qué es lo que más te preguntan tus clientes por mensaje?","hint":"","type":"text","required":true},{"id":"d12","number":2,"label":"¿Más o menos cuántos mensajes recibes al día?","hint":"","type":"text","required":true},{"id":"d13","number":3,"label":"¿Quién contesta los mensajes en tu negocio?","hint":"","type":"text","required":true},{"id":"d14","number":4,"label":"¿Qué te gustaría que la inteligencia artificial hiciera por tu negocio?","hint":"","type":"text","required":true}],"uploads":[]}'::jsonb, 1, true),
('prompt-conjunto', 'Crea el prompt conjunto', 1, '{"questions":[{"id":"pc_prompt","label":"Tu prompt conjunto con los datos de tu negocio","hint":"","type":"text","required":false},{"id":"pc_precios","label":"Parte 1 · Costos, precio mínimo y tabla de precios por temporada","hint":"","type":"text","required":false},{"id":"pc_competencia","label":"Parte 2 · Comparación con al menos 3 competidores y enlaces","hint":"Si no hay un precio publicado, escribe «No encontrado».","type":"text","required":false},{"id":"pc_temporadas","label":"Parte 3 · Temporadas y tabla final de precios y promociones","hint":"","type":"text","required":false},{"id":"pc_revision","label":"¿Qué datos corregiste o necesitas confirmar?","hint":"","type":"text","required":false}],"uploads":["pc_trends","pc_resultado"]}'::jsonb, 2, true),
('calendario-contenido', 'Calendario de contenido', 1, '{"questions":[{"id":"cc_semana","label":"Semana y 3 o 4 días que elegiste","hint":"","type":"text","required":false},{"id":"cc_calendario","label":"Tu calendario de contenido","hint":"Pega la tabla o adjúntala abajo. Cada día debe incluir foto o flyer, copy y llamado a la acción.","type":"text","required":false},{"id":"cc_dias","label":"Hay 3 o 4 publicaciones con fecha y red social","type":"check","required":false},{"id":"cc_contenido","label":"Cada publicación tiene tema, imagen, texto y llamado a la acción","type":"check","required":false},{"id":"cc_datos","label":"Revisé fechas, precios, servicios y testimonios","type":"check","required":false}],"uploads":["cc_archivo"]}'::jsonb, 3, true),
('flyers-ia', 'Flyers hechos con IA', 1, '{"questions":[{"id":"fi_prompt","label":"El prompt que usaste para crear tu flyer","hint":"","type":"text","required":false},{"id":"fi_calendario","label":"¿En qué día de tu calendario usarás este flyer?","hint":"","type":"text","required":false},{"id":"fi_cambios","label":"¿Qué corregiste en el diseño o en el texto?","hint":"","type":"text","required":false},{"id":"fi_real","label":"Las fotos, servicios, oferta y precio corresponden a mi negocio","type":"check","required":false},{"id":"fi_legible","label":"El título y el contacto se leen bien en celular","type":"check","required":false},{"id":"fi_revision","label":"Revisé ortografía, precio y teléfono","type":"check","required":false}],"uploads":["fi_flyer"]}'::jsonb, 4, true),
('tema4-perfiles', 'Perfil turístico: Google Maps, TripAdvisor o Airbnb', 1, '{"questions":[{"id":"pi_plataforma","label":"¿En qué plataforma harás tu perfil?","options":["Google Maps","TripAdvisor","Airbnb"],"type":"radio","required":false},{"id":"pi_palabras","number":2,"label":"Tus 10 palabras clave","hint":"","type":"text","required":false},{"id":"pi_resena5","number":3,"label":"Tu respuesta a una reseña de 5 estrellas","hint":"","type":"text","required":false},{"id":"pi_resena2","number":4,"label":"Tu respuesta a una reseña de 2 estrellas","hint":"Por el camino o por el precio. Responde con amabilidad y sin discutir.","type":"text","required":false},{"id":"pi_fotos","number":5,"label":"Las 10 fotos que subirás, en orden","hint":"","type":"text","required":false},{"id":"pi_google","number":6,"label":"Tu descripción de Google Maps","hint":"Máximo 750 caracteres. Copia el texto de tu ficha y revisa que todo sea verdad.","type":"text","required":false,"max":750},{"id":"pi_maps_nombre","label":"Nombre real y categoría correcta","type":"check","required":false},{"id":"pi_maps_horario","label":"Horario, también días festivos","type":"check","required":false},{"id":"pi_maps_contacto","label":"WhatsApp o teléfono","type":"check","required":false},{"id":"pi_maps_ubicacion","label":"Ubicación exacta","type":"check","required":false},{"id":"pi_maps_fotos","label":"10 fotos o más","type":"check","required":false},{"id":"pi_maps_resenas","label":"Reseñas respondidas","type":"check","required":false},{"id":"pi_modalidad","label":"¿Cómo harás la actividad de Airbnb?","options":["Tengo hospedaje: anuncio real","No tengo hospedaje: borrador de práctica, sin publicar"],"type":"radio","required":false},{"id":"pi_airbnb_titulo","number":9,"label":"Tu título de Airbnb","hint":"Máximo 50 caracteres.","type":"text","required":false,"max":50},{"id":"pi_airbnb_descripcion","number":10,"label":"Tu descripción de Airbnb","hint":"Máximo 500 caracteres.","type":"text","required":false,"max":500},{"id":"pi_airbnb_espacio","number":11,"label":"El espacio: cómo es tu lugar","hint":"","type":"text","required":false},{"id":"pi_airbnb_servicios","number":12,"label":"Tus 10 servicios y 5 reglas de la casa","hint":"Usa lo que preparaste en tu ficha. No inventes servicios.","type":"text","required":false},{"id":"pi_airbnb_precio","number":13,"label":"Tipo de lugar, capacidad y precio por noche","hint":"","type":"text","required":false},{"id":"pi_airbnb_fotos","label":"Agregué al menos 5 fotos","type":"check","required":false},{"id":"pi_airbnb_estado","label":"Estado de tu anuncio","options":["Publicado: hospedaje real","Borrador: hospedaje real","Borrador de práctica: sin hospedaje, no publicado"],"type":"radio","required":false},{"id":"pi_revision_descripcion","label":"La descripción dice qué es, dónde está y qué lo hace especial.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_palabras","label":"Usa palabras clave como Pinal de Amoles o Sierra Gorda.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_limites","label":"Respeta los límites de caracteres.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_fotos","label":"Tiene las fotos reales solicitadas para la plataforma elegida.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_resenas","label":"Las respuestas a reseñas son amables y sin discutir.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_revision_verdad","label":"Todo es verdad: precios, horario y servicios.","options":["Sí","No"],"type":"radio","required":false},{"id":"pi_pendientes","number":16,"label":"¿Qué te falta terminar de tarea?","hint":"Si ya terminaste todo, puedes dejarlo en blanco.","type":"text","required":false}],"uploads":["pi_ficha","pi_maps_antes","pi_maps_despues","pi_airbnb_captura","pi_tripadvisor"]}'::jsonb, 5, true),
('agente-ia', 'Chatbot personalizado para WhatsApp', 1, '{"questions":[{"id":"a1","number":1,"label":"¿Qué tipo de negocio tienes?","options":["Hospedaje (hotel, cabañas, posada)","Restaurante o cocina típica","Recorridos o tours","Guía turístico","Transporte","Otro"],"type":"radio","required":false},{"id":"a1_other","type":"text","required":false,"max":300},{"id":"a2","number":2,"label":"¿Cómo se llama tu negocio?","hint":"","type":"text","required":false},{"id":"a3","number":3,"label":"¿Dónde está?","hint":"Dirección, punto de encuentro o una referencia para llegar.","type":"text","required":false},{"id":"a4","number":4,"label":"¿En qué horario atiendes tú?","hint":"","type":"text","required":false},{"id":"a5","number":5,"label":"¿Cuál es tu teléfono y tus redes sociales?","hint":"","type":"text","required":false},{"id":"a6","number":6,"label":"¿Qué servicios vendes?","hint":"Por cada uno escribe: nombre, precio, qué incluye y cuánto dura.","type":"text","required":false},{"id":"a7","number":7,"label":"¿Los niños pagan diferente? ¿Desde qué edad?","hint":"","type":"text","required":false},{"id":"a8","number":8,"label":"¿Qué servicios recomiendas más y a quién?","hint":"Por ejemplo: familias, parejas, grupos, gente que viene de lejos.","type":"text","required":false},{"id":"a9","number":9,"label":"¿Cómo te pagan?","options":["Efectivo","Tarjeta","Transferencia","Otro"],"type":"multi","required":false},{"id":"a9_other","type":"text","required":false,"max":300},{"id":"a10","number":10,"label":"¿Pides anticipo? ¿De cuánto?","hint":"","type":"text","required":false},{"id":"a11","number":11,"label":"¿Qué pasa si un cliente cancela?","hint":"","type":"text","required":false},{"id":"a12","number":12,"label":"¿Qué pasa si llueve o el clima no deja dar el servicio?","hint":"","type":"text","required":false},{"id":"a13","number":13,"label":"¿Tienes promociones?","hint":"","type":"text","required":false},{"id":"a14","number":14,"label":"¿Cómo se llega? ¿Hay estacionamiento?","hint":"","type":"text","required":false},{"id":"a15","number":15,"label":"¿Qué deben llevar tus clientes?","hint":"","type":"text","required":false},{"id":"a16","number":16,"label":"¿Aceptas mascotas? ¿Pueden ir niños?","hint":"","type":"text","required":false},{"id":"a17","number":17,"label":"¿Qué otra pregunta te hacen mucho y qué contestas?","hint":"","type":"text","required":false},{"id":"a18","number":18,"label":"¿Qué datos debe pedirle al cliente?","options":["Nombre","Adultos y niños","Fecha de visita","De dónde viene","Servicio que le interesa","Número de personas","Otro"],"type":"multi","required":false},{"id":"a18_other","type":"text","required":false,"max":300},{"id":"a19","number":19,"label":"¿En qué casos debe pasarte la conversación?","options":["Quiere reservar o pagar","Grupo de más de ____ personas","Pide hablar con una persona","Tiene una queja o quiere cancelar","Pide descuento","Hay una emergencia"],"type":"multi","required":false},{"id":"a19_group","type":"text","required":false,"max":300},{"id":"a20","number":20,"label":"¿Cómo quieres que hable?","options":["Amable y cercano","Con emojis (máximo 2)","Formal","Sin emojis"],"type":"multi","required":false},{"id":"a21","number":21,"label":"¿Dónde hiciste la prueba?","options":["WhatsApp: chatbot configurado","Simulación con IA: herramienta de WhatsApp no disponible"],"type":"radio","required":false},{"id":"a22","number":22,"label":"Resultado de la prueba y ajustes","hint":"Registra qué contestó, cuándo pasó la conversación a una persona y qué corregiste.","type":"text","required":false}],"uploads":["a23","a24"]}'::jsonb, 6, true)
on conflict (id) do update set title=excluded.title,version=excluded.version,definition=excluded.definition,position=excluded.position,is_published=true;
update public.workshop_forms set is_published=false where id not in ('diagnostico','prompt-conjunto','calendario-contenido','flyers-ia','tema4-perfiles','agente-ia');
notify pgrst,'reload schema';


commit;
