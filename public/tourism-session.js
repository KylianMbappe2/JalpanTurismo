// Prompt proporcionado para la sesión 2. La IA lo resuelve con los datos y la gráfica del alumno.
export const tourismPrompt = `Actúa como asesor experto en turismo y finanzas para pequeños negocios de Pinal de Amoles, en la Sierra Gorda de Querétaro.

MI NEGOCIO
- Nombre y tipo: [nombre], [cabañas / restaurante / tours / otro]
- Localidad: [localidad], Pinal de Amoles
- Atractivo más cercano: [Cuatro Palos / Chuveje / Mirador de Cristal / otro]
- Meses en que más clientes tengo: [meses]
- Meses en que menos clientes tengo: [meses]
- Mi precio entre semana: $[ ]
- Mi precio fin de semana: $[ ]
- Lo que incluyo: [servicios]

MIS COSTOS POR CADA SERVICIO VENDIDO (por noche, platillo o persona)
- Limpieza y lavandería: $[ ]
- Luz, gas y agua: $[ ]
- Insumos o amenidades: $[ ]
- Mantenimiento: $[ ]
- Pago a quien me ayuda: $[ ]
- Otros: $[ ]
- Ganancia que quiero sobre cada venta: [ ]%
- Comisión que pago (Booking, Airbnb o tarjeta; 0 si vendo directo): [ ]%

Te adjunto una gráfica de Google Trends de cuándo busca la gente Pinal de Amoles.

HAZ ESTO EN 3 PARTES:

PARTE 1 · MI TABLA DE PRECIOS
1. Suma mis costos totales.
2. Calcula mi precio mínimo con la fórmula: Precio = Costo ÷ (1 − margen − comisión). Muestra la cuenta paso a paso.
3. Hazme una tabla de precios para temporada baja, media y alta, sin bajar nunca de mi precio mínimo, y explica cada precio.
4. Dame una promoción para temporada baja que no me haga perder dinero.

PARTE 2 · COMPARACIÓN CON MI COMPETENCIA
1. Busca en internet al menos 3 negocios como el mío en Pinal de Amoles, con su precio entre semana, fin de semana, qué incluyen y el enlace de cada precio.
2. Haz una tabla comparando mis precios con los de ellos.
3. Dime si estoy caro, en el promedio o barato, y por cuánto.
4. Dime qué ofrecen ellos que yo no, y qué ofrezco yo que ellos no.
5. Dame 3 ideas para diferenciarme sin bajar mi precio.

PARTE 3 · MIS TEMPORADAS ALTAS Y BAJAS
1. Hazme un calendario de los 12 meses marcando temporada alta, media y baja para mi negocio, usando la gráfica de Google Trends y mis datos.
2. Incluye vacaciones, puentes, fiestas de Pinal y la temporada del mar de nubes.
3. Dime cuándo debo publicar mis promociones antes de cada temporada alta.

AL FINAL
- Une todo en una tabla final: temporada, meses, mi precio sugerido y qué promoción usar.

REGLAS
- No inventes datos. Si no encuentras un precio, escribe "No encontrado". Si algo no lo sabes con certeza, dime qué debo confirmar.
- Usa tablas sencillas y lenguaje fácil.
- Responde en español.`;

const text = (id, number, label, hint = '') => ({ id, number, label, hint, type: 'text', required: false });
const upload = (id, number, label, hint = '') => ({ id, number, label, hint, type: 'upload', required: false });
const promptSection = () => ({ title: 'El prompt completo de la sesión', description: 'Cópialo, reemplaza los corchetes por tus datos y adjunta la gráfica en la IA. Usa la misma conversación para las tres partes. Después guarda aquí cada resultado.', prompt: tourismPrompt, promptFold: true, questions: [] });
const instructions = 'Trabaja con tu negocio real. Puedes pegar tablas como texto o subir una captura, foto o documento. Guarda tu avance y entrega cuando termines. Las prácticas anteriores siguen disponibles en Extras.';

