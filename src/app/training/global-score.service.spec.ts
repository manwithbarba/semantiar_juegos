import { GlobalScoreService } from './global-score.service';

describe('GlobalScoreService', () => {
  beforeEach(() => globalThis.localStorage.clear());

  it('adds points from all four stations to one total', () => {
    const service = new GlobalScoreService();

    service.award('conceptos', 'exercise-1', 100);
    service.award('catarata', 'prompt-1', 100);
    service.award('practica', 'case-1', 100);
    service.award('ambiguedad', 'case-1', 80);

    expect(service.total()).toBe(380);
    expect(service.byStation()).toEqual({ conceptos: 100, catarata: 100, practica: 100, ambiguedad: 80 });
  });

  it('keeps the best result for a challenge instead of adding repetitions', () => {
    const service = new GlobalScoreService();

    expect(service.award('ambiguedad', 'case-1', 60)).toBe(60);
    expect(service.award('ambiguedad', 'case-1', 40)).toBe(0);
    expect(service.award('ambiguedad', 'case-1', 100)).toBe(40);
    expect(service.total()).toBe(100);
  });

  it('persists and clears the global score locally', () => {
    const first = new GlobalScoreService();
    first.award('conceptos', 'exercise-1', 100);

    expect(new GlobalScoreService().total()).toBe(100);
    first.clear();
    expect(first.total()).toBe(0);
    expect(globalThis.localStorage.length).toBe(0);
  });
});
