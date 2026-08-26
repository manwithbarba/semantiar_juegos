import { FallGameComponent } from './fall-game.component';
import { GlobalScoreService } from '../training/global-score.service';

describe('FallGameComponent progress', () => {
  beforeEach(() => globalThis.localStorage.clear());

  it('counts the current prompt as completed as soon as it is resolved', () => {
    const game = new FallGameComponent(new GlobalScoreService());
    game.startGame();
    const prompt = game.current();
    const correctLane = prompt.options.findIndex((option) => option.id === prompt.correctOptionId);

    game.dropOnLane(correctLane);

    expect(game.completedCount()).toBe(1);
    expect(game.progressPercent()).toBeGreaterThan(0);
    game.ngOnDestroy();
  });
});
