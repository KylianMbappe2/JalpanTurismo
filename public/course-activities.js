import { tourismPrompt } from './tourism-session.js';

const text = (id, label, hint = '') => ({ id, label, hint, type: 'text', required: false });
const upload = (id, label, hint = '') => ({ id, label, hint, type: 'upload', required: false });
const check = (id, label) => ({ id, label, type: 'check', required: false });

export const courseActivities = [
  {
    id: 'prompt-conjunto', version: 1, number: '02', title: 'Crea el prompt conjunto', short: 'Prompt conjunto',
    category: 'ACTIVIDAD 2 · TEMAS I, II Y III', icon: 'spark', minutes: 45,
    description: 'Une los datos de tu negocio, precios, competencia y temporadas en una sola conversación con IA.',
    instructions: 'Reúne los datos reales de tu negocio. Completa el prompt conjunto, adjunta tu gráfica de Google Trends y ejecútalo en la IA. Conserva las tres partes en esta misma entrega. Comprueba costos, enlaces y fechas antes de usar los resultados.',
    sections: [
      { title: 'Completa y ejecuta el prompt conjunto', description: 'Tema III · Tendencias y precios, con los ingredientes de un buen prompt de los Temas I y II. Cambia los corchetes: negocio, ubicación, servicios, costos, margen y comisión.', prompt: tourismPrompt, promptFold: true, questions: [
        text('pc_prompt', 'Tu prompt conjunto con los datos de tu negocio'),
        upload('pc_trends', 'Tu gráfica de Google Trends'),
      ] },
      { title: 'Guarda el resultado revisado', description: 'Pega las tablas como texto o adjunta un documento o capturas con el resultado completo.', questions: [
        text('pc_precios', 'Parte 1 · Costos, precio mínimo y tabla de precios por temporada'),
        text('pc_competencia', 'Parte 2 · Comparación con al menos 3 competidores y enlaces', 'Si no hay un precio publicado, escribe «No encontrado».'),
        text('pc_temporadas', 'Parte 3 · Temporadas y tabla final de precios y promociones'),
        text('pc_revision', '¿Qué datos corregiste o necesitas confirmar?'),
        upload('pc_resultado', 'Resultado del prompt conjunto', 'Capturas o documento con las tres partes. También puedes pegarlas arriba.'),
      ] },
    ],
  },
  {
    id: 'calendario-contenido', version: 1, number: '03', title: 'Calendario de contenido', short: 'Calendario',
    category: 'ACTIVIDAD 3 · TEMA IV', icon: 'layers', minutes: 35,
    description: 'Organiza una semana de publicaciones con días, temas, fotos, textos y llamados a la acción.',
    instructions: 'Consulta la Clase 1 de Tema IV: Contenido para redes, subtemas 4.1.1 y 4.1.3. Elige 3 o 4 días fijos de una semana real. Prepara una publicación por día. Usa tus temporadas y promociones del prompt conjunto para elegir qué comunicar.',
    sections: [
      { title: 'Arma tu semana con IA', description: 'Incluye fecha, hora, red social, tema, foto o flyer, copy y llamado a la acción. Alterna tu lugar, promoción, fin de semana y experiencia de un cliente. Usa testimonios reales y fotos que puedas compartir.', prompt: 'Actúa como asesor de contenido turístico. Mi negocio es [nombre y tipo] en [localidad], Sierra Gorda. Ofrezco [servicios] a [clientes]. Mi promoción real es [promoción] y mi contacto es [contacto del negocio]. Crea un calendario para la semana del [fecha] con publicaciones en [3 o 4 días] para [redes]. Entrega una tabla con fecha, hora, red social, tema, foto o flyer sugerido, copy breve y llamado a la acción. Alterna el lugar, una promoción, una invitación de fin de semana y una experiencia real de cliente. No inventes precios, servicios, testimonios ni disponibilidad.', promptFold: true, questions: [
        text('cc_semana', 'Semana y 3 o 4 días que elegiste'),
        text('cc_calendario', 'Tu calendario de contenido', 'Pega la tabla o adjúntala abajo. Cada día debe incluir foto o flyer, copy y llamado a la acción.'),
        upload('cc_archivo', 'Tu calendario en captura o documento'),
      ] },
      { title: 'Revisa tu calendario', questions: [
        check('cc_dias', 'Hay 3 o 4 publicaciones con fecha y red social'),
        check('cc_contenido', 'Cada publicación tiene tema, imagen, texto y llamado a la acción'),
        check('cc_datos', 'Revisé fechas, precios, servicios y testimonios'),
      ] },
    ],
  },
  {
    id: 'flyers-ia', version: 1, number: '04', title: 'Flyers hechos con IA', short: 'Flyers con IA',
    category: 'ACTIVIDAD 4 · TEMA IV', icon: 'spark', minutes: 40,
    description: 'Diseña un flyer de tu negocio con fotos reales, una oferta clara y tus datos de contacto.',
    instructions: 'Consulta la Clase 1 de Tema IV: Contenido para redes, subtema 4.1.2. Usa tus fotos editadas y crea al menos un flyer con IA. Relaciónalo con una publicación de tu calendario. Revisa el texto antes de compartirlo.',
    sections: [
      { title: 'Crea tu flyer', description: 'El ejemplo de la presentación usa dos fotos editadas, formato vertical, título, destino, precio y contacto. Sustituye los datos del ejemplo por los de tu negocio. Entrega una imagen o un PDF.', prompt: 'Te adjunto [mis fotos reales]. Haz un flyer vertical para [red social] de [negocio] en [localidad, Sierra Gorda]. Título: [título]. Oferta y precio reales: [oferta y precio]. Incluye [servicios o destinos] y mi contacto de negocio [contacto]. Usa [colores], letra grande y buena legibilidad en celular. No inventes servicios ni cambies las características del lugar. Revisa ortografía y escribe exactamente el precio y el teléfono que te di.', promptFold: true, questions: [
        text('fi_prompt', 'El prompt que usaste para crear tu flyer'),
        upload('fi_flyer', 'Tu flyer final', 'Sube la imagen o PDF. Puedes agregar más de un diseño.'),
        text('fi_calendario', '¿En qué día de tu calendario usarás este flyer?'),
        text('fi_cambios', '¿Qué corregiste en el diseño o en el texto?'),
      ] },
      { title: 'Antes de compartir', questions: [
        check('fi_real', 'Las fotos, servicios, oferta y precio corresponden a mi negocio'),
        check('fi_legible', 'El título y el contacto se leen bien en celular'),
        check('fi_revision', 'Revisé ortografía, precio y teléfono'),
      ] },
    ],
  },
];
