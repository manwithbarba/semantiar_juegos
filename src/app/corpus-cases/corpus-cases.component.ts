import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { TRAINING_CASES } from '../training/training-case-bank';
import type { TrainingCase } from '../training/training-contract';
import { TrainingProgressService } from '../training/training-progress.service';
import { JourneyRibbonComponent } from '../journey-ribbon/journey-ribbon.component';
import { StationControlsComponent } from '../station-controls/station-controls.component';
import { GlobalScoreService } from '../training/global-score.service';

type CaseState = 'answering' | 'revealed';

@Component({
  selector: 'app-corpus-cases',
  standalone: true,
  imports: [NgFor, NgIf, JourneyRibbonComponent, StationControlsComponent],
  templateUrl: './corpus-cases.component.html',
  styleUrl: './corpus-cases.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorpusCasesComponent {
  readonly currentIndex = signal(0);
  readonly selectedOption = signal<string | null>(null);
  readonly state = signal<CaseState>('answering');
  readonly startedAt = signal(Date.now());
  readonly activeCases = computed(() => TRAINING_CASES);
  readonly current = computed<TrainingCase>(() => this.activeCases()[this.currentIndex()]);
  readonly correctOption = computed(() => this.current().options.find((option) => option.correct)!);
  readonly isCorrect = computed(() => this.selectedOption() === this.correctOption().id);
  readonly isLastCase = computed(() => this.currentIndex() === this.activeCases().length - 1);
  readonly progress;

  constructor(
    private readonly trainingProgress: TrainingProgressService,
    private readonly globalScore: GlobalScoreService = new GlobalScoreService()
  ) {
    this.progress = trainingProgress.summary;
  }

  choose(optionId: string): void {
    if (this.state() === 'revealed') return;
    this.selectedOption.set(optionId);
  }

  reveal(): void {
    if (!this.selectedOption() || this.state() === 'revealed') return;
    const item = this.current();
    this.trainingProgress.recordFirstDecision({
      caseId: item.id,
      caseVersion: item.version,
      skill: item.skill,
      correct: this.isCorrect(),
      recordedAt: new Date(this.startedAt()).toISOString(),
    });
    if (this.isCorrect()) {
      this.globalScore.award('practica', `${item.id}:${item.version}`, 100);
    }
    this.state.set('revealed');
  }

  next(): void {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.activeCases().length) {
      this.currentIndex.set(0);
    } else {
      this.currentIndex.set(nextIndex);
    }
    this.resetDecision();
  }

  previous(): void {
    const previousIndex = this.currentIndex() - 1;
    this.currentIndex.set(previousIndex < 0 ? this.activeCases().length - 1 : previousIndex);
    this.resetDecision();
  }

  abstentionReason(item: TrainingCase): string {
    return item.expected.kind === 'abstain' ? item.expected.reason : '';
  }

  clearProgress(): void {
    this.trainingProgress.clear();
    this.globalScore.clear();
  }

  private resetDecision(): void {
    this.selectedOption.set(null);
    this.state.set('answering');
    this.startedAt.set(Date.now());
  }
}
