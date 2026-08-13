import {
  ANNOTATION_CATEGORIES,
  ANNOTATION_CERTAINTIES,
  ANNOTATION_POLARITIES,
  ANNOTATION_SUBJECTS,
  ANNOTATION_TEMPORALITIES,
  TRAINING_SKILLS,
  TRAINING_TRACKS,
  ANNOTATION_SPAN_POLICY,
  type TrainingCase,
} from './training-contract';
import { VERIFIED_TRAINING_CONCEPTS } from './training-terminology';

const has = <T extends readonly string[]>(values: T, value: string) => values.includes(value);

const normalizeText = (value: string): string => value.normalize('NFC').toLocaleLowerCase('es-AR');

export function hasContiguousLiteral(note: string, literal: string): boolean {
  return literal.trim() === literal && literal.length > 0 && normalizeText(note).includes(normalizeText(literal));
}

export function validateTrainingCaseBank(cases: readonly TrainingCase[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const correctPositions = [0, 0, 0];
  const categories = new Set<string>();
  const skills = new Set<string>();
  const trackCounts = new Map(TRAINING_TRACKS.map((track) => [track, 0]));

  for (const item of cases) {
    if (ids.has(item.id)) errors.push(`${item.id}: identificador duplicado.`);
    ids.add(item.id);
    if (!/^TRN-\d{3}$/.test(item.id)) errors.push(`${item.id}: formato de identificador inválido.`);
    if (!/^\d+\.\d+\.\d+$/.test(item.version)) errors.push(`${item.id}: versión de caso inválida.`);
    if (!item.note.trim() || !item.prompt.trim() || !item.explanation.trim()) {
      errors.push(`${item.id}: nota, consigna y explicación son obligatorias.`);
    }
    skills.add(item.skill);
    if (has(TRAINING_TRACKS, item.track)) {
      trackCounts.set(item.track, (trackCounts.get(item.track) ?? 0) + 1);
    } else {
      errors.push(`${item.id}: recorrido fuera del contrato formativo.`);
    }
    if (item.options.length !== 3) errors.push(`${item.id}: debe tener exactamente tres opciones.`);
    if (new Set(item.options.map((option) => option.id)).size !== item.options.length) {
      errors.push(`${item.id}: identificadores de opción duplicados.`);
    }
    if (new Set(item.options.map((option) => option.label.trim().toLocaleLowerCase('es-AR'))).size !== item.options.length) {
      errors.push(`${item.id}: opciones de respuesta duplicadas.`);
    }
    if (item.options.some((option) => !option.label.trim() || !option.rationale.trim())) {
      errors.push(`${item.id}: cada opción requiere etiqueta y fundamento.`);
    }
    const correct = item.options.filter((option) => option.correct);
    if (correct.length !== 1) errors.push(`${item.id}: debe tener una única respuesta correcta.`);
    const correctIndex = item.options.findIndex((option) => option.correct);
    if (correctIndex >= 0) correctPositions[correctIndex] += 1;

    if (item.expected.kind === 'code') {
      const annotation = item.expected.annotation;
      const verifiedConcept = VERIFIED_TRAINING_CONCEPTS[annotation.sctid];
      categories.add(annotation.cat);
      if (!/^\d{6,18}$/.test(annotation.sctid)) errors.push(`${item.id}: SCTID inválido.`);
      if (!verifiedConcept) errors.push(`${item.id}: SCTID no incluido en la lista terminológica verificada.`);
      if (verifiedConcept && verifiedConcept.category !== annotation.cat) {
        errors.push(`${item.id}: el SCTID no pertenece a la categoría declarada.`);
      }
      if (verifiedConcept && verifiedConcept.term !== annotation.term) {
        errors.push(`${item.id}: el término no coincide con el display terminológico verificado.`);
      }
      if (!annotation.term.trim()) errors.push(`${item.id}: término terminológico vacío.`);
      if (!hasContiguousLiteral(item.note, annotation.textoLiteral)) {
        errors.push(`${item.id}: el literal debe ser una mención contigua, mínima y presente en la nota (${ANNOTATION_SPAN_POLICY}).`);
      }
      if (!has(ANNOTATION_CATEGORIES, annotation.cat)) errors.push(`${item.id}: categoría fuera del contrato.`);
      if (!has(ANNOTATION_POLARITIES, annotation.pol)) errors.push(`${item.id}: polaridad fuera del contrato.`);
      if (!has(ANNOTATION_CERTAINTIES, annotation.cert)) errors.push(`${item.id}: certeza fuera del contrato.`);
      if (!has(ANNOTATION_TEMPORALITIES, annotation.temp)) errors.push(`${item.id}: temporalidad fuera del contrato.`);
      if (!has(ANNOTATION_SUBJECTS, annotation.suj)) errors.push(`${item.id}: sujeto fuera del contrato.`);
    } else if (!item.expected.reason.trim()) {
      errors.push(`${item.id}: la abstención requiere un fundamento.`);
    }

    if (item.governance.directPatientData !== false) errors.push(`${item.id}: el caso no declara ausencia de datos directos.`);
    if (!item.governance.terminologyVerifiedAt) errors.push(`${item.id}: falta fecha de verificación terminológica.`);
  }

  if (cases.length < 9) errors.push('El banco debe tener al menos nueve casos antes de una liberación formativa.');
  if (Math.max(...correctPositions) - Math.min(...correctPositions) > 1) {
    errors.push('La posición de las respuestas correctas no está balanceada.');
  }
  for (const category of ANNOTATION_CATEGORIES) {
    if (!categories.has(category)) errors.push(`El banco no cubre la categoría ${category}.`);
  }
  for (const track of TRAINING_TRACKS) {
    if ((trackCounts.get(track) ?? 0) < 3) errors.push(`El recorrido ${track} requiere al menos tres casos.`);
  }
  for (const skill of TRAINING_SKILLS) {
    if (!skills.has(skill)) errors.push(`El banco no cubre la competencia ${skill}.`);
  }
  return errors;
}
