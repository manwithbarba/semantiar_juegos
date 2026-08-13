import { TrainingProgressService, type TrainingDecision } from './training-progress.service';

function decision(overrides: Partial<TrainingDecision> = {}): TrainingDecision {
  return {
    caseId: 'TRN-001',
    caseVersion: '0.2.0',
    skill: 'Atributos',
    track: 'guided',
    correct: true,
    confidence: 80,
    recordedAt: '2026-08-13T12:00:00.000Z',
    ...overrides,
  };
}

describe('TrainingProgressService', () => {
  beforeEach(() => globalThis.localStorage.clear());

  it('keeps only the first decision for each case version', () => {
    const service = new TrainingProgressService();

    service.recordFirstDecision(decision());
    service.recordFirstDecision(decision({ correct: false, confidence: 20 }));

    expect(service.summary().total).toBe(1);
    expect(service.summary().correct).toBe(1);
    expect(service.decisions()[0].confidence).toBe(80);
  });

  it('does not claim calibration before eight independent decisions', () => {
    const service = new TrainingProgressService();

    for (let index = 1; index <= 7; index += 1) {
      service.recordFirstDecision(decision({ caseId: `TRN-00${index}` }));
    }

    expect(service.summary().calibrationReady).toBe(false);

    service.recordFirstDecision(decision({ caseId: 'TRN-008', correct: false, confidence: 95 }));

    expect(service.summary().calibrationReady).toBe(true);
    expect(service.summary().total).toBe(8);
    expect(service.summary().confidenceBands.find((band) => band.label === '75–100 %')).toEqual({
      label: '75–100 %',
      total: 8,
      accuracy: 88,
    });
  });

  it('clears both reactive state and persisted local progress', () => {
    const service = new TrainingProgressService();
    service.recordFirstDecision(decision());

    service.clear();

    expect(service.summary().total).toBe(0);
    expect(globalThis.localStorage.length).toBe(0);
  });
});
