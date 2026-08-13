import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface BayesCandidate {
  label: string;
  code: string;
  initialProbability: number;
}

interface BayesEvidence {
  text: string;
  likelihoodRatios: number[];
}

interface BayesCase {
  specialty: string;
  noteBefore: string;
  highlightedText: string;
  noteAfter: string;
  candidates: BayesCandidate[];
  evidence: BayesEvidence[];
  answer: number | null;
  attributes: readonly [string, string, string, string];
  lesson: string;
  reasoning: readonly string[];
}

@Component({
  selector: 'app-bayes-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bayes-game.component.html',
  styleUrl: './bayes-game.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BayesGameComponent {
  readonly cases: readonly BayesCase[] = [
    {
      specialty: 'Cardiología · expresión clínica: “FA”',
      noteBefore: 'Paciente con ',
      highlightedText: 'FA',
      noteAfter: ' crónica en anticoagulación oral.',
      candidates: [
        { label: 'Fibrilación auricular crónica', code: '426749004', initialProbability: 0.55 },
        { label: 'Anemia ferropénica', code: '', initialProbability: 0.25 },
        { label: 'Fosfatasa alcalina elevada', code: '', initialProbability: 0.2 },
      ],
      evidence: [
        { text: '“crónica” modifica a FA', likelihoodRatios: [2.2, 0.7, 0.5] },
        { text: 'Anticoagulación oral en el mismo enunciado', likelihoodRatios: [5, 0.35, 0.2] },
      ],
      answer: 0,
      attributes: ['Activo', 'Confirmado', 'Actual', 'Paciente'],
      lesson: 'El contexto cardiovascular vuelve dominante a fibrilación auricular; la sigla aislada no bastaba.',
      reasoning: [
        'La probabilidad previa local favorece fibrilación auricular, pero “FA” aislada todavía puede ser ambigua.',
        '“Crónica” aporta duración y la anticoagulación oral funciona como evidencia contextual muy discriminante.',
        'Al multiplicar la probabilidad previa por las razones de verosimilitud, la probabilidad posterior se concentra en fibrilación auricular.',
        'La expresión clínica está activa, confirmada y actual; corresponde al paciente. Los atributos no se deducen solo del SCTID.',
      ],
    },
    {
      specialty: 'Guardia · expresión clínica: “neumonía”',
      noteBefore: 'Infiltrado basal derecho; se interpreta como ',
      highlightedText: 'probable neumonía',
      noteAfter: '.',
      candidates: [
        { label: 'Neumonía', code: '233604007', initialProbability: 0.5 },
        { label: 'Infección respiratoria inespecífica', code: '', initialProbability: 0.3 },
        { label: 'Tos', code: '', initialProbability: 0.2 },
      ],
      evidence: [
        { text: 'Infiltrado basal compatible', likelihoodRatios: [2.7, 1.1, 0.5] },
        { text: 'El marcador “probable” expresa incertidumbre', likelihoodRatios: [1.3, 1, 0.8] },
      ],
      answer: 0,
      attributes: ['Activo', 'Sospecha', 'Actual', 'Paciente'],
      lesson: 'El concepto es neumonía, pero la certeza debe conservarse como sospecha.',
      reasoning: [
        '“Neumonía” es un concepto clínico plausible, pero “probable” impide tratarla como confirmada.',
        'El infiltrado basal aumenta la plausibilidad de neumonía frente a tos o infección respiratoria inespecífica.',
        'La evidencia cambia el ranking de conceptos, pero no convierte una sospecha en certeza.',
        'La salida correcta conserva activo + sospecha + actual + paciente para no perder la aserción original.',
      ],
    },
    {
      specialty: 'Clínica médica · expresión clínica: “ACV”',
      noteBefore: 'Antecedente de ',
      highlightedText: 'ACV hace 3 años',
      noteAfter: ', sin déficit motor actual.',
      candidates: [
        { label: 'Accidente cerebrovascular', code: '230690007', initialProbability: 0.62 },
        { label: 'Déficit neurológico actual', code: '', initialProbability: 0.23 },
        { label: 'Antecedente familiar de ACV', code: '', initialProbability: 0.15 },
      ],
      evidence: [
        { text: '“Antecedente” y “hace 3 años”', likelihoodRatios: [3.5, 0.3, 0.8] },
        { text: '“sin déficit motor actual”', likelihoodRatios: [1.8, 0.2, 0.8] },
      ],
      answer: 0,
      attributes: ['Activo', 'Confirmado', 'Histórico', 'Paciente'],
      lesson: 'El concepto sigue siendo ACV; el tiempo pasado se representa en temporalidad, no cambiando el concepto.',
      reasoning: [
        '“ACV” identifica la entidad clínica; “hace 3 años” no crea otro concepto neurológico.',
        '“Antecedente” y la fecha aumentan la probabilidad de un evento histórico frente a un déficit actual.',
        'La ausencia de déficit motor actual aporta evidencia contra una manifestación presente, no contra el antecedente.',
        'La temporalidad histórica es el atributo que evita leer este antecedente como un evento activo.',
      ],
    },
    {
      specialty: 'Nota breve sin especialidad · expresión clínica: “soplo”',
      noteBefore: 'Control. Persiste ',
      highlightedText: 'soplo',
      noteAfter: '. Sin otros datos.',
      candidates: [
        { label: 'Soplo cardíaco', code: '', initialProbability: 0.42 },
        { label: 'Soplo vascular', code: '', initialProbability: 0.31 },
        { label: 'Descripción acústica inespecífica', code: '', initialProbability: 0.27 },
      ],
      evidence: [
        { text: 'No se documenta localización anatómica', likelihoodRatios: [1, 1, 1] },
        { text: 'No hay hallazgos acompañantes discriminantes', likelihoodRatios: [1, 1, 1] },
      ],
      answer: null,
      attributes: ['Activo', 'Confirmado', 'Actual', 'Paciente'],
      lesson: 'La incertidumbre permanece alta: abstenerse evita convertir una probabilidad previa frecuente en una falsa certeza.',
      reasoning: [
        'La expresión clínica “soplo” es válida, pero no especifica localización ni etiología.',
        'Las dos evidencias tienen razón de verosimilitud 1: no favorecen ningún concepto.',
        'La distribución posterior conserva la ambigüedad y el IIS permanece alto.',
        'Abstenerse es la decisión reproducible: evita inventar granularidad que la nota no documenta.',
      ],
    },
    {
      specialty: 'Clínica médica · expresión clínica: “SatO2 91%”',
      noteBefore: 'SatO2: ',
      highlightedText: '91% al aire ambiente',
      noteAfter: '. Paciente sin disnea en reposo.',
      candidates: [
        { label: 'Saturación de oxígeno (observable)', code: '431314004', initialProbability: 0.46 },
        { label: 'Hipoxemia', code: '389087006', initialProbability: 0.31 },
        { label: 'Insuficiencia respiratoria', code: '409622000', initialProbability: 0.23 },
      ],
      evidence: [
        { text: 'El valor numérico expresa una medición', likelihoodRatios: [4.5, 1.2, 0.4] },
        { text: '“Al aire ambiente” define la condición de la medida', likelihoodRatios: [2, 1.4, 0.6] },
        { text: 'No se describen signos de dificultad respiratoria', likelihoodRatios: [1.6, 0.8, 0.3] },
      ],
      answer: 0,
      attributes: ['Activo', 'Confirmado', 'Actual', 'Paciente'],
      lesson: 'SatO2 91% aislada es una medición/observable: no debe transformarse automáticamente en hipoxemia o insuficiencia respiratoria.',
      reasoning: [
        'El texto literal contiene un valor y una condición de medida; primero se reconoce un observable, no un diagnóstico.',
        'La ausencia de disnea reduce el apoyo contextual para inferir insuficiencia respiratoria.',
        'La anotación debe conservar valor, unidad y método en los atributos de la observación cuando el modelo los soporte.',
        'SemantIAr separa la detección del dato (“SatO2”) de la aserción clínica: no se agrega una enfermedad no escrita.',
      ],
    },
    {
      specialty: 'Guardia · expresión clínica: “fiebre”',
      noteBefore: 'El paciente ',
      highlightedText: 'niega fiebre',
      noteAfter: ', tos y disnea.',
      candidates: [
        { label: 'Fiebre', code: '386661006', initialProbability: 0.58 },
        { label: 'Temperatura corporal normal', code: '', initialProbability: 0.22 },
        { label: 'Infección aguda', code: '', initialProbability: 0.2 },
      ],
      evidence: [
        { text: 'El verbo “niega” gobierna la expresión clínica', likelihoodRatios: [4.8, 1.1, 0.3] },
        { text: 'La negación aparece antes de la expresión clínica', likelihoodRatios: [2.4, 0.8, 0.4] },
      ],
      answer: 0,
      attributes: ['Negado', 'Confirmado', 'Actual', 'Paciente'],
      lesson: 'Se detecta el concepto fiebre, pero la polaridad es negada; no debe eliminarse la expresión clínica ni convertirla en temperatura normal.',
      reasoning: [
        'El concepto identificado sigue siendo fiebre: la negación no borra la expresión clínica.',
        '“Niega” es un disparador de aserción que tiene alcance sobre fiebre.',
        'La certeza es confirmada respecto de la negación, no de la presencia de fiebre.',
        'La salida debe conservar polaridad negada, actual y sujeto paciente para que el contexto sea auditable.',
      ],
    },
    {
      specialty: 'Antecedentes familiares · expresión clínica: “diabetes tipo 2”',
      noteBefore: 'La ',
      highlightedText: 'madre tiene diabetes tipo 2',
      noteAfter: '; el paciente no refiere diagnóstico conocido.',
      candidates: [
        { label: 'Diabetes mellitus tipo 2', code: '44054006', initialProbability: 0.52 },
        { label: 'Antecedente familiar de diabetes mellitus', code: '', initialProbability: 0.3 },
        { label: 'Hiperglucemia', code: '', initialProbability: 0.18 },
      ],
      evidence: [
        { text: '“Madre” cambia el sujeto de la expresión clínica', likelihoodRatios: [2.8, 1.8, 0.5] },
        { text: '“El paciente no refiere diagnóstico” evita atribuirlo al paciente', likelihoodRatios: [1.4, 2.2, 0.4] },
      ],
      answer: 0,
      attributes: ['Activo', 'Confirmado', 'Actual', 'Familiar'],
      lesson: 'El concepto es diabetes mellitus tipo 2, pero el sujeto es un familiar; atribuirlo al paciente sería un error de aserción.',
      reasoning: [
        'La expresión clínica describe una enfermedad de la madre, por lo que el concepto y el sujeto deben separarse.',
        'La evidencia familiar no cambia el concepto a hiperglucemia ni autoriza inferir diabetes en el paciente.',
        'El campo sujeto = familiar es el dato que evita contaminar el registro clínico del paciente.',
        'Este caso muestra por qué la identificación de la expresión clínica y la asignación de atributos son capas distintas.',
      ],
    },
    {
      specialty: 'Cardiología · expresión clínica: “IAM en 2018”',
      noteBefore: 'Antecedente de ',
      highlightedText: 'IAM en 2018',
      noteAfter: '; actualmente sin dolor torácico.',
      candidates: [
        { label: 'Infarto agudo de miocardio', code: '22298006', initialProbability: 0.6 },
        { label: 'Dolor torácico', code: '29857009', initialProbability: 0.23 },
        { label: 'Síndrome coronario agudo actual', code: '', initialProbability: 0.17 },
      ],
      evidence: [
        { text: '“Antecedente” y el año fijan temporalidad histórica', likelihoodRatios: [4.1, 0.5, 0.6] },
        { text: '“Sin dolor torácico” contradice un episodio actual', likelihoodRatios: [1.5, 0.3, 0.4] },
      ],
      answer: 0,
      attributes: ['Activo', 'Confirmado', 'Histórico', 'Paciente'],
      lesson: 'El antecedente de IAM se codifica como entidad histórica; la ausencia de dolor actual no elimina el antecedente.',
      reasoning: [
        '“IAM” es el concepto clínico expresado; el año aporta una coordenada temporal.',
        'La negación de dolor actual reduce el apoyo al concepto de síndrome coronario agudo presente.',
        'No se debe reemplazar el IAM histórico por dolor torácico ni por un evento agudo actual.',
        'Temporalidad histórica y polaridad activa permiten conservar que el evento ocurrió.',
      ],
    },
    {
      specialty: 'Consultorio · expresión clínica: “ITU”',
      noteBefore: 'Se ',
      highlightedText: 'sospecha ITU',
      noteAfter: '; se solicita urocultivo.',
      candidates: [
        { label: 'Infección del tracto urinario', code: '68566005', initialProbability: 0.5 },
        { label: 'Cistitis', code: '38822007', initialProbability: 0.3 },
        { label: 'Disuria', code: '267439000', initialProbability: 0.2 },
      ],
      evidence: [
        { text: '“Se sospecha” modifica la certeza', likelihoodRatios: [2.2, 1.1, 0.6] },
        { text: 'El urocultivo es una pista compatible, no una confirmación', likelihoodRatios: [2.4, 1.5, 0.7] },
      ],
      answer: 0,
      attributes: ['Activo', 'Sospecha', 'Actual', 'Paciente'],
      lesson: 'El plan diagnóstico apoya ITU como concepto candidato, pero la certeza permanece en sospecha hasta contar con evidencia suficiente.',
      reasoning: [
        'La sigla ITU se expande al concepto más amplio mientras no haya datos para una localización más granular.',
        'Solicitar urocultivo indica evaluación diagnóstica, no confirmación de la infección.',
        'La palabra “sospecha” debe propagarse al atributo certeza.',
        'Mapear directamente a cistitis o marcar confirmado introduciría una precisión no documentada.',
      ],
    },
    {
      specialty: 'Reumatología · expresión clínica: “artritis reumatoide”',
      noteBefore: 'Artralgias; diagnóstico ',
      highlightedText: 'diferencial entre artritis reumatoide y lupus',
      noteAfter: '. Sin resultados de anticuerpos todavía.',
      candidates: [
        { label: 'Artritis reumatoide', code: '69896004', initialProbability: 0.38 },
        { label: 'Lupus eritematoso sistémico', code: '', initialProbability: 0.34 },
        { label: 'Artralgia', code: '57676002', initialProbability: 0.28 },
      ],
      evidence: [
        { text: '“Diferencial entre” mantiene abiertas dos conceptos candidatos', likelihoodRatios: [1, 1, 0.9] },
        { text: 'No hay anticuerpos ni otro dato discriminante', likelihoodRatios: [1, 1, 1] },
      ],
      answer: null,
      attributes: ['Activo', 'Diferencial', 'Actual', 'Paciente'],
      lesson: 'La nota documenta un diferencial, no una elección final: abstenerse evita presentar un concepto candidato como diagnóstico.',
      reasoning: [
        'El texto ofrece dos candidatos plausibles y no aporta evidencia que permita resolver el mapeo.',
        'La distribución posterior permanece repartida; el IIS alto es una señal para no forzar la decisión.',
        'La certeza diferencial debe conservarse aunque la expresión clínica contenga nombres de enfermedades.',
        'En entrenamiento, abstenerse aquí es una conducta de calidad y no una respuesta incompleta.',
      ],
    },
  ];

  readonly caseIndex = signal(0);
  readonly score = signal(0);
  readonly revealedEvidence = signal(0);
  readonly selectedCandidate = signal<number | null>(null);
  readonly locked = signal(false);
  readonly polarity = signal('Activo');
  readonly certainty = signal('Confirmado');
  readonly temporality = signal('Actual');
  readonly subject = signal('Paciente');
  readonly feedback = signal('');

  readonly activeCase = computed(() => this.cases[this.caseIndex()]);
  readonly posterior = computed(() =>
    this.calculatePosterior(this.activeCase(), this.revealedEvidence())
  );
  readonly informationIndex = computed(() => this.normalizedEntropy(this.posterior()));
  readonly submitLabel = computed(() => {
    if (!this.locked()) return 'Confirmar decisión';
    return this.caseIndex() === this.cases.length - 1 ? 'Reiniciar partida' : 'Siguiente caso';
  });

  selectCandidate(index: number): void {
    if (!this.locked()) this.selectedCandidate.set(index);
  }

  revealEvidence(): void {
    if (this.locked()) return;
    const total = this.activeCase().evidence.length;
    if (this.revealedEvidence() < total) this.revealedEvidence.update((value) => value + 1);
  }

  recalculateProbabilities(): void {
    const revealed = this.revealedEvidence();
    this.feedback.set(
      revealed === 0
        ? 'Distribución recalculada a partir de la probabilidad a priori.'
        : `Distribución recalculada con ${revealed} ${revealed === 1 ? 'pista contextual' : 'pistas contextuales'}.`
    );
  }

  setPolarity(value: string): void {
    this.polarity.set(value);
  }

  setCertainty(value: string): void {
    this.certainty.set(value);
  }

  setTemporality(value: string): void {
    this.temporality.set(value);
  }

  setSubject(value: string): void {
    this.subject.set(value);
  }

  submitDecision(): void {
    if (this.locked()) {
      this.advanceCase();
      return;
    }
    this.finish(false);
  }

  abstain(): void {
    this.finish(true);
  }

  private finish(abstained: boolean): void {
    const current = this.activeCase();
    const selected = this.selectedCandidate();
    if (!abstained && selected === null) {
      this.feedback.set('Seleccioná un concepto candidato o elegí abstenerse.');
      return;
    }

    const mappingCorrect = abstained ? current.answer === null : selected === current.answer;
    const values = [this.polarity(), this.certainty(), this.temporality(), this.subject()];
    const attributeCorrect = values.reduce(
      (count, value, index) => count + (value === current.attributes[index] ? 1 : 0),
      0
    );
    const gained = (mappingCorrect ? 50 : 0) + attributeCorrect * 5;
    this.score.update((value) => value + gained);
    this.locked.set(true);

    const answerText =
      current.answer === null
        ? 'irresoluble'
        : `${current.candidates[current.answer].label} (${current.candidates[current.answer].code})`;
    this.feedback.set(
      `${mappingCorrect ? 'Decisión correcta' : 'Decisión no concordante'} · +${gained} puntos. ` +
        `Respuesta: ${answerText}. ${current.lesson}`
    );
  }

  private advanceCase(): void {
    if (this.caseIndex() === this.cases.length - 1) {
      this.caseIndex.set(0);
      this.score.set(0);
    } else {
      this.caseIndex.update((value) => value + 1);
    }
    this.resetCaseState();
  }

  private resetCaseState(): void {
    this.revealedEvidence.set(0);
    this.selectedCandidate.set(null);
    this.locked.set(false);
    this.polarity.set('Activo');
    this.certainty.set('Confirmado');
    this.temporality.set('Actual');
    this.subject.set('Paciente');
    this.feedback.set('');
  }

  private calculatePosterior(current: BayesCase, revealed: number): number[] {
    const weights = current.candidates.map((candidate) => candidate.initialProbability);
    for (let evidenceIndex = 0; evidenceIndex < revealed; evidenceIndex += 1) {
      const ratios = current.evidence[evidenceIndex].likelihoodRatios;
      for (let candidateIndex = 0; candidateIndex < weights.length; candidateIndex += 1) {
        weights[candidateIndex] *= ratios[candidateIndex];
      }
    }
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return total === 0 ? weights.map(() => 1 / weights.length) : weights.map((weight) => weight / total);
  }

  private normalizedEntropy(probabilities: readonly number[]): number {
    const entropy = -probabilities.reduce(
      (sum, probability) => sum + (probability > 0 ? probability * Math.log(probability) : 0),
      0
    );
    return entropy / Math.log(probabilities.length);
  }
}
