## 2026-10-21 · Ilustración en acceso y registro

- Se reutiliza landscape.svg en ambas pantallas: panel lateral en escritorio y franja superior de 104 px en móvil, sin agregar texto promocional.
- AUTH-01, AUTH-02, AUTH-03, UX-03, BUG-LOGIN y BUG-LIMITS: **12/12 aprobados** entre escritorio y móvil. Acceso correcto/incorrecto, registro, restablecimiento de PIN, límites y ayuda bajo demanda. UX-03 verifica imagen en ambas pantallas, botón de acceso visible a 320 × 740 y ausencia de desbordamiento de 320 a 1440 px.
- Sitio compilado: **4/4 aprobados**. Build local y QA: 74ed8d6b95.
- Evidencia: .e2e/illustrated-auth/report.json y .e2e/illustrated-dist/report.json, con capturas revisadas de acceso móvil/escritorio y registro. Backend controlado por fixtures; no se cambió SQL.
- Archivos: public/course.js (imagen), public/theme.css (composición adaptable), tests/friendly-ui.e2e.ts (verificación visual y tamaños) y este registro.

## 2026-10-21 · Acceso clásico y pantallas compactas

- UX-01, UX-02 y UX-03: **aprobados** en escritorio y móvil. Accesos a sesiones, ayuda bajo demanda, menú móvil, guardado y formulario de acceso centrado. En 320 × 740, el botón de acceso queda dentro de la primera pantalla.
- Regresión de interfaz: **102 casos aprobados** por resultado final (95 de la batería inicial y revalidaciones específicas, más los dos casos nuevos de UX-03). El primer recorrido señaló cinco expectativas de presentación antiguas: las instrucciones y ayuda ahora se despliegan, y el número de actividad pasó a la línea de duración. Se actualizaron sus selectores y pasos conservando las comprobaciones de contenido y límites; META-01, BUG-LIMITS y BUG-NUMBER fueron aprobados al repetirlos.
- Evidencia por caso: .e2e/compact-verification.json; reportes originales en .e2e/compact-full, compact-auth y compact-changes. Los reportes originales conservan los fallos iniciales.
- Unitarias: **43/43 aprobadas**. Sitio compilado: **4/4 aprobadas**, .e2e/compact-dist-final/report.json. Build local y copia de QA: 8fac6a62f5.
- Capturas revisadas: acceso de escritorio, registro móvil de 320 px e inicio móvil con actividades visibles. Pruebas con RPC controladas; no se modificó Supabase ni el contenido de las actividades.
- Archivos: public/course.js (acceso, registro, progreso y textos), public/app.js (instrucciones, archivos y formulario), public/index.html (marca y pie), public/theme.css (disposición compacta), tres archivos de pruebas, README.md y este registro.

## 2026-10-20 · Interfaz familiar para participantes sin experiencia técnica

- UX-01: **aprobado** en escritorio y móvil. Saludo, acceso directo a Sesión 2 sin cambiar #curso, foco en su encabezado, ayuda y botón para seguir el curso.
- UX-02: **aprobado** en escritorio y móvil. Navegación inferior, materiales, ayuda de guardado y borrador; controles de al menos 44 px y sin desplazamiento horizontal en 320, 390, 768, 1024 y 1440 px. Se detectó y corrigió el desbordamiento de los selectores de archivo ocultos.
- Batería e2e completa: **100/100 aprobadas**, run 01a15bf0-0966-7825-8658-4a7f08e1ed49. Incluye registro, acceso, bloqueo, rutas, entregas largas, doble clic, edición, archivos, sesiones y panel docente. Evidencia: .e2e/ux-full/report.json y capturas en results/.
- Sitio compilado: **4/4 aprobadas**, run 01a15bf0-84a4-72bb-965c-c748f92514c0. Versionado y actualización de pestaña con avance conservado. Evidencia: .e2e/ux-dist/report.json.
- Unitarias: **43/43 aprobadas**. Build local y copia de QA: f45b4e51ef.
- Revisión visual: acceso en móvil y escritorio, inicio móvil, formulario móvil y panel docente.
- Las pruebas de interfaz usan el servidor local y respuestas controladas en la frontera RPC. No son una nueva prueba live de Supabase; este cambio no modifica SQL ni datos. La activación pendiente de las actividades nuevas sigue documentada en la sección anterior.
- Archivos: public/theme.css (tema y adaptación móvil), public/styles.css (fuente externa retirada), public/index.html (color y área segura del celular), public/course.js (accesos a sesiones, navegación y textos), public/app.js (ayuda y explicación del prompt), tests/friendly-ui.e2e.ts, README.md y este registro.

