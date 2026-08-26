import { TrainingProgressService, type TrainingDecision } from './training-progress.service';

function decision(overrides: Partial<TrainingDecision> = {}): TrainingDecision {
  return {
    caseId: 'TRN-001',
    caseVersion: '0.2.0',
    skill: 'Atributos',
    correct: true,
    recordedAt: '2026-08-13T12:00:00.000Z',
    ...overrides,
  };
}

describe('TrainingProgressService', () => {
  beforeEach(() => globalThis.localStorage.clear());

  it('keeps only the first decision for each case version', () => {
    const service = new TrainingProgressService();

    service.recordFirstDecision(decision());
    service.recordFirstDecision(decision({ correct: false }));

    expect(service.summary().total).toBe(1);
    expect(service.summary().correct).toBe(1);
  });

  it('summarizes concordance across the recorded cases', () => {
    const service = new TrainingProgressService();

    for (let index = 1; index <= 4; index += 1) {
      service.recordFirstDecision(decision({ caseId: `TRN-00${index}`, correct: index < 4 }));
    }

    expect(service.summary()).toEqual({ total: 4, correct: 3, accuracy: 75 });
  });

  it('clears both reactive state and persisted local progress', () => {
    const service = new TrainingProgressService();
    service.recordFirstDecision(decision());

    service.clear();

    expect(service.summary().total).toBe(0);
    expect(globalThis.localStorage.length).toBe(0);
  });
});
