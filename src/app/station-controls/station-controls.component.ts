import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GlobalScoreService } from '../training/global-score.service';

@Component({
  selector: 'app-station-controls',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './station-controls.component.html',
  styleUrl: './station-controls.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationControlsComponent implements OnDestroy {
  readonly globalScore;
  readonly musicEnabled = signal(false);
  private music: HTMLAudioElement | null = null;

  constructor(score: GlobalScoreService) {
    this.globalScore = score.total;
  }

  toggleMusic(): void {
    this.musicEnabled.update((enabled) => !enabled);
    if (!this.music) {
      this.music = new Audio(new URL('audio/1_ascend.ogg', document.baseURI).toString());
      this.music.loop = true;
      this.music.volume = 0.16;
    }
    if (this.musicEnabled()) void this.music.play().catch(() => this.musicEnabled.set(false));
    else this.music.pause();
  }

  ngOnDestroy(): void {
    this.music?.pause();
  }
}
