import { FALL_GAME_CASES, FALL_GAME_SOURCE } from './fall-game-data.generated';

export interface FallGameAnnotation {
  id: string;
  literal: string;
  start: number;
  end: number;
  term: string;
  sctid: string;
  cat: string;
  pol: string;
  cert: string;
  temp: string;
  suj: string;
}

export interface FallGameCase {
  id: string;
  label: string;
  text: string;
  concepts: readonly FallGameAnnotation[];
}

const CALIBRATION_CASES = FALL_GAME_CASES as unknown as readonly FallGameCase[];

export interface FallGameOption {
  id: string;
  annotation: FallGameAnnotation;
}

export type FallPromptKind = 'forma-breve' | 'forma-clinica' | 'atributos';

export interface FallGamePrompt {
  id: string;
  caseId: string;
  caseLabel: string;
  literal: string;
  annotation: FallGameAnnotation;
  options: readonly FallGameOption[];
  correctOptionId: string;
  kind: FallPromptKind;
  kindLabel: string;
  instruction: string;
}

export interface FallGameValidationResult {
  source: typeof FALL_GAME_SOURCE;
  cases: readonly FallGameCase[];
}

function stableNumber(seed: string): number {
  let value = 2166136261;
  for (const character of seed) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0) / 4294967296;
}

function deterministicShuffle<T>(items: readonly T[], seed: string): T[] {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(stableNumber(`${seed}:${index}`) * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function annotationKey(annotation: FallGameAnnotation): string {
  return `${annotation.sctid}|${annotation.term}`;
}

function isBriefForm(annotation: FallGameAnnotation): boolean {
  const value = annotation.literal.trim();
  return value.length <= 18 && /[A-ZÁÉÍÓÚÑ]/.test(value) && !/[a-záéíóúñ]/.test(value);
}

function hasNonDefaultAttributes(annotation: FallGameAnnotation): boolean {
  return (
    annotation.pol !== 'Activo' ||
    annotation.cert !== 'Confirmado' ||
    annotation.temp !== 'Actual' ||
    annotation.suj !== 'Paciente'
  );
}

function promptKind(annotation: FallGameAnnotation): FallPromptKind {
  if (hasNonDefaultAttributes(annotation)) return 'atributos';
  if (isBriefForm(annotation)) return 'forma-breve';
  return 'forma-clinica';
}

const PROMPT_COPY: Record<
  FallPromptKind,
  { label: string; instruction: (literal: string) => string }
> = {
  'forma-breve': {
    label: 'Forma breve',
    instruction: (literal) => `¿Qué concepto normaliza la forma breve “${literal}”?`,
  },
  'forma-clinica': {
    label: 'Mención clínica',
    instruction: (literal) => `¿Qué concepto representa la mención clínica “${literal}”?`,
  },
  atributos: {
    label: 'Concepto y atributos',
    instruction: (literal) => `¿Qué concepto y atributos conserva “${literal}”?`,
  },
};

function optionPool(
  correct: FallGameAnnotation,
  allAnnotations: readonly FallGameAnnotation[],
  seed: string
): FallGameOption[] {
  const seen = new Set<string>([annotationKey(correct)]);
  const sameCategory = allAnnotations.filter(
    (item) => item.cat === correct.cat && item.sctid !== correct.sctid
  );
  const otherCategories = allAnnotations.filter((item) => item.cat !== correct.cat);
  const candidates = deterministicShuffle([...sameCategory, ...otherCategories], `${seed}:pool`);
  const distractors: FallGameAnnotation[] = [];

  for (const candidate of candidates) {
    const key = annotationKey(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(candidate);
    if (distractors.length === 3) break;
  }

  const options = deterministicShuffle(
    [correct, ...distractors].map((annotation) => ({
      id: annotation.id,
      annotation,
    })),
    `${seed}:options`
  );
  return options;
}

export function buildFallGamePrompts(
  cases: readonly FallGameCase[] = CALIBRATION_CASES
): readonly FallGamePrompt[] {
  const allAnnotations = cases.flatMap((item) => item.concepts);
  return cases.flatMap((item, caseIndex) =>
    item.concepts.map((annotation, annotationIndex) => {
      const id = `${item.id}:${annotationIndex + 1}`;
      const options = optionPool(annotation, allAnnotations, `${caseIndex}:${annotationIndex}`);
      const kind = promptKind(annotation);
      const copy = PROMPT_COPY[kind];
      return {
        id,
        caseId: item.id,
        caseLabel: item.label,
        literal: annotation.literal,
        annotation,
        options,
        correctOptionId: annotation.id,
        kind,
        kindLabel: copy.label,
        instruction: copy.instruction(annotation.literal),
      };
    })
  );
}

export function attributeHint(annotation: FallGameAnnotation): string {
  const hints: string[] = [];
  if (annotation.pol !== 'Activo') hints.push(`Polaridad: ${annotation.pol}`);
  if (annotation.cert !== 'Confirmado') hints.push(`Certeza: ${annotation.cert}`);
  if (annotation.temp !== 'Actual') hints.push(`Temporalidad: ${annotation.temp}`);
  if (annotation.suj !== 'Paciente') hints.push(`Sujeto: ${annotation.suj}`);
  return hints.length ? hints.join(' · ') : 'Activo · actual · paciente';
}

export function validateFallGameData(
  cases: readonly FallGameCase[] = CALIBRATION_CASES
): string[] {
  const errors: string[] = [];
  if (FALL_GAME_SOURCE.status !== 'provisional') {
    errors.push('La fuente del juego debe conservar el estado provisional.');
  }
  if (cases.length === 0) errors.push('El banco del juego no contiene casos.');

  const allSctids = new Set<string>();
  for (const item of cases) {
    if (!item.id || !item.text.trim()) errors.push(`${item.id || 'Caso sin id'}: falta id o texto.`);
    if (!item.concepts.length) errors.push(`${item.id}: no contiene anotaciones.`);
    for (const annotation of item.concepts) {
      if (!annotation.literal || !item.text.includes(annotation.literal)) {
        errors.push(`${item.id}: el literal “${annotation.literal}” no está presente en la nota.`);
      }
      if (!/^\d{6,18}$/.test(annotation.sctid)) {
        errors.push(`${item.id}: SCTID inválido para “${annotation.literal}”.`);
      }
      allSctids.add(annotation.sctid);
    }
  }
  if (allSctids.size < 4) errors.push('El juego necesita al menos cuatro conceptos candidatos distintos.');
  return errors;
}
