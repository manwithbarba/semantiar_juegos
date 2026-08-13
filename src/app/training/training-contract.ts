/**
 * Contract shared by the educational bank and the operational SemantIAr
 * annotator.  The names deliberately match ConceptAnnotation in the
 * annotator: a training answer must be portable as a conceptual annotation.
 */
export const ANNOTATION_CATEGORIES = ['Hallazgo clínico', 'Procedimiento', 'Fármaco'] as const;
export const ANNOTATION_POLARITIES = ['Activo', 'Negado'] as const;
export const ANNOTATION_CERTAINTIES = ['Confirmado', 'Sospecha', 'Diferencial'] as const;
export const ANNOTATION_TEMPORALITIES = ['Actual', 'Histórico'] as const;
export const ANNOTATION_SUBJECTS = ['Paciente', 'Familiar'] as const;

/**
 * A single annotation always points to the smallest contiguous mention that
 * carries the concept. Surrounding evidence (negation, certainty, time,
 * subject and clinical context) is recorded in attributes or explanation,
 * never by extending the literal to the whole sentence.
 */
export const ANNOTATION_SPAN_POLICY = 'literal-minimo-contiguo-contexto-separado' as const;

export type AnnotationCategory = (typeof ANNOTATION_CATEGORIES)[number];
export type AnnotationPolarity = (typeof ANNOTATION_POLARITIES)[number];
export type AnnotationCertainty = (typeof ANNOTATION_CERTAINTIES)[number];
export type AnnotationTemporality = (typeof ANNOTATION_TEMPORALITIES)[number];
export type AnnotationSubject = (typeof ANNOTATION_SUBJECTS)[number];

export interface TrainingAnnotation {
  cat: AnnotationCategory;
  sctid: string;
  term: string;
  textoLiteral: string;
  pol: AnnotationPolarity;
  cert: AnnotationCertainty;
  temp: AnnotationTemporality;
  suj: AnnotationSubject;
}

export interface OperationalAttributes {
  pol: AnnotationPolarity;
  cert: AnnotationCertainty;
  temp: AnnotationTemporality;
  suj: AnnotationSubject;
}

export const TRAINING_TRACKS = ['guided', 'practice', 'mastery'] as const;
export const TRAINING_SKILLS = [
  'Selección de expresión',
  'Normalización',
  'Granularidad',
  'Atributos',
  'Auditoría',
] as const;

export type TrainingTrack = (typeof TRAINING_TRACKS)[number];
export type TrainingSkill = (typeof TRAINING_SKILLS)[number];

export interface TrainingOption {
  id: string;
  label: string;
  rationale: string;
  correct: boolean;
}

export type ExpectedTrainingDecision =
  | { kind: 'code'; annotation: TrainingAnnotation }
  | { kind: 'abstain'; reason: string };

export interface CaseGovernance {
  sourceClass: 'derivado didáctico de notas de-identificadas';
  directPatientData: false;
  terminologyEdition: string;
  terminologyVerifiedAt: string;
  clinicalReview: 'pendiente de validación clínica documentada';
  terminologyReview: 'SCTID y subsunción contra la raíz de categoría verificados técnicamente; requiere revisión terminológica local';
}

export interface TrainingCase {
  id: string;
  version: string;
  track: TrainingTrack;
  skill: TrainingSkill;
  specialty: string;
  note: string;
  prompt: string;
  options: readonly TrainingOption[];
  expected: ExpectedTrainingDecision;
  explanation: string;
  glossary?: readonly { term: string; definition: string }[];
  governance: CaseGovernance;
}
