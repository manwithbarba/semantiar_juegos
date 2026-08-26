import { Injectable, computed, signal } from '@angular/core';

export type ScoreStation = 'conceptos' | 'catarata' | 'practica' | 'ambiguedad';

export interface GlobalScoreEntry {
  station: ScoreStation;
  challengeId: string;
  points: number;
}

const STORAGE_KEY = 'semantiar-global-score-v1';

function safelyRead(): GlobalScoreEntry[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is GlobalScoreEntry => {
      if (!entry || typeof entry !== 'object') return false;
      const candidate = entry as Partial<GlobalScoreEntry>;
      return (
        ['conceptos', 'catarata', 'practica', 'ambiguedad'].includes(candidate.station ?? '') &&
        typeof candidate.challengeId === 'string' &&
        typeof candidate.points === 'number' &&
        Number.isFinite(candidate.points) &&
        candidate.points >= 0
      );
    });
  } catch {
    return [];
  }
}

function safelyWrite(entries: readonly GlobalScoreEntry[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // El puntaje local es opcional y nunca debe interrumpir una actividad.
  }
}

@Injectable({ providedIn: 'root' })
export class GlobalScoreService {
  private readonly entriesState = signal<GlobalScoreEntry[]>(safelyRead());
  readonly entries = this.entriesState.asReadonly();
  readonly total = computed(() => this.entriesState().reduce((sum, entry) => sum + entry.points, 0));
  readonly byStation = computed<Record<ScoreStation, number>>(() => {
    const totals: Record<ScoreStation, number> = { conceptos: 0, catarata: 0, practica: 0, ambiguedad: 0 };
    for (const entry of this.entriesState()) totals[entry.station] += entry.points;
    return totals;
  });

  award(station: ScoreStation, challengeId: string, points: number): number {
    const normalizedPoints = Math.max(0, Math.round(points));
    const current = this.entriesState();
    const existing = current.find((entry) => entry.station === station && entry.challengeId === challengeId);
    if (!existing && normalizedPoints === 0) return 0;
    if (existing && existing.points >= normalizedPoints) return 0;

    const next = existing
      ? current.map((entry) =>
          entry.station === station && entry.challengeId === challengeId
            ? { ...entry, points: normalizedPoints }
            : entry
        )
      : [...current, { station, challengeId, points: normalizedPoints }];
    this.entriesState.set(next);
    safelyWrite(next);
    return normalizedPoints - (existing?.points ?? 0);
  }

  clear(): void {
    this.entriesState.set([]);
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // Ver safelyWrite: el almacenamiento es deliberadamente tolerante a fallos.
    }
  }
}