# Verificación · entregas editables y seguimiento · 20 de octubre de 2026 UTC

## Sesión 2 de hoy y Extras

| Caso | Estado | Evidencia |
| --- | --- | --- |
| SESSION-01 | Aprobado | Tres secciones, 5 actividades de sesión 1, 3 nuevas y 5 extras. Sin desbordamiento a 320, 390, 768 y 1440 px; captura móvil `sesiones-y-extras` |
| SESSION-02 | Aprobado | Prompt completo copiado con sus tres partes y regla “No encontrado”; evidencia adjunta, borrador tras recarga, entrega editable y apertura de competencia/calendario |
| SESSION-03 | Aprobado | Un borrador anterior se abre desde Extras con las respuestas y dudas intactas |
| SESSION-04 | Aprobado | El docente consulta respuestas, dudas y archivo de una actividad nueva |
| Sesión 1 intacta | Aprobado | Huella SHA-256 del contenido de sus cinco actividades idéntica al estado anterior: 23fcbd18fafcc98fe02fcbc404eeefa4a2c06f814bb9e3a84ca5cc4a28e6c6e8 |
| SESSION-SQL-01 | Aprobado | Tras actualizar se conservan sesión 1, usuarios, sesiones, borrador posterior a entrega, entrega oficial y archivo previo; comparación fila por fila |
| SESSION-SQL-02 | Aprobado | Migración 006 aplicada dos veces; solo tres actividades nuevas, sin perder publicación, fecha y bloqueo elegidos por el instructor |
| SESSION-SQL-03 | Aprobado | Las tres actividades aceptan entregas y archivos; reintentos conservan folio y el trabajo/archivo de Extras sigue presente |
| Regresión e2e | Aprobado | 96/96 en móvil y escritorio, ejecución 01a15bda-dc7c-7a17-9211-00e0eb239bae; `.e2e/sessions-full/report.json` |
| Versión compilada | Aprobado | 4/4, ejecución 01a15be3-27ab-7aeb-8799-93fcf192c3f6; `.e2e/sessions-dist/report.json` |
| Unitarias y build | Aprobado | 43/43 y compilación correcta; versión 0c6f91a111 |
| Activación en Supabase de producción | Bloqueado hasta ejecutar el SQL | Archivo listo en `~/Desktop/sql jalpan/04_Actividades_de_hoy_Sesion_2.sql`; no se ejecutó SQL de producción desde esta sesión |

El avance del alumno excluye los extras, que siguen abiertos, editables según publicación y revisables por el docente. No se cambió el contenido de la sesión 1, ni las validaciones, permisos, PIN, funciones de autenticación o RPC. La migración estrecha solo agrega definiciones y cambia el orden de las cinco prácticas anteriores. El instalador completo del escritorio también está actualizado. Se probaron los SQL con PostgreSQL 17 aislado, sin modificar datos de producción.

## Correcciones de guardado, acceso y navegación

Versión verificada con e2e 0.21.2 en Chromium de escritorio y móvil. Se conservan diseño, validaciones, escape de HTML, permisos SQL, revisión optimista y bloqueo por intentos de PIN. No requiere instalar SQL nuevo.

