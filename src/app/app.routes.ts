import { Routes } from '@angular/router';
import { BayesGameComponent } from './bayes-game/bayes-game.component';
import { HomeComponent } from './home/home.component';
import { CalibrationComponent } from './calibration/calibration.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'casos', component: BayesGameComponent },
  { path: 'calibracion', component: CalibrationComponent },
  { path: '**', redirectTo: '' },
];
