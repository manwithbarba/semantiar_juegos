import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ANNOTATION_CATEGORIES,
  ANNOTATION_CERTAINTIES,
  ANNOTATION_POLARITIES,
  ANNOTATION_SUBJECTS,
  ANNOTATION_TEMPORALITIES,
  type TrainingAnnotation,
} from '../training/training-contract';
import { VERIFIED_TRAINING_CONCEPTS } from '../training/training-terminology';

export interface BayesCandidate {
  label: string;
  /** Optional hypothesis reference; only operationalAnnotation is emitted as an annotation. */
  code?: string;
  initialProbability: number;
}

export interface BayesEvidence {
  text: string;
  likelihoodRatios: number[];
  conditionallyIndependent: true;
}

export interface BayesCase {
  specialty: string;
  noteBefore: string;
  /** Literal concept span. Context remains in noteBefore/noteAfter. */
  literal: string;
  noteAfter: string;
  candidates: BayesCandidate[];
  evidence: BayesEvidence[];
  answer: number | null;
  operationalAnnotation: TrainingAnnotation | null;
  lesson: string;
  reasoning: readonly string[];
}

export function validateBayesCases(cases: readonly BayesCase[]): string[] {
  const errors: string[] = [];
  for (const item of cases) {
    const priorTotal = item.candidates.reduce((sum, candidate) => sum + candidate.initialProbability, 0);
    if (item.candidates.length < 2) errors.push(`${item.specialty}: se requieren al menos dos hipótesis.`);
    if (Math.abs(priorTotal - 1) > 0.000001) errors.push(`${item.specialty}: los priors deben sumar 1.`);
    if (item.candidates.some((candidate) => !Number.isFinite(candidate.initialProbability) || candidate.initialProbability <= 0)) {
      errors.push(`${item.specialty}: cada prior debe ser positivo y finito.`);
    }
    for (const candidate of item.candidates) {
      if (candidate.code && (!/^\d{6,18}$/.test(candidate.code) || !VERIFIED_TRAINING_CONCEPTS[candidate.code])) {
        errors.push(`${item.specialty}: SCTID de hipótesis no verificado (${candidate.code}).`);
      }
    }
    for (const evidence of item.evidence) {
      if (evidence.conditionallyIndependent !== true) {
        errors.push(`${item.specialty}: cada evento debe declarar independencia condicional.`);
      }
      if (evidence.likelihoodRatios.length !== item.candidates.length) {
        errors.push(`${item.specialty}: cada evento debe tener una razón de verosimilitud por hipótesis.`);
      }
      if (evidence.likelihoodRatios.some((ratio) => !Number.isFinite(ratio) || ratio <= 0)) {
        errors.push(`${item.specialty}: las razones de verosimilitud deben ser positivas y finitas.`);
      }
    }
    if (!item.literal.trim() || !`${item.noteBefore}${item.literal}${item.noteAfter}`.includes(item.literal)) {
      errors.push(`${item.specialty}: el literal debe ser contiguo y estar presente en la nota.`);
    }
    if (item.answer !== null && (!Number.isInteger(item.answer) || !item.candidates[item.answer])) {
      errors.push(`${item.specialty}: la respuesta esperada no apunta a una hipótesis válida.`);
    }
    const annotation = item.operationalAnnotation;
    if (annotation) {
      const verified = VERIFIED_TRAINING_CONCEPTS[annotation.sctid];
      if (!/^\d{6,18}$/.test(annotation.sctid) || !verified) errors.push(`${item.specialty}: SCTID operativo no verificado.`);
      if (verified && (verified.term !== annotation.term || verified.category !== annotation.cat)) {
        errors.push(`${item.specialty}: término o categoría no coinciden con el SCTID verificado.`);
      }
      if (!ANNOTATION_CATEGORIES.includes(annotation.cat)) errors.push(`${item.specialty}: categoría operativa fuera del contrato.`);
      if (!ANNOTATION_POLARITIES.includes(annotation.pol)) errors.push(`${item.specialty}: polaridad operativa fuera del contrato.`);
      if (!ANNOTATION_CERTAINTIES.includes(annotation.cert)) errors.push(`${item.specialty}: certeza operativa fuera del contrato.`);
      if (!ANNOTATION_TEMPORALITIES.includes(annotation.temp)) errors.push(`${item.specialty}: temporalidad operativa fuera del contrato.`);
      if (!ANNOTATION_SUBJECTS.includes(annotation.suj)) errors.push(`${item.specialty}: sujeto operativo fuera del contrato.`);
      if (annotation.textoLiteral !== item.literal) errors.push(`${item.specialty}: literal bayesiano y literal operativo divergen.`);
      if (item.answer === null) errors.push(`${item.specialty}: una anotación operativa no puede acompañar una abstención.`);
      if (item.answer !== null && item.candidates[item.answer].code !== annotation.sctid) {
        errors.push(`${item.specialty}: el SCTID candidato y el operativo divergen.`);
      }
    } else if (item.answer !== null) {
      errors.push(`${item.specialty}: falta la anotación operativa de referencia.`);
    }
  }
  return errors;
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
      literal: 'FA',
      noteAfter: ' crónica en anticoagulación oral.',
      candidates: [
        { label: 'Fibrilación auricular crónica', code: '426749004', initialProbability: 0.55 },
        { label: 'Anemia ferropénica', code: '', initialProbability: 0.25 },
        { label: 'Fosfatasa alcalina elevada', code: '', initialProbability: 0.2 },
      ],
      evidence: [
        { text: '“crónica” modifica a FA', likelihoodRatios: [2.2, 0.7, 0.5], conditionallyIndependent: true },
        { text: 'Anticoagulación oral en el mismo enunciado', likelihoodRatios: [5, 0.35, 0.2], conditionallyIndependent: true },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '426749004', term: 'fibrilación auricular crónica', textoLiteral: 'FA', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
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
      literal: 'neumonía',
      noteAfter: '.',
      candidates: [
        { label: 'Neumonía', code: '233604007', initialProbability: 0.5 },
        { label: 'Infección respiratoria inespecífica', code: '', initialProbability: 0.3 },
        { label: 'Tos', code: '', initialProbability: 0.2 },
      ],
      evidence: [
        { text: 'Infiltrado basal compatible', likelihoodRatios: [2.7, 1.1, 0.5], conditionallyIndependent: true },
        { text: 'El marcador “probable” expresa incertidumbre', likelihoodRatios: [1.3, 1, 0.8], conditionallyIndependent: true },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '233604007', term: 'neumonía', textoLiteral: 'neumonía', pol: 'Activo', cert: 'Sospecha', temp: 'Actual', suj: 'Paciente' },
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
      literal: 'ACV',
      noteAfter: ' hace 3 años, sin déficit motor actual.',
      candidates: [
        { label: 'Accidente cerebrovascular', code: '230690007', initialProbability: 0.62 },
        { label: 'Déficit neurológico actual', code: '', initialProbability: 0.23 },
        { label: 'Antecedente familiar de ACV', code: '', initialProbability: 0.15 },
      ],
      evidence: [
        { text: '“Antecedente” y “hace 3 años”', likelihoodRatios: [3.5, 0.3, 0.8], conditionallyIndependent: true },
        { text: '“sin déficit motor actual”', likelihoodRatios: [1.8, 0.2, 0.8], conditionallyIndependent: true },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '230690007', term: 'accidente cerebrovascular', textoLiteral: 'ACV', pol: 'Activo', cert: 'Confirmado', temp: 'Histórico', suj: 'Paciente' },
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
      literal: 'soplo',
      noteAfter: '. Sin otros datos.',
      candidates: [
        { label: 'Soplo cardíaco', code: '', initialProbability: 0.42 },
        { label: 'Soplo vascular', code: '', initialProbability: 0.31 },
        { label: 'Descripción acústica inespecífica', code: '', initialProbability: 0.27 },
      ],
      evidence: [
        { text: 'No se documenta localización anatómica', likelihoodRatios: [1, 1, 1], conditionallyIndependent: true },
        { text: 'No hay hallazgos acompañantes discriminantes', likelihoodRatios: [1, 1, 1], conditionallyIndependent: true },
      ],
      answer: null,
      operationalAnnotation: null,
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
      noteBefore: '',
      literal: 'SatO2 91%',
      noteAfter: '. Paciente sin disnea en reposo.',
      candidates: [
        { label: 'Saturación de oxígeno por debajo del rango de referencia', code: '449171008', initialProbability: 0.46 },
        { label: 'Hipoxemia', code: '389087006', initialProbability: 0.31 },
        { label: 'Insuficiencia respiratoria', code: '409622000', initialProbability: 0.23 },
      ],
      evidence: [
        { text: 'El valor numérico expresa una medición', likelihoodRatios: [4.5, 1.2, 0.4], conditionallyIndependent: true },
        { text: '“Al aire ambiente” define la condición de la medida', likelihoodRatios: [2, 1.4, 0.6], conditionallyIndependent: true },
        { text: 'No se describen signos de dificultad respiratoria', likelihoodRatios: [1.6, 0.8, 0.3], conditionallyIndependent: true },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '449171008', term: 'saturación de oxígeno por debajo del rango de referencia', textoLiteral: 'SatO2 91%', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
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
      noteBefore: 'El paciente niega ',
      literal: 'fiebre',
      noteAfter: ', tos y disnea.',
      candidates: [
        { label: 'Fiebre', code: '386661006', initialProbability: 0.58 },
        { label: 'Temperatura corporal normal', code: '', initialProbability: 0.22 },
        { label: 'Infección aguda', code: '', initialProbability: 0.2 },
      ],
      evidence: [
        { text: 'El verbo “niega” gobierna la expresión clínica', likelihoodRatios: [4.8, 1.1, 0.3], conditionallyIndependent: true },
        { text: 'La negación aparece antes de la expresión clínica', likelihoodRatios: [2.4, 0.8, 0.4], conditionallyIndependent: true },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '386661006', term: 'fiebre', textoLiteral: 'fiebre', pol: 'Negado', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
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
      noteBefore: 'La madre tiene ',
      literal: 'diabetes tipo 2',
      noteAfter: '; el paciente no refiere diagnóstico conocido.',
      candidates: [
        { label: 'Diabetes mellitus tipo 2', code: '44054006', initialProbability: 0.52 },
        { label: 'Antecedente familiar de diabetes mellitus', code: '', initialProbability: 0.3 },
        { label: 'Hiperglucemia', code: '', initialProbability: 0.18 },
      ],
      evidence: [
        { text: '“Madre” cambia el sujeto de la expresión clínica', likelihoodRatios: [2.8, 1.8, 0.5], conditionallyIndependent: true },
        { text: '“El paciente no refiere diagnóstico” evita atribuirlo al paciente', likelihoodRatios: [1.4, 2.2, 0.4], conditionallyIndependent: true },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '44054006', term: 'diabetes mellitus tipo 2', textoLiteral: 'diabetes tipo 2', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Familiar' },
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
      literal: 'IAM',
      noteAfter: ' en 2018; actualmente sin dolor torácico.',
      candidates: [
        { label: 'Infarto agudo de miocardio', code: '22298006', initialProbability: 0.6 },
        { label: 'Dolor torácico', code: '29857009', initialProbability: 0.23 },
        { label: 'Síndrome coronario agudo actual', code: '', initialProbability: 0.17 },
      ],
      evidence: [
        { text: '“Antecedente” y el año fijan temporalidad histórica', likelihoodRatios: [4.1, 0.5, 0.6], conditionallyIndependent: true },
        { text: '“Sin dolor torácico” contradice un episodio actual', likelihoodRatios: [1.5, 0.3, 0.4], conditionallyIndependent: true },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '22298006', term: 'infarto de miocardio', textoLiteral: 'IAM', pol: 'Activo', cert: 'Confirmado', temp: 'Histórico', suj: 'Paciente' },
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
      noteBefore: 'Se sospecha ',
      literal: 'ITU',
      noteAfter: '; se solicita urocultivo.',
      candidates: [
        { label: 'Infección del tracto urinario', code: '68566005', initialProbability: 0.5 },
        { label: 'Cistitis', code: '38822007', initialProbability: 0.3 },
        { label: 'Disuria', code: '267439000', initialProbability: 0.2 },
      ],
      evidence: [
        { text: '“Se sospecha” modifica la certeza', likelihoodRatios: [2.2, 1.1, 0.6], conditionallyIndependent: true },
        { text: 'El urocultivo es una pista compatible, no una confirmación', likelihoodRatios: [2.4, 1.5, 0.7], conditionallyIndependent: true },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '68566005', term: 'infección del tracto urinario', textoLiteral: 'ITU', pol: 'Activo', cert: 'Sospecha', temp: 'Actual', suj: 'Paciente' },
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
      noteBefore: 'Artralgias; diagnóstico diferencial entre ',
      literal: 'artritis reumatoide',
      noteAfter: '. Sin resultados de anticuerpos todavía.',
      candidates: [
        { label: 'Artritis reumatoide', code: '69896004', initialProbability: 0.38 },
        { label: 'Lupus eritematoso sistémico', code: '', initialProbability: 0.34 },
        { label: 'Artralgia', code: '57676002', initialProbability: 0.28 },
      ],
      evidence: [
        { text: '“Diferencial entre” mantiene abiertas dos conceptos candidatos', likelihoodRatios: [1, 1, 0.9], conditionallyIndependent: true },
        { text: 'No hay anticuerpos ni otro dato discriminante', likelihoodRatios: [1, 1, 1], conditionallyIndependent: true },
      ],
      answer: null,
      operationalAnnotation: null,
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
  readonly recalculationCount = signal(0);

  constructor() {
    const errors = validateBayesCases(this.cases);
    if (errors.length) throw new Error(`Banco bayesiano inválido:\n${errors.join('\n')}`);
  }

  readonly activeCase = computed(() => this.cases[this.caseIndex()]);
  readonly posterior = computed(() => {
    this.recalculationCount();
    return this.calculatePosterior(this.activeCase(), this.revealedEvidence());
  });
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
    this.recalculationCount.update((value) => value + 1);
    const revealed = this.revealedEvidence();
    const maximum = Math.max(...this.posterior());
    this.feedback.set(
      revealed === 0
        ? `Probabilidades recalculadas desde los priors. Hipótesis dominante: ${Math.round(maximum * 100)}%.`
        : `Probabilidades recalculadas con ${revealed} ${revealed === 1 ? 'evento independiente' : 'eventos independientes'}. Hipótesis dominante: ${Math.round(maximum * 100)}%.`
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
    const annotation = current.operationalAnnotation;
    const values = [this.polarity(), this.certainty(), this.temporality(), this.subject()];
    const expectedValues = annotation ? [annotation.pol, annotation.cert, annotation.temp, annotation.suj] : [];
    const attributeCorrect = annotation
      ? values.reduce((count, value, index) => count + (value === expectedValues[index] ? 1 : 0), 0)
      : 0;
    const gained = (mappingCorrect ? 50 : 0) + (abstained ? 0 : attributeCorrect * 5);
    this.score.update((value) => value + gained);
    this.locked.set(true);

    const answerText = annotation
      ? `${annotation.term} (${annotation.sctid})`
      : 'abstención operativa';
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
    this.recalculationCount.set(0);
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