| Caso | Estado | Evidencia |
| --- | --- | --- |
| Registro | Aprobado | AUTH-02 y STACK-01; LIVE-01 crea una cuenta marcada PRUEBA TÉCNICA en Supabase |
| Login correcto | Aprobado | AUTH-01, STACK-01 y LIVE-01; incluye usuario con mayúsculas |
| Login incorrecto / desconocido | Aprobado | BUG-LOGIN, unitarias de HTTP 401 y STACK-LOCK; mismo mensaje sin revelar existencia |
| Bloqueo de PIN | Aprobado | STACK-LOCK: cinco rechazos incrementan el contador; el sexto intento recibe locked, incluso con PIN correcto |
| Entregar 3000 caracteres | Aprobado | BUG-SUBMIT, STACK-BUGS y LIVE-01; una sola fila oficial |
| Esperar una respuesta lenta | Aprobado | BUG-SLOW: demora de transporte de 20 segundos, spinner y botón desactivado; llega el folio sin error falso |
| Doble clic | Aprobado | BUG-SUBMIT: una petición normal de entrega y una fila; estado en curso compartido por usuario/actividad/folio |
| Respuesta perdida tras commit | Aprobado | BUG-SUBMIT y STACK-BUGS: consulta y confirmación idempotente con el payload, folio y revisión originales; una fila y solo una versión por edición |
| Borrador posterior / dos pestañas | Aprobado | Unitarias: nunca se confirma solo por aula_work; el recibo oficial decide, se conserva PT409 y se acepta el recibo idempotente sin revisión nueva |
| Cambios pendientes falsos | Aprobado | BUG-DIRTY: abrir entrega, input idéntico y deshacer cambios no modifican revisión ni dejan aviso pendiente |
| Rutas sin sesión | Aprobado | BUG-ROUTES: #curso y #actividad/agente-ia muestran acceso y reemplazan URL por #login |
| Actividad inexistente con sesión | Aprobado | BUG-ROUTES: Actividad no encontrada y Volver a mi curso |
| Menú inicial / logo / pie | Aprobado | BUG-NAV: sin enlaces vacíos ni #como-funciona; marcas apuntan a / |
| Numeración WhatsApp | Aprobado | BUG-NUMBER: /precios, /ubicacion y /horario llevan 3, 4 y 5 |
| Ayuda y límites | Aprobado | BUG-LIMITS: guion bajo y contadores 30/30 y 6/6; aviso Límite alcanzado |
| Privacidad | Aprobado | BUG-PRIVACY: el diálogo se cierra al cambiar el hash |
| Regresión general | Aprobado | 76/76, ejecución 01a1594a-5e16-739e-a1f9-21c3593d93cb; .e2e/bugs-final/report.json |
| PostgreSQL 17 + PostgREST v12.2.3 | Aprobado | 6/6, ejecución 01a1594a-624f-7f71-8487-523ce185f6a6; .e2e/bugs-stack-final/report.json |
| SQL aislado | Aprobado | tests/course-database.sql sobre aula_bugfix_20261020: P01–P07, C01–C25, F01–F08 y E01–E09; rollback al terminar |
| Supabase real | Aprobado | 2/2, ejecución 01a15947-b03d-70e8-ad9a-5c1a176a445a; .e2e/bugs-live-configured/report.json |
| Ajuste visual de contadores | Aprobado | 2/2, ejecución 01a1594b-d160-74d7-a5bf-51d754d32d7f; .e2e/bugs-limits-final/report.json |
| Unitarias y compilación | Aprobado | pnpm test: 39/39; pnpm build y comprobación de sintaxis correctas |

Diagnóstico: todas las RPC tenían un timeout de 18 segundos. Se amplió a 60 segundos. Entregar además hacía course_save y luego course_complete con el mismo contenido; ahora espera solo un autoguardado ya iniciado y deja que course_complete guarde y entregue en su transacción. Tras una respuesta incierta se consulta course_load y, si existe el folio entregado, se confirma con un único reintento idempotente de course_complete. Este último compara workshop_responses, conserva la revisión original y evita confundir un borrador posterior con una entrega. No se ignoran conflictos, cierres ni sesiones vencidas.

Mediciones: payload de 3349 bytes para la entrega sintética de 3000 caracteres; RPC local de entrega/confirmación entre 6 y 11 ms en la ejecución final. En Supabase real course_complete tardó 144 ms (tiempo de recurso del navegador) y course_save 100 ms. No se reprodujo una consulta de 15–20 segundos ni hay evidencia para atribuirla a una función fría o a un payload grande. El login de TEST123 inexistente devolvió invalid_credentials en 974 ms en una consulta real de diagnóstico. La cuenta live nueva se llama prueba.tecnica.mvgnrgcm y contiene únicamente información técnica.

