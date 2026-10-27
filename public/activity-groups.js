import { isArchivedActivity, courseOrder } from './course-plan.js';

export const activityGroups = [
  { id: 'course', title: 'Actividades del curso', description: 'Completa las actividades del curso en orden.' },
  { id: 'extras', title: 'Extras · Tus trabajos anteriores', description: 'Conservamos tus borradores y entregas anteriores. Las equivalencias reconocidas también aparecen junto a su actividad principal.' },
];
export const activityGroup = activity => isArchivedActivity(activity) ? 'extras' : 'course';
export const groupedActivities = activities => activityGroups.map(group => ({ ...group, activities: activities.filter(activity => activityGroup(activity) === group.id).sort(courseOrder) })).filter(group => group.id === 'course' || group.activities.length);
