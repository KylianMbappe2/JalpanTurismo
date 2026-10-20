// Arma prompts a partir de las respuestas del alumno. Solo usa los datos que escribió; nada se inventa.
const clean = value => (Array.isArray(value) ? value.join(', ') : String(value ?? '')).trim().replace(/\s+\n/g, '\n');
const sentence = value => { const text = clean(value).replace(/[.。]+$/, ''); return text ? `${text}.` : ''; };

export const ingredients = [
  { id: 'quien', label: 'Quién eres', test: /\b(soy|somos|tengo|dueñ[oa]|atiendo|trabajo en)\b/i },
  { id: 'oferta', label: 'Qué ofreces', test: /\$\s?\d|\b(ofrezco|ofrecemos|vendo|vendemos|tenemos|servicios?|precios?|cabañas?|tours?|recorridos?|comida|platillos?|hospedaje)\b/i },
  { id: 'necesidad', label: 'Qué necesitas', test: /\b(escribe|escríbeme|dame|crea|haz|hazme|ayúdame|genera|redacta|calcula|necesito|quiero)\b/i },
  { id: 'tono', label: 'Tono', test: /\b(tono|amable|formal|cercano|divertido|directo|breve|profesional|emojis?)\b/i },
  { id: 'formato', label: 'Formato', test: /\b(máximo|maximo|líneas?|lineas?|lista|tabla|viñetas|palabras|párrafos?|publicación|mensajes? cortos?|formato)\b/i },
];
export const promptIngredients = text => ingredients.map(item => ({ ...item, ok: item.test.test(String(text ?? '')) }));

export function buildImprovedPrompt(answers = {}) {
  const parts = [
    sentence(answers.g3),
    clean(answers.g4) ? `Ofrezco: ${sentence(answers.g4)}` : '',
    clean(answers.g5) ? `Tu tarea: ${sentence(answers.g5)}` : '',
    clean(answers.g6) ? `Usa un tono ${clean(answers.g6).toLowerCase()}.` : '',
    clean(answers.g7) ? `Formato: ${sentence(answers.g7)}` : '',
    'No inventes datos: si te falta información, pregúntame.',
  ];
  return parts.filter(Boolean).join(' ');
}

// Prompt del agente de IA de WhatsApp Business con las respuestas de la actividad "Tu agente de IA".
export function buildAgentPrompt(answers = {}) {
  const a = key => clean(answers[key]);
  const type = a('a1') === 'Otro' ? a('a1_other') || 'negocio turístico' : a('a1') || 'negocio turístico';
  const name = a('a2') || 'mi negocio';
  const line = (label, value) => value ? `- ${label}: ${value}` : '';
  const block = (title, lines) => { const body = lines.filter(Boolean); return body.length ? `## ${title}\n${body.join('\n')}` : ''; };
  const payments = [a('a9'), a('a9_other')].filter(Boolean).join(', ');
  const ask = [a('a18'), a('a18_other')].filter(Boolean).join(', ');
  const handoff = a('a19').replace('Grupo de más de ____ personas', a('a19_group') ? `Grupo de más de ${a('a19_group')} personas` : 'Grupo grande');
  return [
    `Eres el asistente virtual de ${name}, ${type.toLowerCase()}${a('a3') ? ` ubicado en ${a('a3')}` : ''}. Atiendes a los clientes por WhatsApp en español.`,
    block('Datos del negocio', [line('Horario de atención', a('a4')), line('Teléfono y redes sociales', a('a5'))]),
    block('Servicios y precios', [a('a6') ? a('a6') : '', line('Niños', a('a7')), line('Recomendaciones', a('a8'))]),
    block('Pagos y reservaciones', [line('Formas de pago', payments), line('Anticipo', a('a10')), line('Cancelaciones', a('a11')), line('Si llueve o el clima no lo permite', a('a12')), line('Promociones', a('a13'))]),
    block('Preguntas frecuentes', [line('Cómo llegar y estacionamiento', a('a14')), line('Qué deben llevar', a('a15')), line('Mascotas y niños', a('a16')), line('Otra pregunta frecuente', a('a17'))]),
    block('Cómo debes atender', [
      line('Forma de hablar', a('a20')),
      line('Datos que debes pedir al cliente', ask),
      line('Pasa la conversación a una persona cuando', handoff),
      '- Responde corto y claro, como en un chat.',
      '- Nunca inventes precios, disponibilidad ni datos que no estén aquí. Si no sabes algo, dilo y ofrece pasar con una persona.',
    ]),
  ].filter(Boolean).join('\n\n');
}
