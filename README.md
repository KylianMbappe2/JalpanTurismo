# Aula Sierra · plataforma del curso

Curso de IA aplicada al turismo con acceso por **nombre de usuario y PIN** (4 a 6 números), sin correo. Cada alumno elige una actividad, la hace en la misma pantalla y guarda el avance. Una entrega se puede corregir y volver a guardar mientras la actividad siga abierta. El instructor ve en Seguimiento quién entregó y quién no, y abre el trabajo de cada alumno.

La interfaz está pensada para celular: navegación inferior del administrador, cinco accesos (Inicio, Docente, Alumnos, Actividades y Perfil), resúmenes con colores suaves, tarjetas por alumno y controles táctiles grandes. El perfil muestra el rol **Administrador**; PostgreSQL conserva el rol interno `instructor` y valida los permisos en cada RPC. El nombre de usuario por sí solo no concede acceso administrativo.

**Panel docente** (`#docente`): consulta los trabajos entregados, abre respuestas y descarga archivos. Muestra alumno, actividad, estado Entregada y fecha. La búsqueda está visible; “Filtrar entregas” permite elegir actividad, ver solo las que tienen preguntas y limpiar filtros. El CSV respeta los filtros y la página actual. El enlace directo conserva el destino después de iniciar sesión. También se accede desde “Docente” en el menú inferior o “Ver entregas recibidas” en Inicio. Requiere cuenta con rol instructor; no necesita SQL adicional al curso instalado.

Para activar la cuenta existente de Jonathan, ejecuta los archivos numerados de `~/Desktop/sql jalpan`: `01_Actualizar_Aula_Sierra.sql` y `02_Activar_admin_jonathan.sql`. El segundo promueve la cuenta y conserva su PIN y sus trabajos. Sal y vuelve a entrar después. `LEEME.txt` contiene los pasos.

## Activar en Supabase

La URL y la clave pública ya están configuradas en `.env.local`. No uses una clave `service_role` ni `secret` en la web. No hace falta configurar Supabase Auth, correo ni SMTP.

1. Ejecuta **todo** `supabase/setup.sql` en Supabase → SQL Editor. En el Escritorio está la misma instalación como **Aula_Sierra_Curso_v2.sql**. Sirve para instalar y para actualizar, en una sola transacción, y conserva usuarios, borradores, entregas y archivos.
2. Ejecuta **Admin_jonathan.sql** del Escritorio (`~/Desktop/sql/Admin_jonathan.sql`). Crea la cuenta de instructor `jonathan`. Ese archivo no está en el repositorio porque contiene el PIN inicial. El PIN es débil: cámbialo en cuanto entres.
3. Republica el sitio para que el navegador use esta versión.
4. Entra con el usuario `jonathan`. La primera pantalla del instructor es Seguimiento.

El rol de instructor solo se asigna desde SQL; nadie puede elegirlo al registrarse. `select public.course_make_instructor('otro_usuario');` sigue sirviendo para promover otra cuenta. Mientras falte el SQL nuevo, una entrega ya enviada no se podrá corregir. Sites conserva su audiencia privada actual; para que los alumnos entren debes habilitar acceso para tu grupo o usar un hosting accesible para ellos.

## Uso durante el curso

