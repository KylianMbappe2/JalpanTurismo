# Aula Sierra · entregas editables y seguimiento

Objetivo: el alumno completa sus actividades en una sola pantalla, guarda borradores y corrige entregas conservando el folio. El instructor abre Seguimiento por defecto, consulta alumnos × actividades, filtra faltantes y abre borradores, entregas, archivos e historial en solo lectura.

Arquitectura: HTML/CSS/JS nativo y Supabase PostgREST con clave publishable. Acceso por usuario y PIN con bcrypt; token en sessionStorage. Las RPC course_* validan el token en PostgreSQL; las consultas docentes exigen rol instructor. Las tablas y funciones internas no son accesibles desde el navegador.

Datos: migración aditiva e idempotente 003_editable.sql, incluida mediante pnpm schema en setup.sql. course_save conserva la copia de trabajo; course_complete actualiza la misma entrega y archiva la anterior en workshop_response_versions. Revisión optimista PT409 e idempotencia; archivos editables después de entregar. Publicación y lock_after_due controlan los cambios; los trabajos cerrados se consultan en solo lectura.

Instructor: course_seed_instructor solo desde SQL Editor, con script de cuenta fuera del repositorio en ~/Desktop/sql/Admin_jonathan.sql. Su repetición conserva un PIN previamente cambiado. No guardar el PIN inicial en código, pruebas ni commits.

Validación: pnpm test, compilación, SQL en PostgreSQL 17 con reinstalación doble y comparación íntegra de las siete tablas; e2e 0.21.2 en móvil/escritorio con API simulada y PostgreSQL + PostgREST 12.2.3 reales. LIVE-01 usa una cuenta marcada PRUEBA TÉCNICA. La edición y seguimiento en Supabase dependen de instalar el SQL nuevo: ver tasks/verification.md.

Activación: ejecutar Aula_Sierra_Curso_v2.sql en Supabase SQL Editor; ejecutar Admin_jonathan.sql; republicar el sitio; entrar como jonathan y cambiar el PIN inicial débil.