Evidencia inicial: antes de corregir fallaron cinco reproducciones móviles (dirty, ambas rutas, privacidad y respuesta perdida), ejecución 01a1593f-e3f9-703a-92cd-5ff84e68fcb5. Una primera prueba live quedó bloqueada por configuración ausente en el servidor temporal de pruebas; se corrigió el entorno sin cambiar la app y la ejecución real posterior pasó. La revisión independiente detectó y resolvió dos riesgos de confirmación basada solo en borradores antes de la ejecución final.

La primera ejecución SQL sobre la base de los e2e falló en E02 porque esa aserción cuenta todas las entregas del docente y presupone una base vacía; la base ya contenía entregas de las pruebas anteriores. Se instaló el esquema sin modificaciones en una base nueva y aislada y pasó el archivo completo. No se borraron trabajos para hacer pasar la prueba.

## Panel docente · trabajos entregados

| Caso | Estado y resultado |
| --- | --- |
| PANEL-01 | Aprobado: enlace directo `#docente`, inicio de sesión conserva el destino, lista de entregas y recarga |
| PANEL-02 | Aprobado: búsqueda por alumno/negocio/correo, filtro por actividad, solo con preguntas, vacío y limpiar filtros |
| PANEL-03 | Aprobado: vista sin desbordamiento a 320, 390, 768 y 1440 px, detalle de respuestas y preguntas, descarga y regreso a la lista |
| Regresión | 54/54 e2e; ejecución `01a15921-2296-7aca-aef3-1e3010b84300`, `.e2e/teacher-full/report.json` |
| Filtros plegables finales | 12/12: PANEL-01–03, TEACHER-01–02 y ADMIN-03 en ambos tamaños; ejecución `01a15923-80c5-7eff-b031-6c9dfd020404`, `.e2e/teacher-final/report.json` |
| Pila real local | 2/2; ejecución `01a15921-2295-7840-bed2-dcaf73c46db2`, `.e2e/teacher-stack/report.json` |
| Unitarias y compilación | 31/31; compilación correcta, incluida la versión final de filtros plegables |
| Supabase real | Aprobado: `jonathan` ya devuelve rol instructor y puede consultar `course_instructor`; comprobación de solo lectura y sesión temporal cerrada |

Se presenta explícitamente la sección **Panel docente**, con acceso desde el menú, la cabecera y “Ver entregas recibidas”. La lista muestra solo entregas oficiales y conserva paginación y CSV de la vista actual. Los filtros adicionales están plegados para dar prioridad a los trabajos en el celular. Usa las RPC existentes; no se modificó SQL, PIN, roles ni datos de alumnos. El estado anterior de promoción pendiente de Jonathan ya fue resuelto en Supabase.

## Panel de administrador y prioridad móvil

| Caso / comprobación | Resultado | Evidencia |
| --- | --- | --- |
| ADMIN-01 | Aprobado: perfil de administrador, identidad, resumen del grupo y regreso al panel | `tests/admin.e2e.ts`; escritorio y móvil |
| ADMIN-02 | Aprobado: llamarse jonathan no concede permisos; el servidor debe devolver rol instructor | Cuenta simulada con el mismo nombre y rol alumno queda sin acceso al perfil administrativo |
| ADMIN-03 | Aprobado: seguimiento, entregas, participantes, actividades y perfil sin desbordamiento horizontal a 320, 360, 390, 430, 768, 1024 y 1440 px; navegación con altura táctil mínima de 44 px | Captura `perfil-admin-movil` |
| ADMIN-04 | Aprobado: lista móvil muestra actividad y estado; filtro de faltantes abre el trabajo correcto | Captura `trabajo-alumno-en-movil` |
| Regresión e2e | Aprobado: 48/48, incluidos EDIT-01/02 y TRACK-01/02 | Ejecución `01a15906-5075-7e46-962e-960cd2a6eeaa`; `.e2e/admin-full/report.json` |
| PostgreSQL + PostgREST reales | Aprobado: 2/2 sobre PostgreSQL 17 + PostgREST v12.2.3; guardado, archivos, PIN, correcciones, matriz y borradores | Ejecución `01a15906-5bc6-7ee3-b244-2df181470d1b`; `.e2e/admin-real-stack/report.json` |
| Unitarias / build / auditoría | Aprobado: 31/31, compilación correcta, sin vulnerabilidades conocidas | `pnpm test`, `pnpm build`, `pnpm audit` |
| Colores | Aprobado: texto principal 10.63:1, secundario 5.62:1, botón 6.09:1 y estados entre 5.75:1 y 6.18:1 | Cálculo de luminancia de los colores usados en `public/mobile.css`; capturas inspeccionadas |
| Promoción de la cuenta real | Pendiente de ejecutar SQL por el organizador | Se verificó que el PIN actual entra; Supabase devuelve rol `student`. Scripts preparados en `~/Desktop/sql jalpan` |
| Seguimiento en Supabase | Bloqueado hasta instalar el SQL nuevo | Preflight de `course_tracking`: HTTP 404 / PGRST202. No se cambió el rol ni el PIN de producción |

