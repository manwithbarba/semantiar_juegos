import { CorpusCasesComponent } from './corpus-cases.component';
import { TrainingProgressService } from '../training/training-progress.service';
import { GlobalScoreService } from '../training/global-score.service';

describe('CorpusCasesComponent training flow', () => {
  beforeEach(() => globalThis.localStorage.clear());

  it('uses one confirm-then-feedback flow for a correct decision', () => {
    const progress = new TrainingProgressService();
    const score = new GlobalScoreService();
    const component = new CorpusCasesComponent(progress, score);
    const correct = component.correctOption().id;

    component.choose(correct);
    expect(component.state()).toBe('answering');
    expect(progress.summary().total).toBe(0);

    component.reveal();

    expect(component.state()).toBe('revealed');
    expect(component.selectedOption()).toBe(correct);
    expect(progress.summary().total).toBe(1);
    expect(progress.summary().correct).toBe(1);
    expect(score.total()).toBe(100);
  });

  it('presents the complete case bank as a single sequence', () => {
    const progress = new TrainingProgressService();
    const component = new CorpusCasesComponent(progress);
    const firstCase = component.current().id;

    expect(component.activeCases().length).toBeGreaterThan(3);
    component.choose(component.current().options.find((option) => !option.correct)!.id);
    component.reveal();

    expect(progress.summary().total).toBe(1);
    expect(progress.summary().correct).toBe(0);

    component.next();
    expect(component.current().id).not.toBe(firstCase);
    expect(component.state()).toBe('answering');
  });
});
