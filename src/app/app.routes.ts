import { Routes } from '@angular/router';
import { BayesGameComponent } from './bayes-game/bayes-game.component';
import { HomeComponent } from './home/home.component';
import { CalibrationComponent } from './calibration/calibration.component';
import { LearningComponent } from './learning/learning.component';
import { CorpusCasesComponent } from './corpus-cases/corpus-cases.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'casos', component: BayesGameComponent },
  { path: 'calibracion', component: CalibrationComponent },
  { path: 'casos-reales', component: CorpusCasesComponent },
  { path: 'expresiones', component: LearningComponent, data: { page: 'expresiones' } },
  { path: 'granularidad', component: LearningComponent, data: { page: 'granularidad' } },
  { path: 'atributos', component: LearningComponent, data: { page: 'atributos' } },
  { path: 'auditoria', component: LearningComponent, data: { page: 'auditoria' } },
  { path: 'lenguaje-local', component: LearningComponent, data: { page: 'lenguaje-local' } },
  { path: '**', redirectTo: '' },
];
