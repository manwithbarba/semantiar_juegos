import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TrainingProgressService } from '../training/training-progress.service';

@Component({
  selector: 'app-calibration',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './calibration.component.html',
  styleUrl: './calibration.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalibrationComponent {
  readonly progress;

  constructor(private readonly trainingProgress: TrainingProgressService) {
    this.progress = trainingProgress.summary;
  }

  clearProgress(): void {
    this.trainingProgress.clear();
  }
}