La carpeta `~/Desktop/sql jalpan` contiene `01_Actualizar_Aula_Sierra.sql` (idéntico a setup.sql), `02_Activar_admin_jonathan.sql` (promueve la cuenta existente sin tocar su PIN ni sus trabajos), instrucciones y configuración pública de Vercel. No contiene datos de otros alumnos ni se versiona en GitHub.

La interfaz usa el rol SQL existente `instructor`, presentado como **Administrador**. Las consultas y permisos se siguen comprobando en PostgreSQL. Las pruebas de interfaz se ejecutaron con e2e 0.21.2, motor web 0.15.2 y Chromium con tamaños móviles y de escritorio; no equivalen a una prueba física en todos los teléfonos. TRACK-01 conserva el resultado esperado y consulta los contadores móviles fuera de la cabecera de la tabla, que ahora se convierte en tarjetas.

Se detectó que el sitio Vercel servía la portada pero `/config.json` daba 404 y no había variables de entorno. Se añadió `vercel.json` para compilar y publicar `dist/`; las variables públicas de producción se configuraron sin guardar claves en el repositorio. La activación del administrador en Supabase sigue siendo el paso manual de los SQL indicados.

## Resultado actual

| Caso / suite | Resultado esperado y evidencia | Estado |
| --- | --- | --- |
| `pnpm test` | 31/31 unitarias: sesión, guardado, estados, CSV, respuestas y archivos | Aprobado |
| `pnpm build`; sintaxis JS | Compilación y `node --check` de app, curso y datos | Aprobado |
| EDIT-01 | Entregar, editar y volver a entregar mantiene folio y archiva la versión anterior; barra visible y sin desbordamiento horizontal | Aprobado en móvil y escritorio |
| EDIT-02 | Actividad cerrada muestra motivo y respuestas deshabilitadas, sin botones de escritura | Aprobado en móvil y escritorio |
| TRACK-01 | Matriz, contadores, filtro de faltantes y CSV con el alumno correcto | Aprobado en móvil y escritorio |
| TRACK-02 | Detalle de borrador y entrega; PDF descargado con contenido idéntico | Aprobado en móvil y escritorio |
| Suite habitual e2e | 40/40; ejecución `01a158ee-7d19-7eeb-9b29-b051faf64a22`, `.e2e/final-v3-browser/report.json` | Aprobado |
| STACK-01 | Registro, borrador, entrega, archivos, restablecer PIN, corregir mismo folio, matriz, historial y detalle del borrador en PostgreSQL 17 + PostgREST v12.2.3 | Aprobado 2/2; ejecución `01a158ef-9868-77b7-a6e4-c07350cb4cd3`, `.e2e/final-v3-real-stack/report.json` |
| P01–P07 / C01–C25 | Registro/PIN, bloqueo, revisiones, aislamiento y permisos; base aislada `aula_v3qa` | Aprobado |
| F01–F08 | Tipos, límites, propietario, descarga docente y edición de archivos tras entrega; actividad oculta bloquea escritura | Aprobado |
| E01 | Guardar cambios de trabajo conserva entrega oficial hasta volver a entregar | Aprobado |
| E02–E03 | Actualiza misma fila/folio, historial y contador; reintento idéntico no crea versión | Aprobado |
| E04 | Pestaña desactualizada recibe PT409 | Aprobado |
| E05 | Actividad oculta bloquea cambios; reintento idéntico conserva comprobante | Aprobado |
| E06 | Fecha vencida bloquea solo con lock_after_due activo | Aprobado |
| E07–E08 | Seguimiento y detalle solo para instructor; alumnos aislados; totales correctos | Aprobado |
| E09 | Reintento con otro folio o sin consentimiento rechazado | Aprobado; reprodujo un fallo real antes de corregir `course_complete` |
| REINSTALL / SEED | Instalador completo dos veces: comparación JSON íntegra de usuarios, sesiones, borradores, entregas, archivos binarios, versiones y catálogo; seed bcrypt solo desde SQL, respeta PIN ya cambiado | Aprobado |
| LIVE-01 | Registro, borrador, PDF, recarga, acceso y entrega en Supabase real, usuario `prueba.tecnica.mvgk7ck7`, nombre **PRUEBA TÉCNICA · conexión** | Aprobado; ejecución `01a158ec-7c6a-78bb-ad40-5b33f6230d69`, `.e2e/final-v3-supabase/report.json` |
| LIVE-02 / seguimiento en Supabase | Corrección y nuevas consultas docentes contra el proyecto real | Bloqueado: falta ejecutar SQL nuevo; preflight `course_student_work` devuelve HTTP 404 / PGRST202. No se instaló SQL ni se cambió la cuenta del instructor en producción |

