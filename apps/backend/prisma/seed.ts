import { Phase, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_EMAIL = 'test@lunae.app';
const TEST_PASSWORD = 'Test1234!';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function phaseForDay(day: number, periodDuration: number, ovulationDay: number): Phase {
  if (day < periodDuration) return Phase.menstruation;
  if (day < ovulationDay - 1) return Phase.follicular;
  if (day <= ovulationDay + 1) return Phase.ovulation;
  return Phase.luteal;
}

function calculatePhases(startDate: Date, cycleLength: number, periodDuration: number) {
  const ovulationDay = cycleLength - 14;
  const entries: { date: Date; phase: Phase; cycleDay: number }[] = [];
  for (let day = 0; day < cycleLength; day++) {
    entries.push({
      date: addDays(startDate, day),
      phase: phaseForDay(day, periodDuration, ovulationDay),
      cycleDay: day + 1,
    });
  }
  return entries;
}

interface DemoEvent {
  calendar: 'personal' | 'work' | 'sport';
  title: string;
  dayOffset: number;
  startHour: number;
  durationHours: number;
  eventType:
    | 'meeting'
    | 'class'
    | 'sport_intense'
    | 'sport_leger'
    | 'focus_administratif'
    | 'creation_planification'
    | 'social_enjeu'
    | 'personal'
    | 'other';
  isMovable?: boolean;
  isAllDay?: boolean;
}

const DEMO_EVENTS: DemoEvent[] = [
  { calendar: 'work', title: 'Comité de pilotage mensuel', dayOffset: -7, startHour: 9, durationHours: 1, eventType: 'meeting' },
  { calendar: 'personal', title: 'Rangement appartement', dayOffset: -5, startHour: 10, durationHours: 2, eventType: 'other' },
  { calendar: 'work', title: 'Réunion équipe produit hebdomadaire', dayOffset: -2, startHour: 9, durationHours: 1, eventType: 'meeting' },
  { calendar: 'personal', title: 'Rendez-vous dentiste', dayOffset: -1, startHour: 14, durationHours: 1, eventType: 'other' },
  { calendar: 'sport', title: 'Cours de boxe', dayOffset: 0, startHour: 18, durationHours: 1, eventType: 'sport_intense', isMovable: true },
  { calendar: 'personal', title: 'Anniversaire de Camille', dayOffset: 0, startHour: 20, durationHours: 2, eventType: 'personal' },
  { calendar: 'work', title: 'Point 1:1 avec manager', dayOffset: 1, startHour: 11, durationHours: 1, eventType: 'meeting' },
  { calendar: 'work', title: 'Présentation client Atos', dayOffset: 2, startHour: 15, durationHours: 1, eventType: 'social_enjeu', isMovable: false },
  { calendar: 'sport', title: 'Séance de yoga du matin', dayOffset: 3, startHour: 7, durationHours: 1, eventType: 'sport_leger' },
  { calendar: 'personal', title: 'Déjeuner avec Sarah', dayOffset: 3, startHour: 12, durationHours: 1, eventType: 'personal' },
  { calendar: 'work', title: 'Sprint planning', dayOffset: 4, startHour: 10, durationHours: 1, eventType: 'meeting' },
  { calendar: 'sport', title: 'Course à pied 10km', dayOffset: 5, startHour: 8, durationHours: 1, eventType: 'sport_intense' },
  { calendar: 'personal', title: 'Cinéma avec Julie et les copines', dayOffset: 6, startHour: 20, durationHours: 2, eventType: 'personal' },
  { calendar: 'work', title: 'Revue de code trimestrielle', dayOffset: 7, startHour: 14, durationHours: 1, eventType: 'focus_administratif' },
  { calendar: 'work', title: 'Formation React Native', dayOffset: 8, startHour: 9, durationHours: 3, eventType: 'creation_planification' },
  { calendar: 'sport', title: 'Cours de pilates', dayOffset: 9, startHour: 18, durationHours: 1, eventType: 'sport_leger' },
  { calendar: 'personal', title: 'Weekend chez mes parents', dayOffset: 10, startHour: 8, durationHours: 12, eventType: 'personal', isAllDay: true },
  { calendar: 'work', title: 'Entretien annuel RH', dayOffset: 12, startHour: 10, durationHours: 1, eventType: 'meeting' },
  { calendar: 'sport', title: 'Match de tennis', dayOffset: 13, startHour: 17, durationHours: 1, eventType: 'sport_intense' },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: { passwordHash },
    create: {
      email: TEST_EMAIL,
      passwordHash,
      firstName: 'Lucie',
      lastName: 'Martin',
    },
  });

  // Reseed idempotent : on repart d'un état propre pour cet utilisateur de démo.
  await prisma.event.deleteMany({ where: { userId: user.id } });
  await prisma.calendar.deleteMany({ where: { userId: user.id } });
  await prisma.cyclePhase.deleteMany({ where: { userId: user.id } });
  await prisma.cycleEntry.deleteMany({ where: { userId: user.id } });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const cycleLength = 28;
  const periodDuration = 5;
  // Cycle courant démarré 13 jours avant aujourd'hui → "aujourd'hui" tombe en ovulation (vert),
  // avec menstruation/folliculaire dans le passé récent et lutéale à venir, visibles sur la grille du mois.
  const currentCycleStart = addDays(today, -13);
  // Cycle précédent, cohérent (même durée), enchaîné juste avant : donne de l'historique pour
  // predictNextPeriod() et étend la couverture des phases pour tester la navigation mois
  // précédent/suivant.
  const previousCycleStart = addDays(currentCycleStart, -cycleLength);
  // Cycle suivant, enchaîné juste après le cycle courant (donc après le dernier événement
  // seedé, dayOffset max 13) : garantit qu'il existe toujours une phase favorable à venir vers
  // laquelle déplacer un événement, même pour ceux déjà en fin de couverture du cycle courant.
  const nextCycleStart = addDays(currentCycleStart, cycleLength);

  await prisma.cycleEntry.createMany({
    data: [
      { userId: user.id, startDate: previousCycleStart, cycleLength, periodDuration },
      { userId: user.id, startDate: currentCycleStart, cycleLength, periodDuration },
      { userId: user.id, startDate: nextCycleStart, cycleLength, periodDuration },
    ],
  });

  const phases = [
    ...calculatePhases(previousCycleStart, cycleLength, periodDuration),
    ...calculatePhases(currentCycleStart, cycleLength, periodDuration),
    ...calculatePhases(nextCycleStart, cycleLength, periodDuration),
  ];
  await prisma.cyclePhase.createMany({
    data: phases.map((p) => ({
      userId: user.id,
      date: p.date,
      phase: p.phase,
      cycleDay: p.cycleDay,
    })),
    skipDuplicates: true,
  });

  const [personal, work, sport] = await Promise.all([
    prisma.calendar.create({ data: { userId: user.id, name: 'Personnel', color: '#6B3FA0' } }),
    prisma.calendar.create({ data: { userId: user.id, name: 'Travail', color: '#2E8B57' } }),
    prisma.calendar.create({ data: { userId: user.id, name: 'Sport', color: '#D9822B' } }),
  ]);
  const calendarByKey = { personal, work, sport };

  function at(dayOffset: number, hour: number): Date {
    const d = addDays(today, dayOffset);
    d.setUTCHours(hour, 0, 0, 0);
    return d;
  }

  await prisma.event.createMany({
    data: DEMO_EVENTS.map((e) => ({
      userId: user.id,
      calendarId: calendarByKey[e.calendar].id,
      title: e.title,
      startAt: at(e.dayOffset, e.startHour),
      endAt: at(e.dayOffset, e.startHour + e.durationHours),
      eventType: e.eventType,
      isAllDay: e.isAllDay ?? false,
      isMovable: e.isMovable ?? true,
    })),
  });

  console.log(`Utilisateur de démo prêt : ${TEST_EMAIL} / ${TEST_PASSWORD}`);
  console.log(`${DEMO_EVENTS.length} événements + 3 cycles (${phases.length} jours de phase) créés.`);
  console.log('Le code OTP de connexion sera affiché dans les logs du backend (SMTP non configuré).');
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
