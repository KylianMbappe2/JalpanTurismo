// Conserva los identificadores anteriores para consultar entregas y borradores.
export const mainActivityIds = ['diagnostico', 'prompt-conjunto', 'calendario-contenido', 'flyers-ia', 'tema4-perfiles', 'agente-ia'];
export const isMainActivity = activity => mainActivityIds.includes(activity.id);
export const isArchivedActivity = activity => !isMainActivity(activity) || activity.is_published === false;
export const courseOrder = (a, b) => {
  const rank = activity => isMainActivity(activity) ? mainActivityIds.indexOf(activity.id) : 100 + (activity.position ?? 0);
  return rank(a) - rank(b);
};
export const activityTopics = {
  diagnostico: 'Temas I y II · Punto de partida',
  'prompt-conjunto': 'Temas I, II y III · Prompts, precios, competencia y temporadas',
  'calendario-contenido': 'Tema IV · 4.1.1 y 4.1.3 · Contenido para redes',
  'flyers-ia': 'Tema IV · 4.1.2 · Fotos y flyers con IA',
  'tema4-perfiles': 'Tema IV · 4.2.1, 4.2.2, 4.2.3 y 4.3 · Perfiles turísticos',
  'agente-ia': 'Tema II · 2.2 · Atención por WhatsApp',
};