Las pruebas finales de navegador se ejecutaron desde `/private/tmp/aula-v3-final` con las mismas fuentes y versiones e2e 0.21.2 / motor web 0.15.2, porque iCloud bloqueaba lecturas de dependencias en Desktop. Los reportes y capturas se conservaron también en `.e2e/` del proyecto. Sin proveedor de modelo: acciones y comprobaciones exactas con e2e.

Se corrigieron dos fallos visuales comprobados con pruebas: el campo de archivo oculto heredaba ancho del formulario y producía desplazamiento lateral; `overflow:hidden` del panel impedía fijar la barra inferior al viewport. Capturas finales inspeccionadas. En la prueba de pila real se corrigió el selector del folio y se esperó a terminar el cierre de sesión antes de abrir el registro docente; no se cambió la aplicación para satisfacer esas comprobaciones.

Instaladores: `~/Desktop/sql/Aula_Sierra_Curso_v2.sql` coincide con `supabase/setup.sql`; `~/Desktop/sql/Admin_jonathan.sql` queda fuera del repositorio y con permisos 600. `.env.local`, configuración privada de hosting y reportes están ignorados. El PIN inicial del instructor no aparece en las fuentes versionadas.

## Historial · 19 de octubre de 2026

## Versión 2.1 · acceso con usuario y PIN

| Suite | Resultado |
| --- | --- |
| `pnpm test` | 27/27 aprobadas (incluye reglas de usuario/PIN, sesión tras recarga, sesión caducada, bloqueo) |
| `tests/course-database.sql` en PostgreSQL 17 | P01–P07 y C01–C25 aprobados, en base nueva y en base con entrega v1 previa; datos revertidos |
| Instalador | Aplicado dos veces sobre v1 con datos: entrega anterior conservada; aplicado en base vacía |
| `pnpm exec e2e run` (API simulada) | 30/30 en escritorio y móvil · ejecución `01a156a8-92db-7de3-bf0e-d3334b9f954a` |
| `e2e.stack.config.ts` (PostgreSQL + PostgREST reales) | 2/2 (móvil y escritorio) · ejecución `01a156a9-4c44-76b4-9606-3e019f9f9be9` |
| Archivos adjuntos | F01–F08 en SQL (subir, descargar, nombre seguro, permisos, HTML/oversize rechazados, límite de 5, sin cambios tras entregar); FILE-01 e2e; STACK-01 sube PDF y foto y el docente descarga el PDF idéntico |
| Re-verificación final | 28 unitarias · 32/32 e2e (`01a156b9-240b-79c6-9d71-56b8b7a0a844`) · 2/2 pila real (`01a156b9-ccca-75b3-a804-c33673309994`) · SQL en base vacía, base usada y base v1 con entrega conservada |
| `pnpm audit` | Sin vulnerabilidades conocidas |

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| AUTH-01 | Acceso obligatorio, PIN incorrecto rechazado, salir cierra la sesión también tras recargar | Aprobado |
| AUTH-02 | Registro con usuario y PIN; PIN repetido distinto rechazado; entra directo al curso | Aprobado |
| AUTH-03 | Instructor restablece un PIN; validación de 4–6 números | Aprobado |
| COURSE-01 | Borrador conservado al recargar y tras salir y volver a entrar | Aprobado |
| STACK-01 | Registro, borrador, recarga, PIN incorrecto, entrega, panel docente, detalle, restablecer PIN y entrega conservada con el nuevo PIN, sobre base real | Aprobado |
| P01–P07 | Registro, validación, usuarios únicos, PIN cifrado, intentos contados, bloqueo tras 5 fallos | Aprobado |
| C01–C25 | Revisiones, idempotencia, entrega atómica, aislamiento, permisos docentes, restablecer PIN invalida sesiones, logout, tokens falsos y tablas/funciones internas cerradas | Aprobado |
| LIVE-01 | Supabase real del organizador: registro con usuario y PIN, borrador, PDF adjunto, recarga, salir/entrar, entrega | Aprobado · ejecución `01a156c2-924b-741e-a1d4-bcf9e470bb7e` · usuario `prueba.tecnica.mvfyla59` (borrable con `~/Desktop/sql/Borrar_prueba_tecnica.sql`). Pendiente: probar panel docente con el usuario real del instructor |

