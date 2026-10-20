- [x] Catálogo fiel a los cinco PDF y validación de entregas.
- [x] Interfaz adaptable: selección, datos, respuestas, revisión y confirmación real.
- [x] Supabase: SQL, acceso privado, validación e idempotencia.
- [x] Pruebas unitarias, PostgreSQL aislado y e2e de navegador.
- [x] Instrucciones de conexión, publicación y evidencia de verificación.
- [x] Conectar y comprobar el proyecto Supabase real: envío desde el navegador y comprobante de guardado; acceso anónimo de lectura rechazado.

## Versión 2 · curso con cuentas

- [x] Registro, confirmación, acceso, recuperación y cierre de sesión con Supabase Auth.
- [x] Tabla personal, borradores automáticos y manuales, recuperación y entregas de solo lectura.
- [x] Panel docente, participantes, filtros, CSV y gestión de publicación y fechas.
- [x] Siete PDF y diseño adaptable para celular.
- [x] Instalador transaccional que conserva respuestas anteriores; instructor por correo verificado y RLS.
- [x] 25 pruebas unitarias, 25 de base de datos y 30 de navegador aprobadas.

## Acceso con usuario y PIN (19 oct 2026)

- [x] Registro e inicio con usuario + PIN; sin correo ni confirmación. PIN con bcrypt, bloqueo tras 5 fallos, sesión por token con hash.
- [x] Borradores y entregas persistentes por usuario; sesión conservada al recargar; restablecimiento de PIN desde el panel docente.
- [x] 27 unitarias, P01–P07 + C01–C25 en PostgreSQL 17, 30 e2e simuladas y 2 e2e contra PostgreSQL + PostgREST reales.
- [ ] Organizador: ejecutar Aula_Sierra_Curso_v2.sql en Supabase, crear su usuario y ejecutar `course_make_instructor`.
- [ ] Republicar el sitio con esta versión.
