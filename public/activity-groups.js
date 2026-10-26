export const activityGroups = [
  { id: 'session1', title: 'Sesión 1', description: 'Tus actividades de la primera sesión.' },
  { id: 'session2', title: 'Sesión 2 · Actividades de hoy', description: 'Precios, competencia y temporadas para tu negocio de Pinal de Amoles.' },
  { id: 'tema4', title: 'Tema IV · Perfiles turísticos', description: 'Cierra el bloque con tu ficha maestra y tus perfiles de Google Maps y Airbnb.' },
  { id: 'extras', title: 'Extras', description: 'Prácticas anteriores de la sesión 2. Son opcionales; puedes retomarlas con tus borradores y entregas.' },
];

export function activityGroup(activity) {
  if (activity.id?.startsWith('tema4-')) return 'tema4';
  if (activity.id?.startsWith('sesion2-')) return 'session2';
  if (activity.id?.startsWith('pinal-')) return 'extras';
  return 'session1';
}

export const groupedActivities = activities => activityGroups.map(group => ({ ...group, activities: activities.filter(activity => activityGroup(activity) === group.id) }));
