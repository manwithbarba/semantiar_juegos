import { Routes } from '@angular/router';
import { BayesGameComponent } from './bayes-game/bayes-game.component';
import { HomeComponent } from './home/home.component';
import { LearningComponent } from './learning/learning.component';
import { CorpusCasesComponent } from './corpus-cases/corpus-cases.component';
import { FallGameComponent } from './fall-game/fall-game.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'ambiguedad', component: BayesGameComponent },
  { path: 'casos', redirectTo: 'ambiguedad', pathMatch: 'full' },
  { path: 'calibracion', redirectTo: 'casos-reales', pathMatch: 'full' },
  { path: 'casos-reales', component: CorpusCasesComponent },
  { path: 'catarata-menciones', component: FallGameComponent },
  { path: 'caida-atributos', redirectTo: 'catarata-menciones', pathMatch: 'full' },
  { path: 'expresiones', component: LearningComponent, data: { page: 'expresiones' } },
  { path: 'granularidad', component: LearningComponent, data: { page: 'granularidad' } },
  { path: 'atributos', component: LearningComponent, data: { page: 'atributos' } },
  { path: 'auditoria', component: LearningComponent, data: { page: 'auditoria' } },
  { path: 'lenguaje-local', component: LearningComponent, data: { page: 'lenguaje-local' } },
  { path: '**', redirectTo: '' },
];