Las secciones siguientes describen la versión anterior con correo y contraseña, ya reemplazada.

## Versión 2 · curso con acceso

**25 pruebas unitarias aprobadas**, 25 comprobaciones sobre PostgreSQL 17 aprobadas y **30 pruebas e2e aprobadas** en escritorio y móvil. Runner e2e 0.21.2 y motor web 0.15.2, sin modelo ni correos externos. Ejecución completa: `01a1568f-37ff-7148-b752-4e016e6e7d45`. Reporte conservado en `.e2e/course-v2/report.json`. Auth/REST del navegador se simulan; las reglas SQL se prueban en PostgreSQL real aislado.

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| AUTH-01 | Acceso obligatorio, error de credenciales y cierre de sesión | Aprobado en escritorio y móvil |
| AUTH-02 | Consentimiento y confirmación de correo | Aprobado en escritorio y móvil |
| AUTH-03 | Recuperación, cambio de clave y tokens retirados de URL | Aprobado en escritorio y móvil |
| COURSE-01 | Borrador recuperado tras recargar e iniciar sesión | Aprobado en escritorio y móvil |
| COURSE-02 | Fallo conserva datos y permite reintento sin fingir éxito | Aprobado en escritorio y móvil |
| COURSE-03 | Alumno sin acceso al panel docente | Aprobado en escritorio y móvil |
| COURSE-04 | Siete materiales y PDF con MIME correcto | Aprobado en escritorio y móvil |
| COURSE-05 | Navegación fallida conserva respuestas; reintento termina navegación | Aprobado en escritorio y móvil |
| TEACHER-01 | Detalle y CSV con respuestas y dudas | Aprobado en escritorio y móvil |
| TEACHER-02 | Publicación de actividades guardada | Aprobado en escritorio y móvil |
| WEB-01–05 | Cinco actividades, privacidad, requisitos originales, opciones, consentimiento, reintento, entrega y diseño adaptable | Aprobado en escritorio y móvil |
| C01–C25 | Roles verificados, borradores, revisión optimista, idempotencia, entrega atómica, aislamiento, inmutabilidad y acceso anónimo denegado | Aprobado en PostgreSQL 17 aislado |
| MIG-01 | Instalador completo conserva una entrega anterior | Aprobado; legado conservado y 25 casos SQL repetidos tras instalación |
| LIVE-V2 | Registro, acceso y guardado contra Supabase del organizador | Bloqueado: falta SQL v2 y cuenta de prueba confirmada. Nueva RPC devuelve PGRST202. Auth habilitado exige confirmar correo. No se enviaron correos ni crearon cuentas reales. |

