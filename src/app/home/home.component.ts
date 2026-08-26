import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EDUCATIONAL_REFERENCES } from '../references';
import { JourneyRibbonComponent } from '../journey-ribbon/journey-ribbon.component';
import { GlobalScoreService } from '../training/global-score.service';
import { CASE_BANK_RELEASE, TRAINING_CASES } from '../training/training-case-bank';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgFor, JourneyRibbonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  readonly references = EDUCATIONAL_REFERENCES;
  readonly globalScore = inject(GlobalScoreService).total;
  readonly mvpStatus = {
    version: TRAINING_CASES[0]?.version ?? '0.2.0',
    terminology: CASE_BANK_RELEASE.terminologyEdition,
    clinicalReview: 'Pendiente de validación clínica documentada',
  };
}