- **Alumno:** Crear cuenta (nombre, usuario, PIN dos veces) → entra directo → Comenzar, Continuar o Editar entrega. El formulario es una sola página: datos plegables, preguntas, dudas y archivos, con Guardar avance y Entregar. Si ya entregó, el botón pasa a ser Guardar cambios de la entrega y el aviso muestra el folio. Recargar la pestaña conserva la sesión; al cerrarla o pulsar Salir se vuelve a entrar con usuario y PIN.
- **Archivos:** hasta 5 archivos de 5 MB por actividad (fotos JPG/PNG/WebP, PDF, Word, Excel, PowerPoint o texto). Las fotos de más de 1 MB se reducen a 1600 px en el propio celular. Se pueden subir y quitar también después de entregar, mientras la actividad siga abierta. El instructor los descarga desde el detalle. Se guardan en `aula_files`: vigila el espacio del plan de Supabase (500 MB en el gratuito).
- **PIN olvidado:** el instructor abre Participantes → Restablecer PIN y comparte el nuevo. Se cierran las sesiones abiertas de esa persona; sus actividades se conservan. Cinco PIN incorrectos seguidos bloquean la cuenta 15 minutos.
- **Instructor:** Seguimiento es la matriz de alumnos por actividad, con estados Pendiente, En progreso, Entregada y Editada tras entrega, contadores de quién entregó y filtros. Una celda abre el trabajo en solo lectura, con respuestas, dudas, archivos e historial de versiones. Entregas y preguntas conserva búsqueda, detalle y CSV. Actividades permite publicar u ocultar y, si se marca, bloquear la edición al pasar la fecha límite. Sin esa marca, la fecha es solo una referencia. Ocultar la actividad cierra guardados, correcciones y archivos.
- **Materiales:** seis clases con portada, título y número de diapositivas. La última es «Configura tus perfiles turísticos», a partir del archivo original `Airbnv.pdf` (11 diapositivas). Al elegir una clase se abre su visor integrado, con páginas, zoom, regreso a la lista y descarga del PDF original. La lista solo carga portadas WebP; el visor carga la diapositiva elegida y prepara la siguiente. No descarga los PDF para mostrar las clases. Las guías y el ejemplo del agente de IA siguen disponibles debajo.

Volver a entregar actualiza la misma fila y el mismo folio. La versión anterior queda en `workshop_response_versions`. Un reintento idéntico no crea otra versión. Si el instructor cerró la actividad, el alumno la ve en solo lectura; un reintento idéntico sigue aceptándose, un cambio no. Una pestaña antigua no sobrescribe un trabajo más reciente. En el navegador solo se guarda el token de sesión, en `sessionStorage` (se borra al cerrar la pestaña); ningún dato personal ni el PIN.

El panel pagina entregas de 200 en 200; búsqueda y CSV corresponden a la página visible. Participantes muestra hasta 200 cuentas y resume hasta 1000 actividades guardadas. Las entregas anteriores sin cuenta permanecen visibles al instructor.

## Datos y permisos

`aula_users` guarda usuario, nombre, datos de contacto opcionales, rol y el PIN cifrado con bcrypt. `aula_sessions` guarda solo el hash SHA-256 de cada token (30 días, renovable con el uso). `aula_work` guarda un borrador o entrega por usuario y actividad, con revisión; `resubmitted_at` marca que se corrigió después de entregar. `workshop_responses` conserva la entrega vigente (`edit_count`, `updated_at`) y `workshop_response_versions` las anteriores. `workshop_forms` contiene catálogo, publicación, fecha y `lock_after_due`. `course_seed_instructor` solo se ejecuta desde SQL Editor: crea o promueve un instructor y, si la cuenta ya existe, no cambia su PIN.

Las tablas no tienen acceso directo para `anon`/`authenticated`. El navegador solo llama funciones `course_*` que validan el token y obtienen el propietario en el servidor; las funciones docentes exigen rol instructor. Las funciones internas y `course_make_instructor` no son accesibles desde la web. `supabase/export.sql` permite exportar todas las respuestas desde SQL Editor.

Antes de compartir el curso, completa identidad y contacto del organizador en el aviso de privacidad de `public/app.js`.

## Desarrollo y publicación

Requiere Node.js 22.22.3 o posterior y pnpm 10.32.1.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
pnpm test
pnpm exec e2e-web install chromium
pnpm test:e2e
pnpm build
```

`pnpm dev` imprime la URL local, normalmente `http://127.0.0.1:4173`. `pnpm build` genera `dist/` con configuración pública; vuelve a compilar al cambiar `.env.local`. No hay dependencias de producción ni analíticas.

