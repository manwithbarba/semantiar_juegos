import { Injectable, computed, signal } from '@angular/core';
import type { TrainingSkill } from './training-contract';

export interface TrainingDecision {
  caseId: string;
  caseVersion: string;
  skill: TrainingSkill;
  correct: boolean;
  recordedAt: string;
}

export interface TrainingProgressSummary {
  total: number;
  correct: number;
  accuracy: number | null;
}

const STORAGE_KEY = 'semantiar-training-progress-v1';

function safelyRead(): TrainingDecision[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as TrainingDecision[]) : [];
  } catch {
    return [];
  }
}

function safelyWrite(decisions: readonly TrainingDecision[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(decisions));
  } catch {
    // Local progress is optional.  A blocked browser storage must not interrupt training.
  }
}

@Injectable({ providedIn: 'root' })
export class TrainingProgressService {
  private readonly decisionsState = signal<TrainingDecision[]>(safelyRead());
  readonly decisions = this.decisionsState.asReadonly();

  readonly summary = computed<TrainingProgressSummary>(() => {
    const decisions = this.decisionsState();
    const correct = decisions.filter((decision) => decision.correct).length;
    return {
      total: decisions.length,
      correct,
      accuracy: decisions.length ? Math.round((correct / decisions.length) * 100) : null,
    };
  });

  recordFirstDecision(decision: TrainingDecision): void {
    const key = `${decision.caseId}:${decision.caseVersion}`;
    if (this.decisionsState().some((item) => `${item.caseId}:${item.caseVersion}` === key)) return;
    const next = [...this.decisionsState(), decision];
    this.decisionsState.set(next);
    safelyWrite(next);
  }

  clear(): void {
    this.decisionsState.set([]);
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // See safelyWrite: storage is intentionally best-effort.
    }
  }
}
