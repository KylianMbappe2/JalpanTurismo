export const masterProfilePrompt = `Actúa como experto en marketing turístico. Soy dueño de [nombre del negocio], un [tipo: cabañas / restaurante / tours / tienda] en [localidad], Pinal de Amoles, Sierra Gorda de Querétaro, cerca de [atractivo: Cuatro Palos, Chuveje…]. Ofrezco [servicios] para [tipo de cliente: familias, parejas, grupos], con precios de [rango]. Mi horario es [horario] y mi WhatsApp es [número]. Lo que me hace especial: [lo especial].

Con esos datos, arma la ficha maestra de mi negocio con estas secciones:

Datos básicos y la categoría que me conviene en Google Maps y Airbnb.
10 palabras clave que escribiría un turista para encontrarme.
Google Maps: descripción de máximo 750 caracteres.
Airbnb: título de máximo 50 caracteres, descripción de máximo 500 caracteres, el texto de “El espacio”, 10 servicios y 5 reglas de la casa.
Una respuesta a una reseña de 5 estrellas y otra a una de 2 estrellas (por el camino o por el precio).
Las 10 fotos que debo subir, en orden.

Usa las palabras clave de forma natural, lenguaje cálido y sencillo, y dime cuántos caracteres tiene cada texto. No inventes servicios que no te di.`;

const text = (id, number, label, hint = '', max) => ({ id, number, label, hint, type: 'text', required: false, ...(max ? { max } : {}) });
const upload = (id, number, label, hint = '') => ({ id, number, label, hint, type: 'upload', required: false });
const check = (id, label) => ({ id, label, type: 'check', required: false });
const radio = (id, label, options) => ({ id, label, options, type: 'radio', required: false });

