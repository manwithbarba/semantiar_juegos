import { CorpusCasesComponent } from './corpus-cases.component';
import { TrainingProgressService } from '../training/training-progress.service';

describe('CorpusCasesComponent training flow', () => {
  beforeEach(() => globalThis.localStorage.clear());

  it('reveals feedback immediately in the guided track and locks the decision', () => {
    const progress = new TrainingProgressService();
    const component = new CorpusCasesComponent(progress);
    const correct = component.correctOption().id;

    component.choose(correct);
    component.choose(component.current().options.find((option) => option.id !== correct)!.id);

    expect(component.state()).toBe('revealed');
    expect(component.selectedOption()).toBe(correct);
    expect(progress.summary().total).toBe(1);
    expect(progress.summary().correct).toBe(1);
  });

  it('withholds mastery feedback until the learner confirms', () => {
    const progress = new TrainingProgressService();
    const component = new CorpusCasesComponent(progress);
    component.selectTrack('mastery');

    component.choose(component.correctOption().id);

    expect(component.state()).toBe('answering');
    expect(progress.summary().total).toBe(0);

    component.reveal();

    expect(component.state()).toBe('revealed');
    expect(progress.summary().total).toBe(1);
  });
});