export const tourismActivities = [
  {
    id: 'sesion2-precios', version: 1, number: 'S2.1', title: 'Mi tabla de precios por temporada', short: 'Precios de mi negocio',
    category: 'SESIÓN 2 · PARTE 1', icon: 'layers', minutes: 35,
    description: 'Reúne tus datos, calcula tu precio mínimo y prepara precios y una promoción por temporada.',
    instructions,
    sections: [
      { title: 'Prepara los datos de tu negocio', description: 'Anota las cantidades por un mismo servicio: una noche, un platillo o una persona. Usa estos datos para completar el prompt.', questions: [
        text('sp1', 1, 'Nombre y tipo de mi negocio'),
        text('sp2', 2, 'Mi localidad y el atractivo más cercano'),
        text('sp3', 3, 'Mis meses con más clientes y con menos clientes'),
        text('sp4', 4, 'Mis precios entre semana, de fin de semana y lo que incluyo'),
        text('sp5', 5, 'Mis costos por cada servicio vendido', 'Limpieza y lavandería; luz, gas y agua; insumos; mantenimiento; ayuda y otros. Anota cada importe.'),
        text('sp6', 6, 'Mi ganancia deseada sobre la venta y mi comisión, en %', 'Si vendes directo sin comisión, anota 0 en comisión.'),
        upload('sp7', 7, 'Gráfica de Google Trends', 'Sube la gráfica que adjuntarás en la IA. Puedes usar la práctica de Google Trends que está en Extras.'),
      ] },
      promptSection(),
      { title: 'Parte 1 · Mi tabla de precios', description: 'Revisa que la IA use Precio = Costo ÷ (1 − margen − comisión), muestre la cuenta y no sugiera precios inferiores al mínimo. Expresa los porcentajes como decimales para comprobarla. Si margen y comisión suman 100% o más, corrige esos datos antes de calcular.', questions: [
        text('sp8', 8, 'Mis costos totales'),
        text('sp9', 9, 'Mi precio mínimo y la cuenta paso a paso'),
        text('sp10', 10, 'Mi tabla de precios de temporada baja, media y alta', 'Incluye el precio y la explicación de cada uno.'),
        text('sp11', 11, 'Mi promoción de temporada baja sin perder dinero'),
        upload('sp12', 12, 'Evidencia de mi tabla de precios', 'Captura, foto o documento con la respuesta revisada.'),
      ] },
    ],
  },
  {
    id: 'sesion2-competencia', version: 1, number: 'S2.2', title: 'Compara mi negocio con 3 competidores', short: 'Mi competencia',
    category: 'SESIÓN 2 · PARTE 2', icon: 'spark', minutes: 30,
    description: 'Compara precios con enlaces verificables y elige tres formas de diferenciarte sin bajar tu tarifa.',
    instructions,
    sections: [
      promptSection(),
      { title: 'Parte 2 · Compara y verifica', description: 'Continúa la misma conversación de la parte 1. Pide que busque en internet y abre los enlaces de los precios. Si no hay un precio publicado, conserva “No encontrado”. Compara servicios equivalentes y anota las fechas de consulta.', questions: [
        text('sc1', 1, 'Mi negocio y los precios que voy a comparar'),
        text('sc2', 2, 'Mi tabla con al menos 3 competidores y enlaces', 'Por negocio: nombre, precio entre semana, precio de fin de semana, qué incluye y enlace de cada precio.'),
        text('sc3', 3, '¿Estoy caro, en el promedio o barato? ¿Por cuánto?'),
        text('sc4', 4, 'Qué ofrecen ellos que yo no y qué ofrezco yo que ellos no'),
        text('sc5', 5, 'Mis 3 ideas para diferenciarme sin bajar mi precio'),
        text('sc6', 6, 'Precios no encontrados y datos que debo confirmar'),
        upload('sc7', 7, 'Evidencia de mi comparación y sus fuentes'),
      ] },
    ],
  },
  {
    id: 'sesion2-temporadas', version: 1, number: 'S2.3', title: 'Mi calendario de temporadas y plan final', short: 'Mi calendario y plan',
    category: 'SESIÓN 2 · PARTE 3 Y CIERRE', icon: 'compass', minutes: 30,
    description: 'Planea los 12 meses y une temporada, meses, precio sugerido y promoción en una sola tabla.',
    instructions,
    sections: [
      promptSection(),
      { title: 'Parte 3 · Mis temporadas altas y bajas', description: 'Usa tu gráfica y tus meses reales de ventas. Pide a la IA que identifique las fechas que debes confirmar, incluyendo vacaciones, puentes, fiestas de Pinal y mar de nubes.', questions: [
        text('st1', 1, 'Mi calendario de los 12 meses', 'Marca alta, media o baja en cada mes y explica en qué datos te basaste.'),
        text('st2', 2, 'Vacaciones, puentes, fiestas de Pinal y mar de nubes', 'Anota el año, las fuentes y lo que todavía falta confirmar.'),
        text('st3', 3, 'Cuándo publicaré mis promociones antes de cada temporada alta'),
        upload('st6', 4, 'Mi gráfica de Google Trends para el calendario'),
      ] },
      { title: 'Mi tabla final', description: 'Une lo trabajado en las tres partes. La tabla debe tener cuatro columnas: temporada, meses, mi precio sugerido y qué promoción usar.', questions: [
        text('st4', 5, 'Mi tabla final: temporada, meses, precio y promoción'),
        text('st5', 6, 'Lo que debo confirmar antes de aplicar mi plan'),
        upload('st7', 7, 'Evidencia de mi calendario y tabla final'),
      ] },
    ],
  },
];
