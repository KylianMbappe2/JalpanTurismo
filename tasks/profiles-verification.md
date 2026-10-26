# Práctica integradora de perfiles turísticos — 25 de octubre de 2026

- Actividad `tema4-perfiles`, última del bloque Tema IV y antes de Extras; posición 9 en el catálogo.
- Presentación 6: copia íntegra de `~/Desktop/Airbnv.pdf`, 11 diapositivas, con portadas y vistas optimizadas.
- Prompt completo, Google Maps real, Airbnb real o borrador de práctica sin publicación, TripAdvisor opcional, cinco capturas y revisión por compañero.
- Límites de 750/50/500 caracteres en navegador y PostgreSQL, con contador visible.

## Aprobado

- 46 pruebas unitarias, incluidas las fronteras de los tres límites y la conservación de la sesión 1.
- PROFILES-SQL-01 a PROFILES-SQL-04 en PostgreSQL 17 aislado: datos anteriores, idempotencia y configuración, cinco adjuntos y entrega sin duplicar, límites de texto.
- PROFILES-01 y PROFILES-02 en escritorio y móvil: borrador, recarga, cinco capturas, entrega editable y consulta docente.
- 12 comprobaciones de perfiles y sesiones en navegador con API simulada.
- 16 comprobaciones del sitio compilado: perfiles, presentaciones, adaptación a pantallas, rendimiento y actualización de versión.
- Las seis portadas suman 90 662 bytes; no se descargan PDF al abrir Materiales.

Evidencia: `.e2e/profiles-migration.txt`, `.e2e/perfiles/` y `.e2e/perfiles-dist/`.

## Activación de producción

Requiere ejecutar `supabase/migrations/007_perfiles_turisticos.sql` en el proyecto de Aula Sierra (`dcqrrbsckznyilrdtpkz`). La sesión disponible no tiene acceso administrativo a ese proyecto; no se ejecutaron cambios en otro proyecto. La copia lista para aplicar está en `~/Desktop/sql jalpan/05_Practica_integradora_Perfiles_turisticos.sql`.

La actividad solo aparece en el curso cuando existe también en el catálogo del servidor. La presentación de Materiales se publica independientemente de esa activación.
