import { Injectable, computed, signal } from '@angular/core';
import type { TrainingSkill, TrainingTrack } from './training-contract';

export interface TrainingDecision {
  caseId: string;
  caseVersion: string;
  skill: TrainingSkill;
  track: TrainingTrack;
  correct: boolean;
  confidence: number;
  recordedAt: string;
}

export interface TrainingProgressSummary {
  total: number;
  correct: number;
  accuracy: number | null;
  calibrationReady: boolean;
  skills: Array<{ skill: TrainingSkill; total: number; correct: number; accuracy: number }>;
  confidenceBands: Array<{ label: string; total: number; accuracy: number | null }>;
}

const STORAGE_KEY = 'semantiar-training-progress-v1';
const CALIBRATION_MINIMUM = 8;

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
    const skills = [...new Set(decisions.map((decision) => decision.skill))].map((skill) => {
      const rows = decisions.filter((decision) => decision.skill === skill);
      const hits = rows.filter((decision) => decision.correct).length;
      return { skill, total: rows.length, correct: hits, accuracy: Math.round((hits / rows.length) * 100) };
    });
    const bands = [
      { label: '0–49 %', min: 0, max: 49 },
      { label: '50–74 %', min: 50, max: 74 },
      { label: '75–100 %', min: 75, max: 100 },
    ].map((band) => {
      const rows = decisions.filter((decision) => decision.confidence >= band.min && decision.confidence <= band.max);
      const hits = rows.filter((decision) => decision.correct).length;
      return { label: band.label, total: rows.length, accuracy: rows.length ? Math.round((hits / rows.length) * 100) : null };
    });
    return {
      total: decisions.length,
      correct,
      accuracy: decisions.length ? Math.round((correct / decisions.length) * 100) : null,
      calibrationReady: decisions.length >= CALIBRATION_MINIMUM,
      skills,
      confidenceBands: bands,
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
