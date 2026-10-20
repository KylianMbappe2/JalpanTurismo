const text = (id, number, label, hint = '', required = false) => ({ id, number, label, hint, type: 'text', required });
const choice = (id, number, label, options, type = 'radio', required = false) => ({ id, number, label, options, type, required });
const check = (id, label) => ({ id, label, type: 'check', required: false });

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
    id: 'whatsapp', version: 1, number: '02', title: 'WhatsApp Business', short: 'WhatsApp',
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
    category: 'PRÁCTICA', icon: 'layers', minutes: 20, source: 'Practica_Meta_Business_Suite.pdf',
    description: 'Lleva tus mensajes automáticos a Facebook e Instagram y comprueba que funcionen.',
    instructions: 'Solo si tu negocio tiene página de Facebook o cuenta de Instagram. Usa los mismos textos de tu WhatsApp. Al terminar, manda una captura al grupo del curso.',
    sections: [
      { title: 'Encuentra las automatizaciones', description: 'Entra a Meta Business Suite → Bandeja de entrada y toca el ícono parecido a un átomo.', questions: [choice('m1', 1, 'Canal de la práctica', ['Messenger', 'Instagram', 'Ambos', 'No aplica: mi negocio no tiene estas cuentas'])] },
      { title: 'Respuesta automática', description: 'Activa el interruptor, elige el canal, escribe tu saludo, revisa la vista previa y guarda los cambios.', questions: [text('m2', 2, 'Tu saludo automático', 'Espacio para registrar el texto que preparaste.')] },
      { title: 'Mensaje de ausencia', description: 'Activa el interruptor, elige los días que no atiendes, zona horaria Ciudad de México y horario de ausencia. Guarda los cambios.', questions: [text('m3', 3, 'Tu mensaje de ausencia', 'Espacio para registrar el texto que preparaste.')] },
      { title: 'Prueba', description: 'Escríbele a tu página desde otra cuenta y revisa qué recibes.', questions: [check('m4', 'Respuesta automática activa'), check('m5', 'Mensaje de ausencia activo'), check('m6', 'Captura enviada al grupo')] },
    ],
  },
  {
    id: 'agente-ia', version: 1, number: '05', title: 'Tu agente de IA', short: 'Agente de IA',
    category: 'PRÁCTICA FINAL', icon: 'bot', minutes: 45, source: 'Practica_Agente_IA_WhatsApp.pdf',
    description: 'Reúne los datos de tu negocio para preparar tu agente de IA en WhatsApp Business.',
    instructions: 'Contesta con los datos reales de tu negocio. Con tus respuestas vas a armar las instrucciones (el prompt) de tu agente de IA en WhatsApp Business: Herramientas → Agente de IA. Si no sabes una respuesta, déjala en blanco y pregúntala en clase.',
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
];

// Complementary fields retain the PDF's open "Otro" and group-size blanks.
export const extraFields = {
  a1: { id: 'a1_other', label: 'Si elegiste Otro, ¿qué tipo de negocio?' },
  a9: { id: 'a9_other', label: 'Otro método de pago' },
  a18: { id: 'a18_other', label: 'Otros datos que debe pedir' },
  a19: { id: 'a19_group', label: '¿A partir de cuántas personas debe pasarte un grupo?' },
};
export const getQuestions = form => form.sections.flatMap(s => s.questions);
