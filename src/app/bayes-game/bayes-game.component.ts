import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ANNOTATION_CATEGORIES,
  ANNOTATION_CERTAINTIES,
  ANNOTATION_POLARITIES,
  ANNOTATION_SUBJECTS,
  ANNOTATION_TEMPORALITIES,
  type TrainingAnnotation,
} from '../training/training-contract';
import { VERIFIED_TRAINING_CONCEPTS } from '../training/training-terminology';
import { JourneyRibbonComponent } from '../journey-ribbon/journey-ribbon.component';
import { StationControlsComponent } from '../station-controls/station-controls.component';
import { GlobalScoreService } from '../training/global-score.service';

export interface BayesCandidate {
  label: string;
  /** Optional hypothesis reference; only operationalAnnotation is emitted as an annotation. */
  code?: string;
}

export interface BayesEvidence {
  text: string;
}

export interface BayesCase {
  specialty: string;
  noteBefore: string;
  /** Optional shorter form shown before the note context is revealed. */
  isolatedMention?: string;
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
  const correctPositions = [0, 0, 0];
  for (const item of cases) {
    if (item.candidates.length !== 3) errors.push(`${item.specialty}: se requieren exactamente tres conceptos candidatos.`);
    for (const candidate of item.candidates) {
      if (candidate.code && (!/^\d{6,18}$/.test(candidate.code) || !VERIFIED_TRAINING_CONCEPTS[candidate.code])) {
        errors.push(`${item.specialty}: SCTID de concepto candidato no verificado (${candidate.code}).`);
      }
    }
    if (item.evidence.length < 2 || item.evidence.some((evidence) => !evidence.text.trim())) {
      errors.push(`${item.specialty}: el caso debe declarar al menos dos pistas contextuales.`);
    }
    const fullNote = `${item.noteBefore}${item.literal}${item.noteAfter}`;
    if (!item.literal.trim() || !fullNote.includes(item.literal)) {
      errors.push(`${item.specialty}: el literal debe ser contiguo y estar presente en la nota.`);
    }
    if (fullNote.trim().length < 120 || (fullNote.match(/[.!?](?:\s|$)/g) ?? []).length < 2) {
      errors.push(`${item.specialty}: la nota debe ofrecer un contexto clínico desarrollado en al menos dos oraciones.`);
    }
    const isolatedMention = item.isolatedMention ?? item.literal;
    if (!isolatedMention.trim() || !item.literal.includes(isolatedMention)) {
      errors.push(`${item.specialty}: la mención aislada debe estar contenida en el literal.`);
    }
    if (item.answer !== null && (!Number.isInteger(item.answer) || !item.candidates[item.answer])) {
      errors.push(`${item.specialty}: la respuesta esperada no apunta a un concepto candidato válido.`);
    }
    if (item.answer !== null && correctPositions[item.answer] !== undefined) {
      correctPositions[item.answer] += 1;
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
      if (annotation.textoLiteral !== item.literal) errors.push(`${item.specialty}: la mención del caso y la respuesta formativa divergen.`);
      if (item.answer === null) errors.push(`${item.specialty}: una anotación operativa no puede acompañar una abstención.`);
      if (item.answer !== null && item.candidates[item.answer].code !== annotation.sctid) {
        errors.push(`${item.specialty}: el SCTID candidato y el operativo divergen.`);
      }
    } else if (item.answer !== null) {
      errors.push(`${item.specialty}: falta la anotación operativa de referencia.`);
    }
  }
  if (Math.max(...correctPositions) - Math.min(...correctPositions) > 1) {
    errors.push('Las posiciones de las respuestas correctas deben estar balanceadas.');
  }
  return errors;
}

