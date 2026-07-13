import {
  isOptimalPhase,
  isUnfavorablePhase,
  maxScoreForCategory,
  scoreForPhase,
} from './phaseRecommendation';

describe('scoreForPhase()', () => {
  it('sport_intense — optimal en ovulation, déconseillé en menstruation', () => {
    expect(scoreForPhase('sport_intense', 'ovulation')).toBe(3);
    expect(scoreForPhase('sport_intense', 'menstruation')).toBe(0);
  });

  it('sport_leger — optimal en menstruation, contrairement au sport intense', () => {
    expect(scoreForPhase('sport_leger', 'menstruation')).toBe(3);
    expect(scoreForPhase('sport_leger', 'ovulation')).toBe(1);
  });

  it('focus_administratif — optimal en lutéale, pas en ovulation', () => {
    expect(scoreForPhase('focus_administratif', 'luteal')).toBe(3);
    expect(scoreForPhase('focus_administratif', 'ovulation')).toBe(1);
  });

  it('catégorie neutre (other) — retombe sur la table générique', () => {
    expect(scoreForPhase('other', 'ovulation')).toBe(3);
    expect(scoreForPhase('other', 'menstruation')).toBe(0);
  });
});

describe('maxScoreForCategory()', () => {
  it('sport_intense → 3', () => {
    expect(maxScoreForCategory('sport_intense')).toBe(3);
  });

  it('focus_administratif → 3 (atteint en lutéale)', () => {
    expect(maxScoreForCategory('focus_administratif')).toBe(3);
  });
});

describe('isOptimalPhase()', () => {
  it('sport_intense en ovulation → true (score = max)', () => {
    expect(isOptimalPhase('sport_intense', 'ovulation')).toBe(true);
  });

  it('sport_intense en folliculaire → false (score 2 < max 3)', () => {
    expect(isOptimalPhase('sport_intense', 'follicular')).toBe(false);
  });

  it('focus_administratif en lutéale → true, alors que ce n\'est pas optimal pour sport_intense', () => {
    expect(isOptimalPhase('focus_administratif', 'luteal')).toBe(true);
    expect(isOptimalPhase('sport_intense', 'luteal')).toBe(false);
  });

  it('phase null/undefined → false', () => {
    expect(isOptimalPhase('sport_intense', null)).toBe(false);
    expect(isOptimalPhase('sport_intense', undefined)).toBe(false);
  });
});

describe('isUnfavorablePhase()', () => {
  it('sport_intense en menstruation → true (score 0 < max 3)', () => {
    expect(isUnfavorablePhase('sport_intense', 'menstruation')).toBe(true);
  });

  it('sport_intense en ovulation → false (déjà optimal)', () => {
    expect(isUnfavorablePhase('sport_intense', 'ovulation')).toBe(false);
  });

  it('focus_administratif en ovulation → true, alors que ovulation est "généralement bonne"', () => {
    expect(isUnfavorablePhase('focus_administratif', 'ovulation')).toBe(true);
  });

  it('phase null/undefined → false', () => {
    expect(isUnfavorablePhase('sport_intense', null)).toBe(false);
    expect(isUnfavorablePhase('sport_intense', undefined)).toBe(false);
  });
});
