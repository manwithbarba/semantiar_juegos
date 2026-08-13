import { Component } from '@angular/core';
import { BayesGameComponent } from './bayes-game/bayes-game.component';

@Component({
  selector: 'app-root',
  imports: [BayesGameComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
