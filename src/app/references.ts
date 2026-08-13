export interface EducationalReference {
  label: string;
  description: string;
  url: string;
  page: string;
}

/**
 * Bibliografía única del recorrido. Se muestra en la portada para que cada
 * fuente tenga un lugar claro dentro de la secuencia didáctica.
 */
export const EDUCATIONAL_REFERENCES: readonly EducationalReference[] = [
  {
    label: 'MedCAT: extracción y normalización de conceptos clínicos',
    description: 'Ejemplo de extracción de conceptos y normalización en texto clínico.',
    url: 'https://www.nature.com/articles/s41746-020-0258-0',
    page: 'Paso 1 · Selección de la expresión',
  },
  {
    label: 'MedSTS: similitud semántica clínica',
    description: 'Referencia para comparar expresiones clínicas sin perder su significado.',
    url: 'https://arxiv.org/abs/1808.09397',
    page: 'Paso 1 · Selección de la expresión',
  },
  {
    label: 'SNOMED CT: casos de uso clínico en historias clínicas',
    description: 'Usos clínicos, calidad de datos e interoperabilidad de SNOMED CT.',
    url: 'https://medinform.jmir.org/2023/1/e43750/',
    page: 'Pasos 2 y 4 · Concepto y auditoría',
  },
  {
    label: 'SNOMED International: guía de implementación',
    description: 'Orientación para implementar y mantener terminologías clínicas.',
    url: 'https://www.snomed.org/implementation-guide',
    page: 'Paso 2 · Elección del concepto',
  },
  {
    label: 'HL7 FHIR: recurso Condition',
    description: 'Estructura de referencia para representar condiciones clínicas y su contexto.',
    url: 'https://hl7.org/fhir/condition.html',
    page: 'Paso 3 · Atributos clínicos',
  },
  {
    label: 'Extracción de negación y aserción en textos clínicos',
    description: 'Fundamentos para distinguir polaridad, aserción y contexto clínico.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2654525/',
    page: 'Pasos 3 y 4 · Atributos y auditoría',
  },
  {
    label: 'Interoperabilidad semántica de historias clínicas',
    description: 'Revisión de los desafíos de mantener significado clínico entre sistemas.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38686541/',
    page: 'Paso 5 · Lenguaje local y normalización',
  },
  {
    label: 'FHIR y problemas semánticos en historias clínicas',
    description: 'Revisión sobre FHIR, terminologías, ontologías y preservación del significado.',
    url: 'https://www.jmir.org/2024/1/e45209/',
    page: 'Introducción y Paso 5 · Interoperabilidad',
  },
  {
    label: 'Probabilidad bayesiana en diagnóstico',
    description: 'Razones de verosimilitud y probabilidades previa y posterior en la práctica clínica. La fórmula de referencia es P(H|E) ∝ P(H) × ∏ LR(E|H).',
    url: 'https://onlinelibrary.wiley.com/doi/10.1111/j.1651-2227.2006.00179.x',
    page: 'Laboratorio Bayes · probabilidad condicional',
  },
  {
    label: 'Fórmula de Bayes y probabilidad condicional',
    description: 'Aplicación clínica de Bayes para actualizar la plausibilidad de conceptos con nueva evidencia.',
    url: 'https://journals.sagepub.com/doi/full/10.1177/10398562241300887',
    page: 'Laboratorio Bayes · probabilidad condicional',
  },
];