@Component({
  selector: 'app-bayes-game',
  standalone: true,
  imports: [CommonModule, FormsModule, JourneyRibbonComponent, StationControlsComponent],
  templateUrl: './bayes-game.component.html',
  styleUrl: './bayes-game.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BayesGameComponent {
  readonly cases: readonly BayesCase[] = [
    {
      specialty: 'Cardiología',
      noteBefore: 'Seguimiento en consultorio de cardiología. Continúa con ',
      isolatedMention: 'FA',
      literal: 'FA crónica',
      noteAfter: ', con respuesta ventricular controlada y anticoagulación oral sostenida. En la consulta niega palpitaciones, dolor torácico y disnea.',
      candidates: [
        { label: 'Fosfatasa alcalina' },
        { label: 'Fracción de acortamiento' },
        { label: 'Fibrilación auricular crónica', code: '426749004' },
      ],
      evidence: [
        { text: 'Seguimiento cardiológico con respuesta ventricular controlada.' },
        { text: 'Anticoagulación oral sostenida.' },
        { text: 'Sin palpitaciones, dolor torácico ni disnea en la consulta actual.' },
      ],
      answer: 2,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '426749004', term: 'fibrilación auricular crónica', textoLiteral: 'FA crónica', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
      lesson: '“FA” aislada no alcanza. La mención completa y la anticoagulación permiten elegir fibrilación auricular crónica.',
      reasoning: [
        '“FA” puede tener más de una expansión y no debe resolverse de manera automática.',
        'La mención completa es “FA crónica”; “crónica” aporta el detalle necesario para el concepto elegido.',
        'La anticoagulación oral funciona como una pista cardiovascular concordante.',
        'La mención está activa, confirmada y actual; corresponde al paciente.',
      ],
    },
    {
      specialty: 'Guardia',
      noteBefore: 'Consulta por 72 horas de fiebre, tos productiva y decaimiento. En la auscultación presenta crepitantes basales derechos; la radiografía informa un infiltrado en la misma localización. El equipo registra como probable ',
      literal: 'neumonía',
      noteAfter: ' y acuerda una reevaluación clínica en 48 horas.',
      candidates: [
        { label: 'Infección respiratoria inespecífica' },
        { label: 'Neumonía', code: '233604007' },
        { label: 'Tos' },
      ],
      evidence: [
        { text: 'Fiebre, tos productiva y decaimiento de 72 horas.' },
        { text: 'Crepitantes e infiltrado basal derechos.' },
        { text: 'Registro como “probable” y reevaluación en 48 horas.' },
      ],
      answer: 1,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '233604007', term: 'neumonía', textoLiteral: 'neumonía', pol: 'Activo', cert: 'Sospecha', temp: 'Actual', suj: 'Paciente' },
      lesson: 'El concepto es neumonía, pero la certeza debe conservarse como sospecha.',
      reasoning: [
        '“Neumonía” es un concepto clínico plausible, pero “probable” impide tratarla como confirmada.',
        'El infiltrado basal aporta más apoyo a neumonía que a tos o infección respiratoria inespecífica.',
        'El contexto cambia el orden de las opciones, pero no convierte una sospecha en certeza.',
        'La salida correcta conserva activo + sospecha + actual + paciente para respetar cómo aparece la mención en la nota.',
      ],
    },
    {
      specialty: 'Clínica médica',
      noteBefore: 'En el control neurológico se revisan los antecedentes personales. Consta un ',
      literal: 'ACV',
      noteAfter: ' ocurrido hace 3 años, con rehabilitación posterior. Actualmente deambula sin asistencia, no presenta déficit motor focal y no se describen signos de un evento neurológico agudo.',
      candidates: [
        { label: 'Accidente cerebrovascular', code: '230690007' },
        { label: 'Déficit neurológico actual' },
        { label: 'Antecedente familiar de ACV' },
      ],
      evidence: [
        { text: 'Registro en antecedentes personales y fecha de hace 3 años.' },
        { text: 'Rehabilitación posterior al evento.' },
        { text: 'Sin déficit focal ni signos neurológicos agudos en el control actual.' },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '230690007', term: 'accidente cerebrovascular', textoLiteral: 'ACV', pol: 'Activo', cert: 'Confirmado', temp: 'Histórico', suj: 'Paciente' },
      lesson: 'El concepto sigue siendo ACV; el tiempo pasado se representa en temporalidad, no cambiando el concepto.',
      reasoning: [
        '“ACV” identifica la entidad clínica; “hace 3 años” no crea otro concepto neurológico.',
        '“Antecedente” y la fecha favorecen la lectura de un evento histórico frente a un déficit actual.',
        'La ausencia de déficit motor actual aporta evidencia contra una manifestación presente, no contra el antecedente.',
        'La temporalidad histórica es el atributo que evita leer este antecedente como un evento activo.',
      ],
    },
    {
      specialty: 'Nota breve sin especialidad',
      noteBefore: 'Control clínico de rutina. En el examen físico se consigna que persiste ',
      literal: 'soplo',
      noteAfter: '. No se registra foco, irradiación, momento del ciclo ni territorio vascular; tampoco se adjuntan estudios complementarios o hallazgos acompañantes que permitan localizarlo.',
      candidates: [
        { label: 'Soplo cardíaco' },
        { label: 'Soplo vascular' },
        { label: 'Descripción acústica inespecífica' },
      ],
      evidence: [
        { text: 'El examen sólo consigna “persiste soplo”.' },
        { text: 'Sin foco, irradiación, momento del ciclo ni territorio vascular.' },
        { text: 'Sin estudios complementarios o hallazgos acompañantes.' },
      ],
      answer: null,
      operationalAnnotation: null,
      lesson: 'La incertidumbre permanece alta: abstenerse evita convertir una opción posible en una falsa certeza.',
      reasoning: [
        'La expresión clínica “soplo” es válida, pero no especifica localización ni etiología.',
        'Los datos del examen no permiten decidir si el hallazgo es cardíaco, vascular o inespecífico.',
        'Agregar una localización sería introducir información que la nota no documenta.',
        'Abstenerse es la decisión reproducible: evita inventar granularidad que la nota no documenta.',
      ],
    },
    {
      specialty: 'Clínica médica',
      noteBefore: 'Control posterior a un cuadro viral. Al ingreso se registra ',
      literal: 'SatO2 91%',
      noteAfter: ' al aire ambiente; la medición se repite en reposo con un resultado similar. El paciente está eupneico, niega disnea y la evolución no formula un diagnóstico respiratorio adicional.',
      candidates: [
        { label: 'Hipoxemia', code: '389087006' },
        { label: 'Insuficiencia respiratoria', code: '409622000' },
        { label: 'Saturación de oxígeno por debajo del rango de referencia', code: '449171008' },
      ],
      evidence: [
        { text: 'Valor de 91 % registrado al aire ambiente.' },
        { text: 'Resultado similar al repetir la medición en reposo.' },
        { text: 'Paciente eupneico, sin disnea y sin otro diagnóstico respiratorio documentado.' },
      ],
      answer: 2,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '449171008', term: 'saturación de oxígeno por debajo del rango de referencia', textoLiteral: 'SatO2 91%', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
      lesson: 'En el contrato del ejercicio, SatO2 91% se representa como saturación de oxígeno por debajo del rango; no se agrega un diagnóstico.',
      reasoning: [
        'El texto contiene un valor de saturación y no documenta por sí solo una enfermedad.',
        'La ausencia de disnea evita inferir insuficiencia respiratoria a partir de la cifra.',
        'El concepto elegido representa el dato efectivamente registrado bajo el contrato de salida del ejercicio.',
        'No se agrega hipoxemia ni otra interpretación diagnóstica que la nota no expresa.',
      ],
    },
    {
      specialty: 'Guardia',
      noteBefore: 'Consulta por cefalea y mialgias de inicio reciente. Durante el interrogatorio, el paciente niega ',
      literal: 'fiebre',
      noteAfter: ', tos y disnea; presenta temperatura axilar de 36,7 °C al ingreso. Se indican control domiciliario y pautas de alarma.',
      candidates: [
        { label: 'Temperatura corporal normal' },
        { label: 'Fiebre', code: '386661006' },
        { label: 'Infección aguda' },
      ],
      evidence: [
        { text: 'Interrogatorio: niega fiebre, tos y disnea.' },
        { text: 'Temperatura axilar de 36,7 °C al ingreso.' },
        { text: 'Control domiciliario y pautas de alarma.' },
      ],
      answer: 1,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '386661006', term: 'fiebre', textoLiteral: 'fiebre', pol: 'Negado', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
      lesson: 'Se detecta el concepto fiebre, pero la polaridad es negada; no debe eliminarse la expresión clínica ni convertirla en temperatura normal.',
      reasoning: [
        'El concepto identificado sigue siendo fiebre: la negación no borra la expresión clínica.',
        '“Niega” indica que la negación alcanza a fiebre.',
        'La certeza es confirmada respecto de la negación, no de la presencia de fiebre.',
        'La salida debe conservar polaridad negada, actual y sujeto paciente para que el contexto sea auditable.',
      ],
    },
    {
      specialty: 'Antecedentes familiares',
      noteBefore: 'En la sección de antecedentes familiares se registra: madre con ',
      literal: 'diabetes tipo 2',
      noteAfter: ' en tratamiento con metformina. El paciente consulta por control preventivo, no refiere diagnóstico personal de diabetes ni tratamiento hipoglucemiante.',
      candidates: [
        { label: 'Diabetes mellitus tipo 2', code: '44054006' },
        { label: 'Antecedente familiar de diabetes mellitus' },
        { label: 'Hiperglucemia' },
      ],
      evidence: [
        { text: 'La mención aparece en la sección de antecedentes familiares.' },
        { text: 'La condición y el tratamiento corresponden a la madre.' },
        { text: 'El paciente no refiere diagnóstico personal ni tratamiento hipoglucemiante.' },
      ],
      answer: 0,
      operationalAnnotation: { cat: 'Hallazgo clínico', sctid: '44054006', term: 'diabetes mellitus tipo 2', textoLiteral: 'diabetes tipo 2', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Familiar' },
      lesson: 'El concepto es diabetes mellitus tipo 2, pero el sujeto es un familiar; atribuirlo al paciente sería un error.',
      reasoning: [
        'La expresión clínica describe una enfermedad de la madre, por lo que el concepto y el sujeto deben separarse.',
        'La evidencia familiar no cambia el concepto a hiperglucemia ni autoriza inferir diabetes en el paciente.',
        'El campo sujeto = familiar es el dato que evita contaminar el registro clínico del paciente.',
        'Este caso muestra por qué la identificación de la expresión clínica y la asignación de atributos son capas distintas.',
      ],
    },
    {
      specialty: 'Cardiología',
      noteBefore: 'Seguimiento cardiovascular por enfermedad coronaria estable. Consta antecedente de ',
      literal: 'IAM',
      noteAfter: ' en 2018, tratado con angioplastia y colocación de stent. En la consulta actual niega dolor torácico, no presenta cambios isquémicos agudos y continúa con prevención secundaria.',
      candidates: [
        { label: 'Dolor torácico', code: '29857009' },
        { label: 'Síndrome coronario agudo actual' },
        { label: 'Infarto de miocardio', code: '22298006' },
      ],
      evidence: [
        { text: 'Antecedente fechado en 2018.' },
        { text: 'Angioplastia y colocación de stent posteriores al evento.' },
        { text: 'Sin dolor torácico ni cambios isquémicos agudos en la consulta actual.' },
      ],
      answer: 2,
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
      specialty: 'Consultorio',
      noteBefore: 'Consulta por disuria y aumento de la frecuencia miccional de 24 horas, sin dolor lumbar ni fiebre. En la evaluación se consigna que se sospecha ',
      literal: 'ITU',
      noteAfter: ' y se solicita urocultivo antes de iniciar tratamiento. La nota no define una localización anatómica ni confirma el diagnóstico.',
      candidates: [
        { label: 'Cistitis', code: '38822007' },
        { label: 'Infección del tracto urinario', code: '68566005' },
        { label: 'Disuria', code: '267439000' },
      ],
      evidence: [
        { text: 'Disuria y aumento de la frecuencia miccional de 24 horas.' },
        { text: 'Sin dolor lumbar ni fiebre.' },
        { text: 'Solicitud de urocultivo y ausencia de localización anatómica definida.' },
      ],
      answer: 1,
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
      specialty: 'Nota breve sin especialidad',
      noteBefore: 'Evolución de enfermería del turno nocturno: el paciente descansó, toleró la alimentación y no presentó eventos intercurrentes. Se registra ',
      literal: 'SV',
      noteAfter: ' sin cambios durante el turno. No se consignan valores numéricos, tipo de dispositivo, sitio anatómico ni procedimiento asociado a la abreviatura.',
      candidates: [
        { label: 'Sonda vesical' },
        { label: 'Signos vitales' },
        { label: 'Soporte ventilatorio' },
      ],
      evidence: [
        { text: 'Evolución nocturna sin eventos intercurrentes.' },
        { text: 'Registro literal: “SV sin cambios”.' },
        { text: 'Sin valores, tipo de dispositivo, sitio anatómico ni procedimiento asociado.' },
      ],
      answer: null,
      operationalAnnotation: null,
      lesson: 'El contexto disponible no permite expandir “SV” de manera reproducible; corresponde abstenerse.',
      reasoning: [
        '“SV” puede tener más de una expansión local plausible.',
        'La frase “sin cambios” no identifica qué entidad representa la abreviatura.',
        'Ninguna pista de la nota permite elegir un concepto por encima de los demás.',
        'Abstenerse evita convertir una posibilidad en una anotación arbitraria.',
      ],
    },
  ];

  readonly caseIndex = signal(0);
  readonly score;
  readonly contextRevealed = signal(false);
  readonly selectedCandidate = signal<number | null>(null);
  readonly locked = signal(false);
  readonly polarity = signal('Activo');
  readonly certainty = signal('Confirmado');
  readonly temporality = signal('Actual');
  readonly subject = signal('Paciente');
  readonly feedback = signal('');

  constructor(private readonly globalScore: GlobalScoreService = new GlobalScoreService()) {
    this.score = globalScore.total;
    const errors = validateBayesCases(this.cases);
    if (errors.length) throw new Error(`Banco de ambigüedad inválido:\n${errors.join('\n')}`);
  }

  readonly activeCase = computed(() => this.cases[this.caseIndex()]);
  readonly isolatedMention = computed(() => this.activeCase().isolatedMention ?? this.activeCase().literal);
  readonly submitLabel = computed(() => {
    if (!this.locked()) return 'Confirmar decisión';
    return this.caseIndex() === this.cases.length - 1 ? 'Reiniciar partida' : 'Siguiente caso';
  });

  selectCandidate(index: number): void {
    if (this.contextRevealed() && !this.locked()) this.selectedCandidate.set(index);
  }

  revealContext(): void {
    if (this.locked()) return;
    this.contextRevealed.set(true);
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
    if (!this.contextRevealed()) {
      this.feedback.set('Mostrá el contexto de la nota antes de decidir.');
      return;
    }
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
    const earned = current.answer === null
      ? (mappingCorrect ? 100 : 0)
      : (mappingCorrect ? 60 + attributeCorrect * 10 : 0);
    const gained = this.globalScore.award('ambiguedad', `case-${this.caseIndex()}`, earned);
    const decisionFullyCorrect = mappingCorrect && (current.answer === null || attributeCorrect === 4);
    this.locked.set(true);

    const answerText = annotation
      ? `${annotation.term} (${annotation.sctid})`
      : 'abstención operativa';
    this.feedback.set(
      `${decisionFullyCorrect ? 'Decisión concordante' : mappingCorrect ? 'Concepto correcto; revisá los atributos' : 'Decisión no concordante'} · ` +
        `${gained ? `+${gained} al puntaje global.` : 'Sin nuevos puntos globales.'} ` +
        `Respuesta: ${answerText}. ${current.lesson}`
    );
  }

  private advanceCase(): void {
    if (this.caseIndex() === this.cases.length - 1) {
      this.caseIndex.set(0);
    } else {
      this.caseIndex.update((value) => value + 1);
    }
    this.resetCaseState();
  }

  private resetCaseState(): void {
    this.contextRevealed.set(false);
    this.selectedCandidate.set(null);
    this.locked.set(false);
    this.polarity.set('Activo');
    this.certainty.set('Confirmado');
    this.temporality.set('Actual');
    this.subject.set('Paciente');
    this.feedback.set('');
  }
}
