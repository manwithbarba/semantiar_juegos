import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CASE_BANK_RELEASE, TRAINING_CASES } from '../training/training-case-bank';
import type { TrainingCase, TrainingTrack } from '../training/training-contract';
import { TrainingProgressService } from '../training/training-progress.service';

type CaseState = 'answering' | 'revealed';

@Component({
  selector: 'app-corpus-cases',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, RouterLink],
  templateUrl: './corpus-cases.component.html',
  styleUrls: ['./corpus-cases.component.css', './corpus-cases.component.extra.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorpusCasesComponent {
  readonly release = CASE_BANK_RELEASE;
  readonly tracks: Array<{ id: TrainingTrack; label: string; description: string }> = [
    { id: 'guided', label: 'Guiado', description: 'Explicación paso a paso y devolución inmediata.' },
    { id: 'practice', label: 'Práctica', description: 'Aplicación con una única decisión y explicación posterior.' },
    { id: 'mastery', label: 'Dominio', description: 'Primera respuesta y confianza: la devolución aparece recién al confirmar.' },
  ];
  readonly selectedTrack = signal<TrainingTrack>('guided');
  readonly currentIndex = signal(0);
  readonly selectedOption = signal<string | null>(null);
  readonly confidence = signal(60);
  readonly state = signal<CaseState>('answering');
  readonly startedAt = signal(Date.now());
  readonly activeCases = computed(() => TRAINING_CASES.filter((item) => item.track === this.selectedTrack()));
  readonly current = computed<TrainingCase>(() => this.activeCases()[this.currentIndex()]);
  readonly isMastery = computed(() => this.selectedTrack() === 'mastery');
  readonly correctOption = computed(() => this.current().options.find((option) => option.correct)!);
  readonly isCorrect = computed(() => this.selectedOption() === this.correctOption().id);
  readonly progress;

  constructor(private readonly trainingProgress: TrainingProgressService) {
    this.progress = trainingProgress.summary;
  }

  selectTrack(track: TrainingTrack): void {
    this.selectedTrack.set(track);
    this.currentIndex.set(0);
    this.resetDecision();
  }

  choose(optionId: string): void {
    if (this.state() === 'revealed') return;
    this.selectedOption.set(optionId);
    if (!this.isMastery()) this.reveal();
  }

  reveal(): void {
    if (!this.selectedOption() || this.state() === 'revealed') return;
    const item = this.current();
    this.trainingProgress.recordFirstDecision({
      caseId: item.id,
      caseVersion: item.version,
      skill: item.skill,
      track: item.track,
      correct: this.isCorrect(),
      confidence: this.confidence(),
      recordedAt: new Date(this.startedAt()).toISOString(),
    });
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

  setConfidence(value: number): void {
    this.confidence.set(Number(value));
  }

  abstentionReason(item: TrainingCase): string {
    return item.expected.kind === 'abstain' ? item.expected.reason : '';
  }

  private resetDecision(): void {
    this.selectedOption.set(null);
    this.confidence.set(60);
    this.state.set('answering');
    this.startedAt.set(Date.now());
  }
}