export const profilesPractice = {
  id: 'tema4-perfiles', version: 1, number: '05', title: 'Perfil turístico: Google Maps, TripAdvisor o Airbnb', short: 'Perfiles turísticos',
  category: 'TEMA IV · PRÁCTICA INTEGRADORA', icon: 'compass', minutes: 90,
  description: 'Prepara tu ficha maestra y configura un perfil en la plataforma que corresponda a tu negocio. Basta una plataforma.',
  instructions: 'Tema IV · Subtemas 4.2.1, 4.2.2, 4.2.3 y 4.3. Prepara tu ficha maestra con IA y elige UNA plataforma: Google Maps, TripAdvisor o Airbnb. Solo necesitas entregar la evidencia de la que elegiste. Las capturas en revisión y los borradores también cuentan. Los datos de práctica nunca se publican.',
  sections: [
    {
      title: 'Antes de empezar',
      description: '<strong>Elige una plataforma.</strong> Trabaja con tu negocio real en Google Maps o TripAdvisor. Airbnb corresponde a hospedajes; si no tienes uno, prepara solo un borrador de práctica y no lo publiques.<br><br><strong>Regla de oro: los datos de práctica nunca se publican.</strong><br>Ten a la mano tus fotos editadas, horario, servicios y precios. No subas aquí contraseñas, INE ni datos de cobro.',
      questions: [radio('pi_plataforma', '¿En qué plataforma harás tu perfil?', ['Google Maps', 'TripAdvisor', 'Airbnb'])],
    },
    {
      title: 'Paso previo · Tu ficha maestra',
      description: '1. Copia el prompt en ChatGPT o Claude y cambia lo que está entre [corchetes] por tus datos. Prepara los textos de la plataforma que elegiste. Si haces Airbnb sin hospedaje, usa datos de práctica solo en un borrador.<br>2. Pega el prompt y envíalo.<br>3. Revisa que todo sea verdad y que respete los límites. Si no, pídele cambios como “hazlo más corto” o “quita lo que no ofrezco”.<br>4. Guarda la respuesta en tus notas y toma captura.',
      prompt: masterProfilePrompt, promptFold: true,
      questions: [
        upload('pi_ficha', 1, 'Captura de tu ficha maestra'),
        text('pi_palabras', 2, 'Tus 10 palabras clave'),
        text('pi_resena5', 3, 'Tu respuesta a una reseña de 5 estrellas'),
        text('pi_resena2', 4, 'Tu respuesta a una reseña de 2 estrellas', 'Por el camino o por el precio. Responde con amabilidad y sin discutir.'),
        text('pi_fotos', 5, 'Las 10 fotos que subirás, en orden'),
      ],
    },
    {
      title: 'Google Maps · Tu perfil de empresa', platform: 'Google Maps',
      description: '<strong>Completa esta ruta si elegiste Google Maps.</strong> Trabaja con tu negocio real.<br>1. Google Maps → toca tu foto → Tu perfil de empresa. Si no tienes perfil: Google Maps → Agregar tu empresa.<br>2. Toca “Editar perfil”.<br>3. Pega tu descripción (máximo 750 caracteres) y revisa nombre, categoría, horario y WhatsApp.<br>4. Sube tus fotos (10 o más).<br>5. Responde tus reseñas con las respuestas de tu ficha.<br><br><strong>Evidencia:</strong> captura de tu perfil antes y después. Si queda “en revisión”, también cuenta.',
      questions: [
        text('pi_google', 6, 'Tu descripción de Google Maps', 'Máximo 750 caracteres. Copia el texto de tu ficha y revisa que todo sea verdad.', 750),
        check('pi_maps_nombre', 'Nombre real y categoría correcta'),
        check('pi_maps_horario', 'Horario, también días festivos'),
        check('pi_maps_contacto', 'WhatsApp o teléfono'),
        check('pi_maps_ubicacion', 'Ubicación exacta'),
        check('pi_maps_fotos', '10 fotos o más'),
        check('pi_maps_resenas', 'Reseñas respondidas'),
        upload('pi_maps_antes', 7, 'Google Maps: captura antes'),
        upload('pi_maps_despues', 8, 'Google Maps: captura después', 'Si el perfil queda “en revisión”, esa captura también cuenta.'),
      ],
    },
    {
      title: 'Airbnb · Tu anuncio o borrador', platform: 'Airbnb',
      description: '1. En la app de Airbnb, cambia a modo anfitrión.<br>2. Toca “Crea un nuevo anuncio”.<br>3. Sigue los pasos y pega lo de tu ficha: tipo de lugar y capacidad; título (máximo 50 caracteres); descripción (máximo 500 caracteres); “El espacio”; servicios (wifi, chimenea, estacionamiento…); reglas de la casa; fotos (mínimo 5) y precio por noche.<br>4. Revisa todo y toma captura.<br><br><strong>Importante:</strong> para publicar, Airbnb pide verificar tu identidad y tus datos de cobro. Si es práctica o no tienes hospedaje, déjalo como borrador: no se publica hasta que tú le das “Publicar”.<br><strong>Los datos de práctica nunca se publican.</strong><br><br><strong>Evidencia:</strong> captura del anuncio publicado o del borrador.',
      questions: [
        radio('pi_modalidad', '¿Cómo harás la actividad de Airbnb?', ['Tengo hospedaje: anuncio real', 'No tengo hospedaje: borrador de práctica, sin publicar']),
        text('pi_airbnb_titulo', 9, 'Tu título de Airbnb', 'Máximo 50 caracteres.', 50),
        text('pi_airbnb_descripcion', 10, 'Tu descripción de Airbnb', 'Máximo 500 caracteres.', 500),
        text('pi_airbnb_espacio', 11, 'El espacio: cómo es tu lugar'),
        text('pi_airbnb_servicios', 12, 'Tus 10 servicios y 5 reglas de la casa', 'Usa lo que preparaste en tu ficha. No inventes servicios.'),
        text('pi_airbnb_precio', 13, 'Tipo de lugar, capacidad y precio por noche'),
        check('pi_airbnb_fotos', 'Agregué al menos 5 fotos'),
        radio('pi_airbnb_estado', 'Estado de tu anuncio', ['Publicado: hospedaje real', 'Borrador: hospedaje real', 'Borrador de práctica: sin hospedaje, no publicado']),
        upload('pi_airbnb_captura', 14, 'Airbnb: captura del anuncio o del borrador'),
      ],
    },
    {
      title: 'TripAdvisor · Tu perfil turístico', platform: 'TripAdvisor',
      description: '<strong>Completa esta ruta si elegiste TripAdvisor.</strong> Busca o configura la ficha real de tu negocio; revisa categoría, ubicación, descripción, contacto y fotos. Si ya existe, solicita administrarla desde Owners. No crees una ficha duplicada. Guarda captura de la ficha o de la solicitud en revisión.<br><br><strong>Para qué sirve:</strong> los turistas leen opiniones de otros viajeros antes de decidir. Muestra rankings de hoteles, restaurantes y “qué hacer”. Tu negocio puede aparecer aunque tú no lo hayas dado de alta.<br><br><strong>Cómo buscar:</strong><br>1. Abre la app o <a href="https://www.tripadvisor.com.mx/" target="_blank" rel="noopener">tripadvisor.com.mx</a>.<br>2. Escribe “Pinal de Amoles”.<br>3. Entra a Hoteles, Restaurantes o Qué hacer.<br>4. Busca tu negocio y el de tu competencia.<br>5. Lee qué opinan y qué fotos suben.<br><br>Si ya aparece tu negocio, más adelante puedes reclamarlo en <a href="https://www.tripadvisor.com/Owners" target="_blank" rel="noopener">tripadvisor.com/Owners</a> para responder reseñas.',
      questions: [upload('pi_tripadvisor', 15, 'TripAdvisor: captura de tu perfil o solicitud en revisión')],
    },
    {
      title: 'Revisión de un compañero',
      description: 'Pide a un compañero que revise tu ficha y el perfil que elegiste y marque Sí o No en cada punto.',
      questions: [
        radio('pi_revision_descripcion', 'La descripción dice qué es, dónde está y qué lo hace especial.', ['Sí', 'No']),
        radio('pi_revision_palabras', 'Usa palabras clave como Pinal de Amoles o Sierra Gorda.', ['Sí', 'No']),
        radio('pi_revision_limites', 'Respeta los límites de caracteres.', ['Sí', 'No']),
        radio('pi_revision_fotos', 'Tiene las fotos reales solicitadas para la plataforma elegida.', ['Sí', 'No']),
        radio('pi_revision_resenas', 'Las respuestas a reseñas son amables y sin discutir.', ['Sí', 'No']),
        radio('pi_revision_verdad', 'Todo es verdad: precios, horario y servicios.', ['Sí', 'No']),
      ],
    },
    {
      title: 'Entrega y revisión final',
      description: 'Entrega tu ficha maestra y la evidencia de <strong>UNA plataforma</strong>: Google Maps (antes y después), TripAdvisor (perfil o solicitud en revisión) o Airbnb (anuncio real o borrador). Incluye tus respuestas a reseñas y la revisión de un compañero.<br><br><strong>Se califica:</strong> contenido completo, palabras clave, límites de la plataforma elegida y datos verdaderos. Lo que no termines en clase lo terminas de tarea con tu ficha maestra.',
      questions: [text('pi_pendientes', 16, '¿Qué te falta terminar de tarea?', 'Si ya terminaste todo, puedes dejarlo en blanco.')],
    },
  ],
};
