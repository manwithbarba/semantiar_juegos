import { BayesGameComponent, validateBayesCases } from './bayes-game.component';

describe('BayesGameComponent', () => {
  beforeEach(() => globalThis.localStorage.clear());

  it('offers ten cases that cover concept and attribute ambiguity', () => {
    const game = new BayesGameComponent();

    expect(game.cases).toHaveLength(10);
    expect(game.cases.map((item) => item.literal)).toEqual(
      expect.arrayContaining(['FA crónica', 'SatO2 91%', 'fiebre', 'diabetes tipo 2'])
    );
    expect(game.cases.filter((item) => item.answer === null)).toHaveLength(2);
    expect(
      game.cases.every(
        (item) => `${item.noteBefore}${item.literal}${item.noteAfter}`.length >= 120 && item.evidence.length >= 2
      )
    ).toBe(true);
  });

  it('keeps the decision locked until the note context is shown', () => {
    const game = new BayesGameComponent();

    expect(game.isolatedMention()).toBe('FA');
    game.selectCandidate(0);
    game.submitDecision();

    expect(game.selectedCandidate()).toBeNull();
    expect(game.locked()).toBe(false);
    expect(game.feedback()).toContain('Mostrá el contexto');

    game.revealContext();
    game.selectCandidate(0);
    expect(game.contextRevealed()).toBe(true);
    expect(game.selectedCandidate()).toBe(0);
  });

  it('scores a correct mapping and attribute decision', () => {
    const game = new BayesGameComponent();

    game.revealContext();
    game.selectCandidate(game.activeCase().answer!);
    game.setCertainty('Confirmado');
    game.submitDecision();

    expect(game.locked()).toBe(true);
    expect(game.score()).toBe(100);
    expect(game.feedback()).toContain('Decisión concordante');
  });

  it('does not award attribute points when abstention is the operational answer', () => {
    const game = new BayesGameComponent();
    game.caseIndex.set(3);

    game.revealContext();
    game.abstain();

    expect(game.score()).toBe(100);
    expect(game.feedback()).toContain('abstención operativa');
  });

  it('does not award attribute points when the selected concept is incorrect', () => {
    const game = new BayesGameComponent();

    game.revealContext();
    game.selectCandidate(1);
    game.submitDecision();

    expect(game.score()).toBe(0);
    expect(game.feedback()).toContain('Sin nuevos puntos globales');
  });

  it('distinguishes a correct concept from incorrect attributes', () => {
    const game = new BayesGameComponent();

    game.revealContext();
    game.selectCandidate(game.activeCase().answer!);
    game.setCertainty('Sospecha');
    game.submitDecision();

    expect(game.score()).toBe(90);
    expect(game.feedback()).toContain('Concepto correcto; revisá los atributos');
  });

  it('validates context, mentions and operational terminology', () => {
    const game = new BayesGameComponent();
    expect(validateBayesCases(game.cases)).toEqual([]);

    const altered = structuredClone(game.cases) as any[];
    altered[0].isolatedMention = 'XYZ';
    expect(validateBayesCases(altered)).toContain(
      `${game.cases[0].specialty}: la mención aislada debe estar contenida en el literal.`
    );

    const tooBrief = structuredClone(game.cases) as any[];
    tooBrief[0].noteBefore = 'Paciente con ';
    tooBrief[0].noteAfter = '.';
    expect(validateBayesCases(tooBrief)).toContain(
      `${game.cases[0].specialty}: la nota debe ofrecer un contexto clínico desarrollado en al menos dos oraciones.`
    );

    const unbalanced = structuredClone(game.cases) as any[];
    for (const item of unbalanced) if (item.answer !== null) item.answer = 0;
    expect(validateBayesCases(unbalanced)).toContain(
      'Las posiciones de las respuestas correctas deben estar balanceadas.'
    );
  });
});
