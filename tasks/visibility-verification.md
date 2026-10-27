# Visibilidad de actividades y contenido

Revisión del 27 de octubre de 2026 sobre el frontend `086921d` de Aula Sierra.

## Datos comprobados desde el panel docente

- El seguimiento incluye 18 alumnos y las seis actividades principales.
- Las seis actividades están publicadas, sin bloqueos por fecha.
- La diagnóstica conserva seis entregas y doce acreditaciones docentes.
- La exportación contiene 32 entregas del grupo y una prueba técnica anterior.
- Las 32 entregas del grupo conservan 253 respuestas no vacías en la exportación.
- El seguimiento muestra 13 celdas de avance, incluidas equivalencias de tareas anteriores. Se abrió una adicionalmente en producción y conservaba su guardado y dos archivos.

## Pruebas de interfaz

Se reprodujeron localmente 18 perfiles con las entregas exportadas del panel docente y nombres de auditoría. Los casos `USUARIO-01` a `USUARIO-18` aprobaron en PC y celular: seis actividades con instrucciones y preguntas, contenido de las entregas propias anteriores, seis presentaciones y cuatro videos.

Resultado: 36 combinaciones aprobadas. En un caso se ajustó la comparación de texto para ignorar un salto de línea inicial que el analizador HTML omite en los campos `textarea`; el contenido permaneció completo y el caso aprobó en ambos tamaños.

También aprobaron 46 casos de regresión: actividades, archivos y permisos, tareas retiradas, perfiles turísticos, lista de cotejo y videos. Total: 82 comprobaciones aprobadas. Se utilizaron `e2e.dist.config.ts` y una configuración local de auditoría, conservada fuera de Git junto con los datos exportados.

## Alcance y límites

La revisión de producción se realizó desde la cuenta docente. Las pruebas individuales del propietario usaron la API simulada con los registros exportados; no equivalen a iniciar sesión con los 18 PIN reales. Los borradores no incluidos en la exportación se contrastaron por su estado en el panel, sin reproducir sus respuestas.

No se modificaron cuentas, PIN, respuestas ni archivos. Esta revisión no requirió cambios en el código de la aplicación. Los datos personales, las respuestas y las exportaciones no se incluyen en este informe ni en Git.
