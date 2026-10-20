# Aula Sierra: encuestas del taller

Objetivo: las personas del taller de IA aplicada al turismo responden desde su celular, registran su nombre y datos opcionales, y escriben sus dudas. Supabase guarda las entregas privadas.

Contenido: transcribir la evaluación diagnóstica y las cuatro prácticas de los PDF de `../`. Conservar preguntas, numeración y opciones. El ejemplo lleno es una referencia, no datos reales. Diagnóstico obligatorio; en prácticas se permiten respuestas vacías según las instrucciones originales.

Implementación: HTML/CSS/JavaScript nativos, sin dependencias de producción. Tres etapas: datos, actividad, revisión y consentimiento. Sin registro ni contraseñas para participantes. Las respuestas viven en memoria hasta enviarlas. No hay listado público de datos.

Base de datos: tabla de actividades y entregas; RPC de inserción validada, RLS y revocación de acceso directo para anon/authenticated. Clave pública en configuración; nunca service_role. UUID por entrega para reintentos sin duplicados. El instructor consulta y exporta desde Supabase.

Comandos: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm test:e2e`, `pnpm schema`.

Estructura: `public/` interfaz, catálogo y cliente; `scripts/` servidor/build/SQL; `supabase/` instalación SQL; `tests/` validación y navegador. Estilo: módulos ESM, funciones pequeñas, textos en español, HTML semántico y escape de valores al generar markup.

Verificación: pruebas de validación y cliente HTTP; SQL en PostgreSQL aislado; e2e sin modelo para rutas críticas en escritorio y móvil; revisión visual. Pruebas reales en el proyecto Supabase dependen de recibir su configuración.

Límites: validar en navegador y base; no modificar PDFs ni proyectos existentes; no guardar datos personales en el navegador; no enviar a servicios sin configuración. Publicación inicial privada en Sites. Para abrirla al público se requiere cambiar su audiencia y configurar Supabase.
