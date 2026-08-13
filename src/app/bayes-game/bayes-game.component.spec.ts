import { BayesGameComponent, validateBayesCases } from './bayes-game.component';

describe('BayesGameComponent', () => {
  it('offers ten cases that cover mapping and assertion ambiguity', () => {
    const game = new BayesGameComponent();

    expect(game.cases).toHaveLength(10);
    expect(game.cases.map((item) => item.literal)).toEqual(
      expect.arrayContaining(['SatO2 91%', 'fiebre', 'diabetes tipo 2'])
    );
    expect(game.cases.filter((item) => item.answer === null)).toHaveLength(2);
  });

  it('updates posterior probabilities as contextual evidence is revealed', () => {
    const game = new BayesGameComponent();

    expect(game.posterior()[0]).toBeCloseTo(0.55, 2);
    expect(game.informationIndex()).toBeGreaterThan(0.8);

    game.revealEvidence();
    game.revealEvidence();

    expect(game.posterior()[0]).toBeGreaterThan(0.95);
    expect(game.informationIndex()).toBeLessThan(0.35);
  });

  it('recalculates the same Bayesian model explicitly when requested', () => {
    const game = new BayesGameComponent();
    const before = game.posterior();

    game.revealEvidence();
    game.recalculateProbabilities();

    expect(game.recalculationCount()).toBe(1);
    expect(game.posterior()).not.toEqual(before);
    expect(game.feedback()).toContain('evento independiente');
  });

  it('scores a correct mapping and attribute decision', () => {
    const game = new BayesGameComponent();

    game.selectCandidate(0);
    game.setCertainty('Confirmado');
    game.submitDecision();

    expect(game.locked()).toBe(true);
    expect(game.score()).toBe(70);
    expect(game.feedback()).toContain('Decisión correcta');
  });

  it('does not award attribute points when abstention is the operational answer', () => {
    const game = new BayesGameComponent();
    game.caseIndex.set(3);

    game.abstain();

    expect(game.score()).toBe(50);
    expect(game.feedback()).toContain('abstención operativa');
  });

  it('validates priors, independent events, spans and operational terminology', () => {
    const game = new BayesGameComponent();
    expect(validateBayesCases(game.cases)).toEqual([]);

    const altered = structuredClone(game.cases) as any[];
    altered[0].candidates[0].initialProbability = 0.7;
    expect(validateBayesCases(altered)).toContain(`${game.cases[0].specialty}: los priors deben sumar 1.`);
  });
});