Después del último ajuste de la tabla móvil, AUTH-01, COURSE-01, WEB-01 y WEB-05 se repitieron: **8/8 aprobadas**, ejecución `01a15694-acdc-78ae-907b-0c31c016ea1e`, evidencia en `.e2e/course-v2-mobile-final`. Inspección visual de acceso, tabla del alumno y panel docente. Auditoría: sin vulnerabilidades conocidas. Tokens solo en memoria. El instalador revoca el envío anónimo dentro de la misma transacción. LIVE-01 abajo corresponde a v1 y no demuestra el curso v2.

## Historial · versión 1 sin cuentas

- `pnpm test`: **13 aprobadas**. Datos obligatorios, formatos, longitudes, opciones permitidas, prácticas opcionales, configuración pública, rechazo de claves privadas, comprobantes HTTP y fallos de conexión.
- `pnpm audit`: **sin vulnerabilidades conocidas**. Las dependencias son solo de pruebas; la web no carga librerías de producción.
- `pnpm build`: genera sitio estático; sin configuración no habilita entregas ni finge guardarlas.
- `node --check public/app.js`: aprobado.

## Navegador · e2e 0.21.2 / motor web 0.15.2

**10 aprobadas**, 0 fallidas y 0 omitidas: cada caso se ejecutó en escritorio (1440 × 1000) y móvil (390 × 844). Reporte detallado local: `.e2e/report.json`; resumen: `.e2e/summary.md`.

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| WEB-01 | Cinco actividades disponibles y aviso de privacidad accesible | Aprobado |
| WEB-02 | Nombre y 14 respuestas del diagnóstico obligatorias; “No” válido; edición conserva respuestas; envío sin configuración deshabilitado | Aprobado |
| WEB-03 | Veinte preguntas del agente, selección múltiple, tamaño de grupo y respuestas opcionales | Aprobado |
| WEB-04 | Consentimiento requerido; fallo de API conserva datos; reintento mantiene UUID; confirmación solo tras recibo válido | Aprobado (API interceptada, sin escritura externa) |
| WEB-05 | Sin desbordamiento horizontal a 320, 768, 1024 y 1440 px; una actividad inexistente vuelve al inicio | Aprobado |

Se inspeccionaron las capturas de la portada de escritorio y de la revisión móvil: textos legibles, campos alineados y sin recortes. No se utilizó un proveedor de IA en las pruebas.

## PostgreSQL 17 aislado

Instalación de `supabase/setup.sql` y ejecución de `tests/database.sql` en contenedor de prueba propio. Las entregas de prueba se revirtieron con ROLLBACK.

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| DB-01 | RPC guarda participante, respuestas y preguntas | Aprobado |
| DB-02 | Reintento idéntico no duplica; UUID con respuestas diferentes se rechaza | Aprobado |
| DB-03 | `anon` no puede consultar entregas | Aprobado |
| DB-04 | No permite INSERT directo, UPDATE ni DELETE de participantes | Aprobado |
| DB-05 | Valida consentimiento y preguntas obligatorias en servidor | Aprobado |
| DB-06 | Rechaza opciones inventadas, claves desconocidas y nombre nulo | Aprobado |
| DB-07 | `authenticated` tampoco puede consultar entregas ajenas | Aprobado |
| LIVE-01 | Entrega desde el navegador móvil al Supabase real del organizador y comprobante de guardado | Aprobado: e2e real, 1 prueba aprobada; sin API interceptada |

Conexión real verificada después de corregir un protocolo repetido en `SUPABASE_URL`. La clave pública fue aceptada por la API. La llamada de validación devolvió HTTP 400 / 22023, y el intento de lectura directa de `workshop_responses` devolvió HTTP 401. Se creó una entrega claramente identificada como **PRUEBA TÉCNICA · conexión**, sin datos reales de participantes. Puede eliminarse desde el panel de Supabase. Evidencia de la prueba real: `.e2e/live/report.json` y captura `confirmacion-supabase-real` (ejecución con los mismos archivos en una carpeta temporal para evitar bloqueos de lectura de iCloud).

Revisión final: preguntas y numeración cotejadas con los PDF; todas las interpolaciones de datos se escapan; acceso de participantes limitado a una función de inserción validada; claves privadas rechazadas; sin persistencia de datos personales en almacenamiento del navegador. Los reintentos no sobrescriben datos. El instructor usa Supabase Table Editor para consulta/exportación.