Las vistas de las presentaciones se generan con `python3 scripts/render-presentations.py` (Poppler y Pillow) al cambiar un PDF. El script prepara versiones WebP de 960 y 1920 px, portadas de 480 px y `public/presentations.js`. Estos archivos se guardan en Git; Vercel no necesita Python ni Poppler. Las carpetas incluyen una huella del PDF y de los ajustes de conversión para poder almacenarlas en caché sin servir imágenes antiguas.

En Vercel, `vercel.json` ejecuta la compilación y publica `dist/`, donde se genera `config.json`, siguiendo la [configuración oficial de Vercel](https://vercel.com/docs/project-configuration/vercel-json). Configura `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en las variables del proyecto y vuelve a desplegar. `.env.local` no se sube a GitHub. Los valores públicos para copiar están en `~/Desktop/sql jalpan/03_Configuracion_Vercel.txt`; nunca uses una clave secret/service_role.

Las preguntas proceden de los cinco PDF de `expo`; el diagnóstico exige 14 respuestas y las prácticas admiten respuestas opcionales según las guías. Para modificar el catálogo edita `public/forms.js`, actualiza la versión cuando corresponda y ejecuta `pnpm schema`. Revisa el instalador antes de aplicarlo. Las migraciones están en `supabase/migrations/002_course.sql` y `supabase/migrations/003_editable.sql`; `pnpm schema` las reúne en `supabase/setup.sql`.

## Pruebas y evidencia

`tasks/verification.md` resume pruebas unitarias, navegador con API simulada, PostgreSQL 17 aislado y la prueba de punta a punta contra PostgreSQL + PostgREST reales. La suite habitual no escribe en tu proyecto real.

Pila local: levanta PostgreSQL con `supabase/setup.sql` y PostgREST (rol anónimo `anon`), y ejecuta `STACK_REST_URL=http://127.0.0.1:PUERTO STACK_DB_CONTAINER=contenedor pnpm exec e2e run --config e2e.stack.config.ts`.

Prueba real en tu Supabase: ejecuta `pnpm exec e2e run --config e2e.live.config.ts` después de instalar el SQL. La suite crea una cuenta temporal `prueba.tecnica.*` con PIN aleatorio y una entrega marcada **PRUEBA TÉCNICA**; LIVE-01 verifica registro, borrador, archivos y entrega, y LIVE-02 verifica la corrección. Usa la configuración privada de `.env.local`. No utiliza ni modifica la cuenta del instructor. Si falta la migración nueva, LIVE-02 queda bloqueado hasta instalarla.

Documentación oficial: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones SQL](https://supabase.com/docs/guides/database/functions), [errores de PostgREST](https://postgrest.org/en/stable/references/errors.html).
## Seis actividades principales

El curso muestra únicamente estos trabajos, en este orden:

1. Evaluación diagnóstica (`diagnostico`).
2. Crea el prompt conjunto (`prompt-conjunto`): precios, competencia y temporadas en una sola entrega.
3. Calendario de contenido (`calendario-contenido`): 3 o 4 publicaciones de una semana.
4. Flyers hechos con IA (`flyers-ia`): fotos reales, oferta y contacto.
5. Perfil turístico (`tema4-perfiles`): basta Google Maps, TripAdvisor **o** Airbnb.
6. Chatbot personalizado para WhatsApp (`agente-ia`): cuestionario, configuración y conversación de prueba.

El avance cuenta estas actividades publicadas y las equivalencias de entregas anteriores reconocidas, sin duplicar el crédito. Los demás formularios conservan sus identificadores y definiciones para consultar entregas y borradores anteriores. Aparecen en «Extras · Tus trabajos anteriores» solo si el alumno tiene trabajo guardado. El docente conserva acceso al historial y los archivos. Las secciones de Google Maps, Airbnb y TripAdvisor cambian con la plataforma elegida sin borrar respuestas ni capturas de las otras rutas.

Para actualizar el proyecto existente de Aula Sierra (`dcqrrbsckznyilrdtpkz`), ejecutar **`supabase/migrations/008_seis_actividades.sql`**. Publica las seis actividades, oculta las restantes y conserva fechas y bloqueos docentes; no modifica usuarios, sesiones, trabajos, folios, respuestas, archivos ni versiones. Es idempotente y transaccional. No ejecutar migraciones antiguas después de 008. Para instalaciones nuevas usar `supabase/setup.sql`, que incluye 008 al final.

Verificación: `pnpm test`, `pnpm build`, `pnpm exec e2e run --config e2e.dist.config.ts tests/dist.spec.ts tests/profiles.e2e.ts tests/curriculum.e2e.ts --no-cache` y `node scripts/verify-curriculum.mjs`. El último comando requiere PostgreSQL en el contenedor aislado `aula-curriculum-qa` (o `STACK_DB_CONTAINER`); comprueba conservación byte a byte de los registros, historial con versiones, catálogo, acceso del dueño, seguimiento docente y entregas sin duplicar.

La correlación con las presentaciones está documentada en `tasks/course-alignment.md`.

## Interfaz para participantes sin experiencia técnica

El curso usa tarjetas de actividades, letra del sistema, colores suaves y botones de al menos 44 px. En celular, el menú de actividades y materiales queda abajo; al abrir una actividad aparece su barra de guardado. Los accesos a Actividades del curso y Extras desplazan y enfocan el encabezado sin cambiar el hash ni recargar el curso.

La ayuda desplegable explica guardar, entregar y copiar un mensaje para la IA. El contenido de las actividades y las reglas de acceso, validación y guardado se conservan. Este cambio de interfaz no necesita SQL nuevo. Pruebas: `tests/friendly-ui.e2e.ts`, junto con la batería existente.

El acceso y el registro usan un formulario centrado sin contenido promocional. Las instrucciones y ayudas se abren bajo demanda; los contadores aparecen al alcanzar el límite. El curso muestra el avance de forma compacta y el formulario ocupa una sola columna, con archivos opcionales y barra de guardado. No requiere migración SQL.

## Perfil turístico

La actividad 5 conserva el prompt de la ficha maestra y todas sus preguntas y espacios de archivo anteriores. Ahora el participante elige una plataforma. Google Maps admite evidencia antes y después; TripAdvisor, ficha o solicitud en revisión; Airbnb, anuncio real o borrador. Los datos de práctica nunca se publican.

Se conservan los límites en pantalla y servidor: 750 caracteres para Google Maps, 50 para el título de Airbnb y 500 para su descripción. `tests/profiles.e2e.ts` verifica también que cambiar de plataforma y recargar conserva los datos y las cinco capturas de una entrega anterior.

## Lista de cotejo del administrador y trabajos anteriores

Seguimiento presenta una tabla con una fila por alumno, una columna por actividad, palomitas verdes y totales por fila y columna. Cada casilla permite abrir la entrega original. En celular se desplaza la tabla y el nombre permanece visible. El panel docente distingue Todas las entregas, Actividades del curso y Tareas retiradas; mantiene filtros, paginación, folios, respuestas, archivos y CSV. No requiere SQL adicional.

`public/activity-credit.js` vincula tareas anteriores sin modificar registros: Guía para mejorar tus prompts y ChatGPT y prompts se reconocen en Prompt conjunto; también se reconoce el conjunto de tres partes de sesión 2 o de las cuatro prácticas de investigación y estrategia de Pinal, cuando todas están entregadas. Meta Business Suite se vincula como avance de calendario y WhatsApp Business como avance de chatbot; estas dos vinculaciones no acreditan automáticamente una actividad completa. Los alumnos ven estos trabajos bajo la principal y conservan su acceso en Extras. Las actividades principales ocultadas también pasan a Extras para quienes tienen trabajo.

El perfil turístico admite ficha, simulación o avance parcial; no exige publicación, negocio propio, documentos de identidad ni datos de cobro. Los datos de práctica se identifican y nunca se publican.

Pruebas: `tests/archived-activities.e2e.ts`, `tests/checklist.e2e.ts`, `tests/activity-credit.test.mjs` y regresiones de panel, perfiles y curso en PC y celular.
