import { isMainActivity, courseOrder } from './course-plan.js';

export const activityGroups = [
  { id: 'course', title: 'Actividades del curso', description: 'Completa estos seis trabajos en orden.' },
  { id: 'extras', title: 'Extras · Tus trabajos anteriores', description: 'Conservamos tus borradores y entregas anteriores. No cuentan en el avance de las seis actividades.' },
];
export const activityGroup = activity => isMainActivity(activity) ? 'course' : 'extras';
export const groupedActivities = activities => activityGroups.map(group => ({ ...group, activities: activities.filter(activity => activityGroup(activity) === group.id).sort(courseOrder) })).filter(group => group.id === 'course' || group.activities.length);
