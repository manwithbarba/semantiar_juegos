import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  computed,
  signal,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  attributeHint,
  buildFallGamePrompts,
  type FallPromptKind,
  type FallGameOption,
  type FallGamePrompt,
} from './fall-game.logic';
import { JourneyRibbonComponent } from '../journey-ribbon/journey-ribbon.component';
import { StationControlsComponent } from '../station-controls/station-controls.component';
import { GlobalScoreService } from '../training/global-score.service';

type GameState = 'intro' | 'playing' | 'paused' | 'resolving' | 'gameover' | 'complete';
type FallMissionId = 'clinicas' | 'breves' | 'atributos' | 'mixta';

interface FallMission {
  id: FallMissionId;
  step: string;
  title: string;
  description: string;
  kind: FallPromptKind | 'mixta';
  size: number;
}

interface FallResolution {
  correct: boolean;
  chosen: FallGameOption;
  answer: FallGameOption;
  pointsAdded: number;
}

@Component({
  selector: 'app-fall-game',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, JourneyRibbonComponent, StationControlsComponent],
  templateUrl: './fall-game.component.html',
  styleUrl: './fall-game.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FallGameComponent implements OnDestroy {
  readonly promptBank = buildFallGamePrompts();
  readonly missions: readonly FallMission[] = [
    { id: 'clinicas', step: 'Nivel 1', title: 'Menciones clínicas', description: 'Reconocé el concepto expresado en lenguaje clínico.', kind: 'forma-clinica', size: 12 },
    { id: 'breves', step: 'Nivel 2', title: 'Formas breves', description: 'Expandí siglas y abreviaturas de la calibración.', kind: 'forma-breve', size: 12 },
    { id: 'atributos', step: 'Nivel 3', title: 'Concepto y atributos', description: 'Conservá polaridad, certeza, tiempo y sujeto.', kind: 'atributos', size: 9 },
    { id: 'mixta', step: 'Reto final', title: 'Catarata mixta', description: 'Alterná los tres tipos de decisión en una misma ronda.', kind: 'mixta', size: 15 },
  ];
  readonly selectedMissionId = signal<FallMissionId>('clinicas');
  readonly prompts = signal<readonly FallGamePrompt[]>(this.promptsFor('clinicas'));
  readonly state = signal<GameState>('intro');
  readonly currentIndex = signal(0);
  readonly laneIndex = signal(1);
  readonly piecePosition = signal(4);
  readonly score;
  readonly combo = signal(0);
  readonly bestCombo = signal(0);
  readonly lives = signal(3);
  readonly correctAnswers = signal(0);
  readonly lastResolution = signal<FallResolution | null>(null);
  readonly activeMission = computed<FallMission>(
    () => this.missions.find((mission) => mission.id === this.selectedMissionId()) ?? this.missions[0]
  );
  readonly nextMission = computed<FallMission | null>(() => {
    const index = this.missions.findIndex((mission) => mission.id === this.selectedMissionId());
    return this.missions[index + 1] ?? null;
  });
  readonly current = computed<FallGamePrompt>(() => this.prompts()[this.currentIndex()] ?? this.prompts()[0]);
  readonly laneCenter = computed(() => 12.5 + this.laneIndex() * 25);
  readonly completedCount = computed(() =>
    Math.min(this.prompts().length, this.currentIndex() + (this.lastResolution() ? 1 : 0))
  );
  readonly progressPercent = computed(() =>
    this.prompts().length ? Math.round((this.completedCount() / this.prompts().length) * 100) : 0
  );
  readonly fallSpeed = computed(() => 0.62 + Math.min(0.28, this.completedCount() / 220));

  private tickHandle: number | null = null;
  private nextHandle: number | null = null;

  constructor(private readonly globalScore: GlobalScoreService = new GlobalScoreService()) {
    this.score = globalScore.total;
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  selectMission(missionId: FallMissionId): void {
    if (this.state() !== 'intro') return;
    this.selectedMissionId.set(missionId);
    this.prompts.set(this.promptsFor(missionId));
  }

  missionPromptCount(missionId: FallMissionId): number {
    return this.promptsFor(missionId).length;
  }

  startGame(): void {
    this.clearTimers();
    this.prompts.set(this.promptsFor(this.selectedMissionId()));
    this.state.set('playing');
    this.currentIndex.set(0);
    this.laneIndex.set(1);
    this.piecePosition.set(4);
    this.combo.set(0);
    this.bestCombo.set(0);
    this.lives.set(3);
    this.correctAnswers.set(0);
    this.lastResolution.set(null);
    this.tickHandle = window.setInterval(() => this.advancePiece(), 50);
  }

  startNextMission(): void {
    const mission = this.nextMission();
    if (!mission) return;
    this.selectedMissionId.set(mission.id);
    this.startGame();
  }

  togglePause(): void {
    if (this.state() === 'playing') this.state.set('paused');
    else if (this.state() === 'paused') this.state.set('playing');
  }

  moveLeft(): void {
    if (this.state() !== 'playing') return;
    this.laneIndex.update((value) => Math.max(0, value - 1));
  }

  moveRight(): void {
    if (this.state() !== 'playing') return;
    this.laneIndex.update((value) => Math.min(3, value + 1));
  }

  dropOnLane(lane: number): void {
    if (this.state() !== 'playing') return;
    this.laneIndex.set(lane);
    this.resolveDrop(lane);
  }

  targetState(lane: number): 'correct' | 'chosen-wrong' | 'idle' {
    const resolution = this.lastResolution();
    if (!resolution || this.state() !== 'resolving') return 'idle';
    if (resolution.answer.id === this.current().options[lane]?.id) return 'correct';
    if (resolution.chosen.id === this.current().options[lane]?.id) return 'chosen-wrong';
    return 'idle';
  }

  optionLabel(option: FallGameOption): string {
    return option.annotation.term || 'Concepto sin término';
  }

  attributeHint = attributeHint;

  private advancePiece(): void {
    if (this.state() !== 'playing' || this.lastResolution()) return;
    const next = this.piecePosition() + this.fallSpeed();
    if (next >= 49) {
      this.piecePosition.set(49);
      this.resolveDrop(this.laneIndex());
    } else {
      this.piecePosition.set(next);
    }
  }

  private resolveDrop(lane: number): void {
    if (this.state() !== 'playing' || this.lastResolution()) return;
    const prompt = this.current();
    const chosen = prompt.options[lane];
    const answer = prompt.options.find((option) => option.id === prompt.correctOptionId);
    if (!chosen || !answer) return;

    const correct = chosen.id === answer.id;
    const pointsAdded = correct ? this.globalScore.award('catarata', prompt.id, 100) : 0;
    this.lastResolution.set({ correct, chosen, answer, pointsAdded });
    this.state.set('resolving');

    if (correct) {
      const nextCombo = this.combo() + 1;
      this.combo.set(nextCombo);
      this.bestCombo.update((value) => Math.max(value, nextCombo));
      this.correctAnswers.update((value) => value + 1);
    } else {
      this.combo.set(0);
      this.lives.update((value) => Math.max(0, value - 1));
    }

    this.nextHandle = window.setTimeout(() => this.continueAfterResolution(), 1100);
  }

  private continueAfterResolution(): void {
    this.nextHandle = null;
    const outOfLives = this.lives() <= 0;
    const lastPrompt = this.currentIndex() >= this.prompts().length - 1;
    if (outOfLives) {
      this.state.set('gameover');
      return;
    }
    if (lastPrompt) {
      this.state.set('complete');
      return;
    }

    this.currentIndex.update((value) => value + 1);
    this.laneIndex.set((this.currentIndex() + 1) % 4);
    this.piecePosition.set(4);
    this.lastResolution.set(null);
    this.state.set('playing');
  }

  private clearTimers(): void {
    if (this.tickHandle !== null) window.clearInterval(this.tickHandle);
    if (this.nextHandle !== null) window.clearTimeout(this.nextHandle);
    this.tickHandle = null;
    this.nextHandle = null;
  }

  private promptsFor(missionId: FallMissionId): readonly FallGamePrompt[] {
    const mission = this.missions.find((item) => item.id === missionId) ?? this.missions[0];
    if (mission.kind !== 'mixta') {
      return this.promptBank.filter((prompt) => prompt.kind === mission.kind).slice(0, mission.size);
    }

    const kinds: FallPromptKind[] = ['forma-clinica', 'forma-breve', 'atributos'];
    const groups = kinds.map((kind) => this.promptBank.filter((prompt) => prompt.kind === kind));
    const mixed: FallGamePrompt[] = [];
    for (let round = 0; mixed.length < mission.size; round += 1) {
      let added = false;
      for (const group of groups) {
        const prompt = group[round];
        if (!prompt) continue;
        mixed.push(prompt);
        added = true;
        if (mixed.length === mission.size) break;
      }
      if (!added) break;
    }
    return mixed;
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.togglePause();
      return;
    }
    if (this.state() !== 'playing') return;

    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.moveLeft();
    } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.moveRight();
    } else if (event.key === ' ' || event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.resolveDrop(this.laneIndex());
    }
  }
}
