import { BayesGameComponent } from './bayes-game.component';

describe('BayesGameComponent', () => {
  it('offers ten cases that cover mapping and assertion ambiguity', () => {
    const game = new BayesGameComponent();

    expect(game.cases).toHaveLength(10);
    expect(game.cases.map((item) => item.highlightedText)).toEqual(
      expect.arrayContaining(['91% al aire ambiente', 'niega fiebre', 'madre tiene diabetes tipo 2'])
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

  it('scores a correct mapping and attribute decision, including confidence calibration', () => {
    const game = new BayesGameComponent();

    game.selectCandidate(0);
    game.setCertainty('Confirmado');
    game.setConfidence(100);
    game.submitDecision();

    expect(game.locked()).toBe(true);
    expect(game.score()).toBe(100);
    expect(game.feedback()).toContain('Decisión correcta');
  });
});
