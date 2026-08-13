import type { AnnotationCategory } from './training-contract';

export const CATEGORY_ROOTS: Readonly<Record<AnnotationCategory, string>> = {
  'Hallazgo clínico': '404684003',
  Procedimiento: '71388002',
  Fármaco: '373873005',
};

export interface VerifiedTrainingConcept {
  term: string;
  category: AnnotationCategory;
  rootSctid: string;
  edition: 'SNOMED CT Argentina 2026-05-20';
  verifiedAt: '2026-08-13';
  active: true;
  rootOutcome: 'subsumes';
}

const verified = (
  term: string,
  category: AnnotationCategory
): VerifiedTrainingConcept => ({
  term,
  category,
  rootSctid: CATEGORY_ROOTS[category],
  edition: 'SNOMED CT Argentina 2026-05-20',
  verifiedAt: '2026-08-13',
  active: true,
  rootOutcome: 'subsumes',
});

/**
 * Offline allow-list generated from successful FHIR $lookup and $subsumes
 * checks against the terminology server configured by SemantIAr.  It turns a
 * one-off network review into a release invariant without making CI depend on
 * a remote service.
 */
export const VERIFIED_TRAINING_CONCEPTS: Readonly<
  Record<string, VerifiedTrainingConcept>
> = {
  '267036007': verified('disnea', 'Hallazgo clínico'),
  '44054006': verified('diabetes mellitus tipo 2', 'Hallazgo clínico'),
  '449171008': verified('saturación de oxígeno por debajo del rango de referencia', 'Hallazgo clínico'),
  '27658006': verified('producto con amoxicilina', 'Fármaco'),
  '233604007': verified('neumonía', 'Hallazgo clínico'),
  '22298006': verified('infarto de miocardio', 'Hallazgo clínico'),
  '426749004': verified('fibrilación auricular crónica', 'Hallazgo clínico'),
  '1258985005': verified('ventilación mecánica invasiva', 'Procedimiento'),
  '56018004': verified('sibilancias', 'Hallazgo clínico'),
  '386661006': verified('fiebre', 'Hallazgo clínico'),
  '230690007': verified('accidente cerebrovascular', 'Hallazgo clínico'),
  '68566005': verified('infección del tracto urinario', 'Hallazgo clínico'),
  '389087006': verified('hipoxemia', 'Hallazgo clínico'),
  '409622000': verified('insuficiencia respiratoria', 'Hallazgo clínico'),
  '29857009': verified('dolor torácico', 'Hallazgo clínico'),
  '38822007': verified('cistitis', 'Hallazgo clínico'),
  '267439000': verified('disuria', 'Hallazgo clínico'),
  '57676002': verified('artralgia', 'Hallazgo clínico'),
  '69896004': verified('artritis reumatoide', 'Hallazgo clínico'),
};
