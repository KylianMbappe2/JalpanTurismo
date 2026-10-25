# Materiales por clase — verificación del 25 de octubre de 2026

La pantalla de Materiales presenta cinco clases con portada, título y acceso al visor. La clase elegida muestra sus diapositivas, conserva el zoom y permite volver a la lista o descargar el PDF original.

## Medición

e2e con Chromium, contextos nuevos, API del curso simulada y archivos reales servidos por HTTP local. Resoluciones de 1440 × 1000 y 390 × 844. Los bytes corresponden a los recursos de Materiales después de iniciar sesión.

| Pantalla | Antes | Ahora |
| --- | --- | --- |
| Carga inicial de Materiales | 12 943 474 bytes: PDF inicial y PDF.js | 74 736 bytes: cinco portadas WebP |
| Primera diapositiva de la clase 1 | Se descargaba automáticamente al entrar | 73 882 bytes al elegir la clase; se prepara la siguiente |

La carga inicial disminuye un 99,4 %. El estado inicial cambia del primer PDF abierto automáticamente a una lista de clases. El contenido completo sigue disponible: se verificaron las 248 diapositivas en resoluciones de 960 y 1920 px.

Los tiempos locales orientativos fueron 292/306 ms antes y 211/186 ms ahora; abrir la primera diapositiva tardó 53/55 ms en la versión compilada. Estas cifras describen el entorno local, sin simular la latencia de Internet. El presupuesto reproducible comprueba los bytes y la ausencia de descargas PDF o PDF.js, además del funcionamiento del visor con las solicitudes PDF bloqueadas.

## Casos

- PDF-01: selección de las cinco clases, páginas, zoom, regreso a la lista y enlaces originales. Aprobado en escritorio y móvil.
- PDF-02: error de imagen, reintento y enlace al PDF. Aprobado en escritorio y móvil.
- PDF-03: clases y zoom en anchos de 320, 768 y 1024 px. Aprobado.
- PERF-01: portadas por debajo de 200 KB y vista de la primera diapositiva sin descargar PDF. Aprobado en escritorio y móvil.
- DIST-01 y DIST-02: catálogo y actualización de una pestaña con avance pendiente. Aprobados en escritorio y móvil.
- Pruebas unitarias: 43 aprobadas. Compilación: correcta.

Evidencia: `.e2e/materials-baseline/`, `.e2e/clases/`, `.e2e/clases-dist/` y `.e2e/clases-responsive/`.
