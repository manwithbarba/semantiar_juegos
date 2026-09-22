import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { JourneyRibbonComponent } from '../journey-ribbon/journey-ribbon.component';
import { StationControlsComponent } from '../station-controls/station-controls.component';

type Choice = 'accept_a' | 'accept_b' | 'both_valid' | 'review';

interface InitiativeVote { model: string; decision: string; tone: 'agree' | 'cautious' | 'human'; }
interface EvidenceStep { label: string; detail: string; state: 'available' | 'required' | 'human'; }
interface Mission {
  id: string; route: string; title: string; count: number; description: string; prompt: string; evidence: string;
  choices: ReadonlyArray<{ id: Choice; label: string }>;
  votes: ReadonlyArray<InitiativeVote>; reflection: string; evidenceTrail: ReadonlyArray<EvidenceStep>;
}

@Component({
  selector: 'app-adjudication-expedition', standalone: true,
  imports: [NgFor, NgIf, JourneyRibbonComponent, StationControlsComponent],
  templateUrl: './adjudication-expedition.component.html', styleUrl: './adjudication-expedition.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdjudicationExpeditionComponent {
  readonly missions: ReadonlyArray<Mission> = [
    {
      id: 'consensus', route: 'Jardín de coincidencias', title: 'Cinco voces, una decisión', count: 408,
      description: 'Filas donde los cinco modelos emitieron la misma decisión completa.',
      prompt: 'La mención ya tiene el mismo span, concepto y atributos en las dos propuestas. ¿Qué harías antes de mirar la Iniciativa?',
      evidence: 'Escenario didáctico inspirado en el patrón de consenso; no representa una nota de paciente real.',
      choices: [{ id: 'accept_a', label: 'Conservar A' }, { id: 'accept_b', label: 'Conservar B' }, { id: 'both_valid', label: 'Reconocer ambas' }, { id: 'review', label: 'Derivar a humano' }],
      votes: [{ model: 'Gemini', decision: 'Ambas válidas', tone: 'agree' }, { model: 'Luna', decision: 'Ambas válidas', tone: 'agree' }, { model: 'Opus', decision: 'Ambas válidas', tone: 'agree' }, { model: 'Sonnet', decision: 'Ambas válidas', tone: 'agree' }, { model: 'Terra', decision: 'Ambas válidas', tone: 'agree' }],
      reflection: 'El consenso reduce la carga de revisión, pero no convierte una decisión de modelos en referencia clínica. El humano puede usar este grupo como revisión rápida, no como aprobación automática.',
      evidenceTrail: [{ label: 'Span', detail: 'Comprobar que ambas marcaciones señalen el mismo fragmento y offsets.', state: 'required' }, { label: 'Atributos', detail: 'Contrastar concepto, polaridad, certeza, temporalidad y sujeto.', state: 'required' }, { label: 'Salida', detail: 'El consenso sólo propone una revisión rápida; la referencia sigue siendo humana.', state: 'human' }],
    },
    {
      id: 'context', route: 'Meseta de contexto', title: 'Un mismo concepto, distinto tiempo', count: 457,
      description: 'Filas con un bloque dominante, pero sin consenso pleno entre los cinco modelos.',
      prompt: 'El SCTID coincide, pero una propuesta marca “Histórico” y la otra “Actual”. ¿Qué evidencia buscarías primero?',
      evidence: 'Pistas útiles: “antecedente”, “hace”, fecha pasada, negación, lenguaje de hipótesis y quién es el sujeto de la nota.',
      choices: [{ id: 'accept_a', label: 'Aceptar A sin revisar' }, { id: 'accept_b', label: 'Aceptar B sin revisar' }, { id: 'both_valid', label: 'Tratar ambas como equivalentes' }, { id: 'review', label: 'Leer el contexto y preparar revisión' }],
      votes: [{ model: 'Gemini', decision: 'Resolver por contexto', tone: 'agree' }, { model: 'Luna', decision: 'Resolver o abstenerse', tone: 'cautious' }, { model: 'Opus', decision: 'Abstenerse si falta marcador', tone: 'cautious' }, { model: 'Sonnet', decision: 'Resolver por contexto', tone: 'agree' }, { model: 'Terra', decision: 'Resolver con señales locales', tone: 'cautious' }],
      reflection: 'Aquí no gana la mayoría por sí sola: se enseña a localizar la evidencia que explica temporalidad, certeza, polaridad y sujeto antes de fijar una tercera decisión.',
      evidenceTrail: [{ label: 'Texto completo', detail: 'Leer la frase anterior y posterior: fechas, antecedentes, negaciones y verbos modales cambian el sentido.', state: 'required' }, { label: 'Diferencia', detail: 'Aislar el atributo en conflicto: que el SCTID coincida no resuelve temporalidad ni certeza.', state: 'available' }, { label: 'Salida', detail: 'Registrar el fundamento que conecta la señal textual con la tercera decisión.', state: 'human' }],
    },
    {
      id: 'terminology', route: 'Paso terminológico', title: 'Dos SCTID, una mención', count: 150,
      description: 'Conflictos de SCTID que requieren comprobar la terminología, no adivinarla.',
      prompt: 'Dos códigos SNOMED distintos parecen plausibles para la misma expresión. Sin la definición oficial disponible, ¿cuál es la decisión responsable?',
      evidence: 'Una diferencia de código puede ser de especificidad, de jerarquía o de significado. El número por sí solo no explica cuál es correcto.',
      choices: [{ id: 'accept_a', label: 'Elegir A por intuición' }, { id: 'accept_b', label: 'Elegir B por intuición' }, { id: 'both_valid', label: 'Declarar ambos correctos' }, { id: 'review', label: 'Pausar y consultar SNOMED' }],
      votes: [{ model: 'Gemini', decision: 'Resolver una alternativa', tone: 'agree' }, { model: 'Luna', decision: 'Ambigua sin evidencia terminológica', tone: 'cautious' }, { model: 'Opus', decision: 'Ambigua sin jerarquía', tone: 'cautious' }, { model: 'Sonnet', decision: 'Resolver una alternativa', tone: 'agree' }, { model: 'Terra', decision: 'No resoluble sin término oficial', tone: 'cautious' }],
      reflection: 'Éste es el punto donde la abstención es información de calidad: evita convertir una conjetura terminológica en un dato de entrenamiento. El validador humano consulta una fuente SNOMED documentada.',
      evidenceTrail: [{ label: 'SCTID A / B', detail: 'Llevar ambos identificadores al buscador SNOMED; el número aislado no es evidencia suficiente.', state: 'available' }, { label: 'Edición y versión', detail: 'Confirmar término preferido, FSN, estado activo y edición argentina congelada.', state: 'required' }, { label: 'Salida', detail: 'Citar la diferencia terminológica o declarar abstención fundada.', state: 'human' }],
    },
    {
      id: 'human', route: 'Cámara del árbitro', title: 'La decisión que falta', count: 79,
      description: 'Filas donde ningún bloque de decisión completa reunió más de una voz.',
      prompt: 'La Iniciativa queda dividida: cada ruta cuenta una historia distinta. ¿Quién transforma el desacuerdo en una referencia?',
      evidence: 'Los modelos aportan hipótesis, contrastes y razones para priorizar; no reemplazan la responsabilidad de adjudicar clínicamente.',
      choices: [{ id: 'accept_a', label: 'Cerrar con A' }, { id: 'accept_b', label: 'Cerrar con B' }, { id: 'both_valid', label: 'Cerrar como equivalentes' }, { id: 'review', label: 'Entregar al validador humano' }],
      votes: [{ model: 'Gemini', decision: 'Hipótesis de resolución', tone: 'cautious' }, { model: 'Luna', decision: 'Hipótesis o abstención', tone: 'cautious' }, { model: 'Opus', decision: 'Abstención explícita', tone: 'cautious' }, { model: 'Sonnet', decision: 'Hipótesis de resolución', tone: 'cautious' }, { model: 'Terra', decision: 'Abstención explícita', tone: 'cautious' }, { model: 'Humano', decision: 'Pendiente: referencia clínica', tone: 'human' }],
      reflection: 'El final no es una pantalla de “ganaste”: es una cola de revisión priorizada. La validación humana permitirá calcular desempeño real y convertir el conjunto en benchmark clínico.',
      evidenceTrail: [{ label: 'Disenso', detail: 'Separar las hipótesis de los modelos de los hechos observables del caso.', state: 'available' }, { label: 'Cola priorizada', detail: 'El desacuerdo total aumenta prioridad de revisión; no habilita una decisión por mayoría.', state: 'required' }, { label: 'Referencia', detail: 'Tu validación documentada fija el estándar contra el que se calculará el ranking posterior.', state: 'human' }],
    },
  ];

  readonly selectedMissionId = signal(this.missions[0].id);
  readonly selectedChoice = signal<Choice | null>(null);
  readonly revealed = signal(false);
  readonly exploredMissionIds = signal<string[]>([]);
  readonly soundEnabled = signal(false);
  readonly activeMission = computed(() => this.missions.find((mission) => mission.id === this.selectedMissionId())!);
  readonly exploredCount = computed(() => this.exploredMissionIds().length);
  private music: HTMLAudioElement | null = null;

  selectMission(missionId: string): void { this.selectedMissionId.set(missionId); this.selectedChoice.set(null); this.revealed.set(false); }
  choose(choice: Choice): void { if (!this.revealed()) this.selectedChoice.set(choice); }
  revealInitiative(): void {
    if (!this.selectedChoice() || this.revealed()) return;
    const missionId = this.activeMission().id;
    if (!this.exploredMissionIds().includes(missionId)) this.exploredMissionIds.update((ids) => [...ids, missionId]);
    this.revealed.set(true);
  }
  toggleSoundscape(): void {
    if (this.soundEnabled()) { this.stopSoundscape(); return; }
    const music = new Audio('audio/iniciativa-adjudicadores.mp3');
    music.loop = true;
    music.volume = 0.16;
    this.music = music;
    void music.play()
      .then(() => this.soundEnabled.set(true))
      .catch(() => { this.music = null; this.soundEnabled.set(false); });
  }
  openFhirValidator(): void {
    window.open('http://127.0.0.1:4300/remediation-fhir.html', '_blank', 'noopener');
  }
  private stopSoundscape(): void {
    this.music?.pause();
    if (this.music) this.music.currentTime = 0;
    this.music = null;
    this.soundEnabled.set(false);
  }
}
