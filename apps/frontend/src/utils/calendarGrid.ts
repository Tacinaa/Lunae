export const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

/**
 * Clés de date (une par jour) couvertes par un événement. Les événements journée entière
 * suivent la convention Google (endAt = jour suivant le dernier jour, exclusif) ; les
 * événements horodatés sont traités bornes incluses (rare en pratique côté événements
 * locaux, mais couvre le cas d'un événement chevauchant minuit).
 */
export function dateKeysInRange(startAt: Date, endAt: Date, endExclusive: boolean): string[] {
  const start = new Date(Date.UTC(startAt.getUTCFullYear(), startAt.getUTCMonth(), startAt.getUTCDate()));
  const endBoundary = new Date(Date.UTC(endAt.getUTCFullYear(), endAt.getUTCMonth(), endAt.getUTCDate()));

  const keys: string[] = [];
  const cursor = new Date(start);
  while (
    endExclusive ? cursor.getTime() < endBoundary.getTime() : cursor.getTime() <= endBoundary.getTime()
  ) {
    keys.push(toDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys.length > 0 ? keys : [toDateKey(start)];
}

/** Grille de 6 semaines (lundi→dimanche) couvrant intégralement le mois donné. */
export function getMonthMatrix(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const mondayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const cursor = new Date(firstOfMonth);
  cursor.setUTCDate(cursor.getUTCDate() - mondayOffset);

  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
