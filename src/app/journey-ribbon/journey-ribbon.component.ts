import { Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

export type JourneyStageId =
  | 'inicio'
  | 'conceptos'
  | 'catarata'
  | 'practica'
  | 'ambiguedad';

@Component({
  selector: 'app-journey-ribbon',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './journey-ribbon.component.html',
  styleUrl: './journey-ribbon.component.css',
})
export class JourneyRibbonComponent {
  @Input() current: JourneyStageId = 'inicio';

  readonly stages = [
    { id: 'conceptos', verb: 'Comprender', label: 'Conceptos', hint: 'Expresión y criterio', route: '/expresiones' },
    { id: 'catarata', verb: 'Reconocer', label: 'Catarata', hint: 'Mención a SNOMED', route: '/catarata-menciones' },
    { id: 'practica', verb: 'Aplicar', label: 'Casos clínicos', hint: 'Decisión y devolución', route: '/casos-reales' },
    { id: 'ambiguedad', verb: 'Transferir', label: 'Ambigüedad', hint: 'Contexto y abstención', route: '/ambiguedad' },
  ] as const;

  currentIndex(): number {
    return this.stages.findIndex((stage) => stage.id === this.current);
  }
}
