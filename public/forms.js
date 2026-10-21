import { tourismActivities } from './tourism-session.js';

const text = (id, number, label, hint = '', required = false) => ({ id, number, label, hint, type: 'text', required });
const choice = (id, number, label, options, type = 'radio', required = false) => ({ id, number, label, options, type, required });
const check = (id, label) => ({ id, label, type: 'check', required: false });
// Espacio para subir capturas o fotos; los archivos se guardan aparte, no dentro de las respuestas.
const upload = (id, number, label, hint = '') => ({ id, number, label, hint, type: 'upload', required: false });
const trendsUrl = 'https://trends.google.com/trends/explore?date=today%205-y&geo=MX&q=Pinal%20de%20Amoles%20%2B%20Cuatro%20Palos%20%2B%20Chuveje';

export const forms = [
  {
    id: 'diagnostico', version: 1, number: '01', title: 'Evaluación diagnóstica', short: 'Diagnóstico',
    category: 'EMPIEZA AQUÍ', icon: 'compass', minutes: 15, source: 'Evaluacion_diagnostica.pdf',
    description: 'Cuéntanos desde dónde partes. Conocer tu experiencia nos ayuda a preparar una mejor clase.',
    instructions: 'Esta evaluación no cuenta para tu calificación. Solo sirve para saber de dónde partimos y ajustar la clase. Marca Sí o No y contesta con honestidad.',
    sections: [
      { title: 'Conozcamos tu experiencia', description: 'Selecciona Sí o No en cada pregunta.', questions: [
        ...['¿Tienes celular con WhatsApp?', '¿Usas WhatsApp para atender a tus clientes?', '¿Tienes WhatsApp Business?', '¿Sabes usar una computadora?', '¿Has escuchado hablar de la inteligencia artificial?', '¿Has usado ChatGPT, Gemini o Claude?', '¿Tu negocio tiene página de Facebook o cuenta de Instagram?', '¿Tu negocio aparece en Google Maps?', '¿Alguna vez has usado mensajes automáticos (bienvenida o ausencia)?', '¿Te escriben clientes de noche o en tu día de descanso?'].map((label, i) => choice(`d${i + 1}`, i + 1, label, ['Sí', 'No'], 'radio', true)),
      ] },
      { title: 'Tu día a día', description: 'Responde con tus propias palabras. No hay respuestas incorrectas.', questions: [
        text('d11', 1, '¿Qué es lo que más te preguntan tus clientes por mensaje?', '', true),
        text('d12', 2, '¿Más o menos cuántos mensajes recibes al día?', '', true),
        text('d13', 3, '¿Quién contesta los mensajes en tu negocio?', '', true),
        text('d14', 4, '¿Qué te gustaría que la inteligencia artificial hiciera por tu negocio?', '', true),
      ] },
    ],
  },
  {
    id: 'guia-prompts', version: 1, number: '02', title: 'Guía para mejorar tus prompts', short: 'Mejores prompts',
    category: 'GUÍA PRÁCTICA', icon: 'spark', minutes: 30,
    description: 'Descubre qué le falta a un prompt básico y arma uno que dé respuestas útiles para tu negocio.',
    instructions: 'Un <strong>prompt</strong> es la instrucción que le das a la IA. Mientras más contexto le das, mejor te responde. Aquí vas a analizar prompts básicos, descubrir qué les falta y armar uno mejor paso a paso.',
    sections: [
      { title: 'Los 5 ingredientes de un buen prompt', description: 'Un buen prompt dice <strong>quién eres</strong>, <strong>qué ofreces</strong>, <strong>qué necesitas</strong>, el <strong>tono</strong> y el <strong>formato</strong> de la respuesta.',
        compare: { basic: 'Escribe un mensaje para mi negocio.', better: 'Soy dueña de Cabañas El Mirador en Pinal de Amoles. Ofrezco cabañas para 4 personas a $1,200 la noche con desayuno. Escribe 3 mensajes cortos de WhatsApp para invitar a familias a ver el mar de nubes en noviembre. Tono amable y cercano, máximo 2 emojis y 3 líneas por mensaje.' },
        questions: [
          choice('g1', 1, '¿Qué le falta al prompt básico?', ['Quién eres y dónde está tu negocio', 'Qué ofreces y a qué precio', 'Qué mensaje necesitas y para quién', 'El tono', 'El formato o el largo'], 'multi'),
          text('g2', 2, '¿Cómo está enfocado el prompt básico? ¿Qué le agregarías?'),
        ] },
      { title: 'Arma tu prompt mejorado', description: 'Llena cada ingrediente con los datos de tu negocio y toca <strong>Armar mi prompt</strong>. Después puedes ajustarlo a tu gusto.', questions: [
        text('g3', 3, '¿Quién eres?', 'Ej. Soy dueña de Cabañas El Mirador en Pinal de Amoles.'),
        text('g4', 4, '¿Qué ofreces?', 'Ej. Cabañas para 4 personas a $1,200 la noche con desayuno.'),
        text('g5', 5, '¿Qué necesitas que haga la IA?', 'Ej. 3 mensajes para invitar a familias a ver el mar de nubes.'),
        choice('g6', 6, '¿Qué tono quieres?', ['Amable y cercano', 'Formal', 'Divertido', 'Breve y directo']),
        choice('g7', 7, '¿Qué formato quieres?', ['Mensaje corto de WhatsApp (máximo 3 líneas)', 'Publicación para Facebook o Instagram', 'Lista con viñetas', 'Tabla']),
        { ...text('g8', 8, 'Tu prompt mejorado', 'Toca «Armar mi prompt» y revisa que tenga los 5 ingredientes.'), builder: true, meter: true },
      ] },
      { title: 'Pruébalo: antes y después', description: 'Abre ChatGPT. Pega primero el prompt básico y toma captura. Luego pega tu prompt mejorado y toma otra captura. Compara las respuestas.', questions: [
        upload('g9', 9, 'Captura de la respuesta al prompt básico'),
        upload('g10', 10, 'Captura de la respuesta a tu prompt mejorado'),
        text('g11', 11, '¿Qué cambió en la respuesta?'),
      ] },
      { title: 'Reto: mejora estos prompts', description: 'Reescribe cada prompt básico con los 5 ingredientes. El medidor te dice qué te falta.', questions: [
        { ...text('g12', 12, 'Mejora: «Hazme una publicación para Facebook.»'), meter: true },
        { ...text('g13', 13, 'Mejora: «¿Cuánto debo cobrar?»'), meter: true },
        { ...text('g14', 14, 'Mejora: «Contesta a un cliente que pregunta si hay lugar.»'), meter: true },
      ] },
    ],
  },
  {
    // Retirada del curso: se conserva solo para mostrar entregas anteriores.
    id: 'whatsapp', version: 1, number: '—', title: 'WhatsApp Business', short: 'WhatsApp', retired: true,
    category: 'PRÁCTICA', icon: 'message', minutes: 30, source: 'Practica_WhatsApp_Business.pdf',
    description: 'Prepara tu bienvenida, mensaje de ausencia y respuestas rápidas para tus clientes.',
    instructions: 'Hazlo en tu celular, con tu negocio real. Al terminar, manda una captura al grupo del curso. Registra aquí los textos que preparaste.',
    sections: [
      { title: 'Tus mensajes automáticos', questions: [
        text('w1', 1, 'Mensaje de bienvenida', 'En WhatsApp Business → Herramientas → Mensaje de bienvenida, activa y guarda tu saludo.'),
        text('w2', 2, 'Mensaje de ausencia y horario', 'Activa el mensaje de ausencia fuera del horario comercial y pon tu horario real en Editar perfil.'),
      ] },
      { title: 'Respuestas rápidas', description: 'En Herramientas → Respuestas rápidas, agrega cada mensaje y su atajo. En un chat, escribe / para probarlo.', questions: [
        text('w3', 3, '/precios'), text('w4', 4, '/ubicacion'), text('w5', 5, '/horario'),
      ] },
      { title: 'Prueba', description: 'Pide a un compañero que te escriba y revisa qué recibe. Marca solo lo que ya terminaste.', questions: [
        check('w6', 'Bienvenida activa'), check('w7', 'Ausencia activa'), check('w8', 'Horario real en el perfil'), check('w9', '3 respuestas rápidas guardadas'), check('w10', 'Captura enviada al grupo'),
      ] },
    ],
  },
  {
    id: 'chatgpt', version: 1, number: '03', title: 'ChatGPT y prompts', short: 'ChatGPT',
    category: 'PRÁCTICA', icon: 'spark', minutes: 30, source: 'Practica_ChatGPT_y_prompts.pdf',
    description: 'Escribe mejores instrucciones y crea mensajes útiles para tu negocio turístico.',
    instructions: 'Abre ChatGPT en la app o en chatgpt.com. Copia cada prompt y cambia lo que está entre [corchetes] por tus datos. Siempre revisa lo que te contesta: la IA puede inventar datos. Un buen prompt lleva 5 datos: quién eres, qué ofreces, qué mensaje necesitas, el tono y el formato.',
    sections: [
      { title: 'Tu primer prompt', prompt: '¿Qué lugares turísticos hay en Pinal de Amoles y Jalpan de Serra? Dame 5 ideas para un fin de semana.', questions: [text('c1', 1, '¿La respuesta fue correcta? ¿Faltó algún lugar?')] },
      { title: 'Tus respuestas rápidas', prompt: 'Tengo [tu negocio] en [Pinal de Amoles / Jalpan]. Escríbeme 3 respuestas cortas y amables para WhatsApp a: ¿cuánto cuesta?, ¿dónde están?, ¿qué horario tienen? Máximo 2 emojis.', description: 'Revisa precios y datos, y guárdalas en WhatsApp Business como /precios, /ubicacion y /horario.', questions: [text('c2', 2, 'Tus respuestas rápidas', 'Espacio para registrar las tres respuestas que preparaste.')] },
      { title: 'Tus mensajes de bienvenida y ausencia', prompt: 'Eres experto en ventas por WhatsApp para negocios turísticos de Pinal de Amoles. Escríbeme 3 mensajes de bienvenida y 3 de ausencia para mi [hospedaje / restaurante / recorrido], cortos, amables y con máximo 2 emojis.', description: 'Elige el que más te guste, cámbiale nombre, horarios y precios, y pégalo en tu WhatsApp.', questions: [
        text('c3', 3, 'Mi mensaje elegido'), check('c4', 'Escribí mi primer prompt'), check('c5', 'Guardé 3 respuestas rápidas'), check('c6', 'Mejoré mi bienvenida o ausencia con IA'),
      ] },
    ],
  },
  {
    id: 'meta', version: 1, number: '04', title: 'Meta Business Suite', short: 'Meta Business',
    category: 'PRÁCTICA', icon: 'layers', minutes: 25, source: 'Practica_Meta_Business_Suite.pdf',
    description: 'Configura tu perfil, conecta Facebook e Instagram y programa una publicación desde la app.',
    instructions: 'Descarga la app <strong>Meta Business Suite</strong> desde Play Store (Android) o App Store (iPhone) y entra con la cuenta de Facebook de tu negocio. Toma una captura de cada paso y súbela en su espacio.',
    sections: [
      { title: 'Tu perfil configurado', description: 'En la app toca tu negocio → <strong>Editar</strong>. Completa foto, descripción, horario, teléfono, ubicación y botón de contacto.', questions: [
        upload('m7', 1, 'Captura de tu perfil configurado en Meta Business Suite'),
      ] },
      { title: 'Tus redes conectadas', description: 'En <strong>Configuración → Cuentas</strong> revisa que aparezcan tu página de Facebook y tu cuenta de Instagram.', questions: [
        choice('m1', 2, '¿Qué redes conectaste?', ['Facebook', 'Instagram', 'Facebook e Instagram', 'No aplica: mi negocio no tiene estas cuentas']),
        upload('m8', 3, 'Captura de tus redes conectadas'),
      ] },
      { title: 'Programa una publicación', description: 'Toca <strong>Crear → Publicación</strong>, elige Facebook e Instagram, agrega foto y texto, toca <strong>Opciones de programación</strong> y elige una fecha futura. Toma captura en <strong>Planificador</strong>.', questions: [
        text('m9', 4, '¿Qué publicaste y para qué fecha la programaste?'),
        upload('m10', 5, 'Captura de tu publicación programada'),
      ] },
    ],
  },
  {
    id: 'agente-ia', version: 1, number: '05', title: 'Tu agente de IA', short: 'Agente de IA',
    category: 'PRÁCTICA FINAL', icon: 'bot', minutes: 45, source: 'Practica_Agente_IA_WhatsApp.pdf',
    description: 'Reúne los datos de tu negocio para preparar tu agente de IA en WhatsApp Business.',
    instructions: 'Contesta con los datos reales de tu negocio. Al final, la página junta todas tus respuestas en <strong>un solo prompt</strong> listo para copiar y pegar en ChatGPT o en WhatsApp Business → Herramientas → Agente de IA. Si no sabes una respuesta, déjala en blanco y pregúntala en clase.',
    agentPrompt: true,
    sections: [
      { title: 'Tu negocio', questions: [
        choice('a1', 1, '¿Qué tipo de negocio tienes?', ['Hospedaje (hotel, cabañas, posada)', 'Restaurante o cocina típica', 'Recorridos o tours', 'Guía turístico', 'Transporte', 'Otro']),
        text('a2', 2, '¿Cómo se llama tu negocio?'), text('a3', 3, '¿Dónde está?', 'Dirección, punto de encuentro o una referencia para llegar.'), text('a4', 4, '¿En qué horario atiendes tú?'), text('a5', 5, '¿Cuál es tu teléfono y tus redes sociales?'),
      ] },
      { title: 'Lo que ofreces', questions: [
        text('a6', 6, '¿Qué servicios vendes?', 'Por cada uno escribe: nombre, precio, qué incluye y cuánto dura.'), text('a7', 7, '¿Los niños pagan diferente? ¿Desde qué edad?'), text('a8', 8, '¿Qué servicios recomiendas más y a quién?', 'Por ejemplo: familias, parejas, grupos, gente que viene de lejos.'),
      ] },
      { title: 'Pagos y reservaciones', questions: [
        choice('a9', 9, '¿Cómo te pagan?', ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'], 'multi'), text('a10', 10, '¿Pides anticipo? ¿De cuánto?'), text('a11', 11, '¿Qué pasa si un cliente cancela?'), text('a12', 12, '¿Qué pasa si llueve o el clima no deja dar el servicio?'), text('a13', 13, '¿Tienes promociones?'),
      ] },
      { title: 'Preguntas de tus clientes', questions: [
        text('a14', 14, '¿Cómo se llega? ¿Hay estacionamiento?'), text('a15', 15, '¿Qué deben llevar tus clientes?'), text('a16', 16, '¿Aceptas mascotas? ¿Pueden ir niños?'), text('a17', 17, '¿Qué otra pregunta te hacen mucho y qué contestas?'),
      ] },
      { title: 'Tu agente', questions: [
        choice('a18', 18, '¿Qué datos debe pedirle al cliente?', ['Nombre', 'Adultos y niños', 'Fecha de visita', 'De dónde viene', 'Servicio que le interesa', 'Número de personas', 'Otro'], 'multi'),
        choice('a19', 19, '¿En qué casos debe pasarte la conversación?', ['Quiere reservar o pagar', 'Grupo de más de ____ personas', 'Pide hablar con una persona', 'Tiene una queja o quiere cancelar', 'Pide descuento', 'Hay una emergencia'], 'multi'),
        choice('a20', 20, '¿Cómo quieres que hable?', ['Amable y cercano', 'Con emojis (máximo 2)', 'Formal', 'Sin emojis'], 'multi'),
      ] },
    ],
  },
  {
    id: 'pinal-temporadas', version: 1, number: '06', title: '¿Cuándo vienen los turistas a Pinal?', short: 'Temporadas',
    category: 'PRÁCTICA 1 · PINAL', icon: 'compass', minutes: 30,
    description: 'Descubre en Google Trends en qué meses buscan Pinal de Amoles y prepara una promoción.',
    instructions: 'Hazlo desde tu celular. Sigue los pasos en orden, toma las capturas que se piden y súbelas en cada espacio. Cambia lo que está entre [corchetes] por los datos de tu negocio.',
    sections: [
      { title: 'Busca en Google Trends', description: `Abre <a href="${trendsUrl}" target="_blank" rel="noopener">este enlace de Google Trends ↗</a>. Toca el pico más alto de la gráfica para ver el mes y toma una captura de la gráfica.`, questions: [
        text('t1', 1, '¿Qué mes tiene el pico más alto?'),
        upload('t2', 2, 'Captura de tu gráfica'),
      ] },
      { title: 'Pregúntale a ChatGPT', prompt: 'Soy dueño de [tu negocio] en Pinal de Amoles. Te mando una gráfica de Google Trends de cuándo busca la gente Pinal de Amoles. Dime en qué meses hay más interés, cuándo debo publicar mis promociones y dame una promoción para mi negocio que aproveche el mar de nubes o los atractivos cercanos.', description: 'Abre ChatGPT, toca el +, adjunta tu captura de la gráfica y pega este prompt. Toma captura de la respuesta.', questions: [
        upload('t3', 3, 'Captura de la respuesta de ChatGPT'),
      ] },
      { title: 'Tu promoción', questions: [
        text('t4', 4, '¿Qué ofreces en tu promoción?'),
        text('t5', 5, '¿Cuándo la publicarías?'),
      ] },
    ],
  },
  {
    id: 'pinal-competencia', version: 1, number: '07', title: 'Investiga a tu competencia con IA', short: 'Competencia',
    category: 'PRÁCTICA 2 · PINAL', icon: 'spark', minutes: 35,
    description: 'Usa la investigación de ChatGPT para comparar precios de negocios como el tuyo.',
    instructions: 'Abre ChatGPT, toca el + y elige Investigación avanzada. Si no la tienes, usa Búsqueda en Internet o Grok con DeepSearch. Revisa siempre los enlaces: la IA puede equivocarse.',
    sections: [
      { title: 'Investiga con IA', prompt: 'Soy dueño de [tu negocio] en Pinal de Amoles, Querétaro. Busca en internet los precios actuales de negocios como el mío en el municipio. Dame una tabla con: nombre, precio entre semana, precio en fin de semana, qué incluye y el enlace de cada precio. No inventes datos: si no encuentras un precio, escribe "No encontrado".', description: 'Pega el prompt, toca Empezar y espera el resultado. Toma captura de la tabla.', questions: [
        upload('k1', 1, 'Captura de la tabla que te dio la IA'),
      ] },
      { title: 'Confirma los precios', description: 'Abre 2 enlaces de la tabla y revisa que el precio coincida.', questions: [
        text('k2', 2, '¿Qué precios confirmaste? ¿Coincidían con la tabla?'),
        upload('k3', 3, 'Captura o foto de 1 precio que confirmaste'),
      ] },
      { title: 'Tu diferencia', questions: [
        text('k4', 4, '¿En qué te puedes diferenciar de ellos?'),
      ] },
    ],
  },
  {
    id: 'pinal-precios', version: 1, number: '08', title: '¿Cuánto deberías cobrar?', short: 'Precios',
    category: 'PRÁCTICA 3 · PINAL', icon: 'layers', minutes: 25,
    description: 'Calcula una tarifa base con tus costos, tu margen y las comisiones que pagas.',
    instructions: 'Ten a la mano tus costos reales y una calculadora. Cambia lo que está entre [corchetes] por tus datos.',
    sections: [
      { title: 'Tus números', description: 'Anota tus costos por servicio: limpieza, luz, gas, insumos, mantenimiento y pago a quien te ayuda.', questions: [
        text('r1', 1, 'Tus costos por servicio', 'Escribe cada costo y el total.'),
        text('r2', 2, '¿Cuánto quieres ganar? (margen en %)'),
        text('r3', 3, '¿Cuánto pagas de comisión? (Booking, Airbnb, tarjeta, en %)'),
      ] },
      { title: 'Pregúntale a ChatGPT', prompt: 'Actúa como asesor financiero de pequeños negocios turísticos. Soy dueño de [tu negocio] en Pinal de Amoles. Mis costos por servicio son [cantidad], mi margen deseado sobre ventas es [porcentaje] y pago una comisión de [porcentaje]. Calcula una tarifa base, muestra la fórmula y plantea tres escenarios de precios. Explica qué información necesito antes de aplicarlos.', questions: [
        upload('r4', 4, 'Captura de la respuesta de ChatGPT'),
      ] },
      { title: 'Comprueba y llena tu tabla', description: 'Comprueba la cuenta con tu calculadora: <strong>Precio = Costo ÷ (1 − margen − comisión)</strong>. Ejemplo: costo $600, margen 30% y comisión 15% → 600 ÷ 0.55 = $1,091.', questions: [
        text('r5', 5, 'Precio en temporada baja'),
        text('r6', 6, 'Precio en temporada media'),
        text('r7', 7, 'Precio en temporada alta'),
        upload('r8', 8, 'Foto de tu tabla de precios por temporada'),
      ] },
    ],
  },
  {
    id: 'pinal-estrategia', version: 1, number: '09', title: 'Tu estrategia para atraer clientes', short: 'Estrategia',
    category: 'PRÁCTICA 4 · PINAL', icon: 'message', minutes: 25,
    description: 'Junta lo que encontraste y arma una propuesta con 3 acciones para el próximo mes.',
    instructions: 'Junta lo que encontraste en las prácticas 1, 2 y 3: meses de más interés, tu tabla de competencia y tus precios por temporada.',
    sections: [
      { title: 'Arma tu propuesta', prompt: 'Soy dueño de [tu negocio] en Pinal de Amoles. Con esta información: [meses de más interés], [mi tabla de competencia] y [mis precios por temporada], ayúdame a crear una propuesta sencilla: qué promover, a quién, a qué precio y cómo diferenciarme. Dame 3 acciones para el próximo mes.', questions: [
        upload('e1', 1, 'Captura de la propuesta de ChatGPT'),
      ] },
      { title: 'Tus 3 acciones para el próximo mes', description: 'Quédate solo con las acciones que sí puedes hacer.', questions: [
        text('e2', 2, 'Acción 1'),
        text('e3', 3, 'Acción 2'),
        text('e4', 4, 'Acción 3'),
      ] },
    ],
  },
  {
    id: 'pinal-cierre', version: 1, number: '10', title: 'Cierre · Mi estrategia turística con IA', short: 'Cierre',
    category: 'CIERRE · PINAL', icon: 'bot', minutes: 10,
    description: 'Resume lo que aprendiste y la acción que aplicarás en tu negocio.',
    instructions: 'Contesta con tus palabras. Puedes escribir aquí tus respuestas o subir una foto de tu ficha.',
    sections: [
      { title: 'Contesta', questions: [
        text('z1', 1, '¿Qué tipo de negocio tienes?'),
        text('z2', 2, '¿Qué descubrí de mi competencia o de la demanda?'),
        text('z3', 3, '¿Qué precio o estrategia voy a probar?'),
        text('z4', 4, '¿Qué acción aplicaré en mi negocio?'),
      ] },
      { title: 'Tu ficha', questions: [
        upload('z5', 5, 'Foto de tu ficha', 'Opcional si ya escribiste tus respuestas.'),
      ] },
    ],
  },
  ...tourismActivities,
];

// Complementary fields retain the PDF's open "Otro" and group-size blanks.
export const extraFields = {
  a1: { id: 'a1_other', label: 'Si elegiste Otro, ¿qué tipo de negocio?' },
  a9: { id: 'a9_other', label: 'Otro método de pago' },
  a18: { id: 'a18_other', label: 'Otros datos que debe pedir' },
  a19: { id: 'a19_group', label: '¿A partir de cuántas personas debe pasarte un grupo?' },
};
export const getQuestions = form => form.sections.flatMap(s => s.questions);
export const activeForms = () => forms.filter(form => !form.retired);
// Preguntas que guardan una respuesta (excluye los espacios para subir archivos).
export const getAnswerQuestions = form => getQuestions(form).filter(q => q.type !== 'upload');
export const getUploadSlots = form => getQuestions(form).filter(q => q.type === 'upload');
