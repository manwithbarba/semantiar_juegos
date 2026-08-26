import type { CaseGovernance, TrainingCase } from './training-contract';

export const CASE_BANK_RELEASE = {
  id: 'SEMANTIAR-TRAINING-0.2',
  publishedFor: 'entrenamiento educativo y formativo',
  terminologyEdition: 'SNOMED CT Argentina 2026-05-20',
  governanceNotice:
    'Los textos son derivados didácticos de patrones de notas de-identificadas y no contienen datos directos de pacientes. Antes de usar este banco para formación operativa, cada versión debe contar con validación clínica y terminológica local documentada.',
} as const;

const governance: CaseGovernance = {
  sourceClass: 'derivado didáctico de notas de-identificadas',
  directPatientData: false,
  terminologyEdition: CASE_BANK_RELEASE.terminologyEdition,
  terminologyVerifiedAt: '2026-08-13',
  clinicalReview: 'pendiente de validación clínica documentada',
  terminologyReview: 'SCTID y subsunción contra la raíz de categoría verificados técnicamente; requiere revisión terminológica local',
};

/**
 * The correct options are deliberately balanced A/B/C (4 each).  Answers are
 * kept in data rather than components so they can be linted and independently
 * reviewed before a release.
 */
export const TRAINING_CASES: readonly TrainingCase[] = [
  {
    id: 'TRN-001',
    version: '0.2.0',
    skill: 'Atributos',
    specialty: 'Guardia',
    note: 'Paciente con tos productiva. Niega disnea, dolor torácico y fiebre.',
    prompt: '¿Cómo se registra la mención “disnea”?',
    options: [
      { id: 'a', label: 'No anotarla porque está ausente.', rationale: 'La negación cambia la polaridad; no borra la mención clínica.', correct: false },
      { id: 'b', label: 'Codificar disnea con polaridad Negado.', rationale: 'Conserva el concepto y representa explícitamente que la nota lo niega.', correct: true },
      { id: 'c', label: 'Codificar insuficiencia respiratoria activa.', rationale: 'Agrega un diagnóstico que la nota no documenta.', correct: false },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Hallazgo clínico', sctid: '267036007', term: 'disnea', textoLiteral: 'disnea', pol: 'Negado', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
    },
    explanation: 'La negación alcanza a disnea. La certeza se registra como Confirmado porque la nota expresa de forma clara que el paciente la niega.',
    governance,
  },
  {
    id: 'TRN-002',
    version: '0.2.0',
    skill: 'Normalización',
    specialty: 'Clínica médica',
    note: 'Antecedente familiar: madre con DBT2. El paciente no refiere diabetes conocida.',
    prompt: '¿Cuál es la salida compatible con el anotador para “DBT2”?',
    options: [
      { id: 'a', label: 'Diabetes tipo 2 activa y actual en el paciente.', rationale: 'Atribuye el antecedente al sujeto equivocado.', correct: false },
      { id: 'b', label: 'Hiperglucemia actual del paciente.', rationale: 'Cambia el concepto y agrega un hallazgo no escrito.', correct: false },
      { id: 'c', label: 'Diabetes tipo 2 en familiar, histórica.', rationale: 'Expande la abreviatura y conserva el sujeto y el carácter de antecedente.', correct: true },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Hallazgo clínico', sctid: '44054006', term: 'diabetes mellitus tipo 2', textoLiteral: 'DBT2', pol: 'Activo', cert: 'Confirmado', temp: 'Histórico', suj: 'Familiar' },
    },
    glossary: [{ term: 'DBT2', definition: 'Abreviatura local de diabetes mellitus tipo 2; sólo se expande cuando el contexto la sostiene.' }],
    explanation: '“Familiar” y “Histórico” son atributos independientes. No se inventa un estado clínico para el paciente.',
    governance,
  },
  {
    id: 'TRN-003',
    version: '0.2.0',
    skill: 'Granularidad',
    specialty: 'Clínica médica',
    note: 'SatO2 91% al aire ambiente, por debajo del rango esperado. Sin disnea en reposo.',
    prompt: '¿Qué concepto respeta mejor la evidencia literal?',
    options: [
      { id: 'a', label: 'Saturación de oxígeno por debajo del rango, sin inferir diagnóstico.', rationale: 'El texto documenta un dato medido y explicita su relación con el rango; no documenta una enfermedad adicional.', correct: true },
      { id: 'b', label: 'Insuficiencia respiratoria confirmada.', rationale: 'Añade un diagnóstico que no está escrito.', correct: false },
      { id: 'c', label: 'Hipoxemia grave confirmada.', rationale: 'Añade interpretación y gravedad no documentadas.', correct: false },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Hallazgo clínico', sctid: '449171008', term: 'saturación de oxígeno por debajo del rango de referencia', textoLiteral: 'SatO2 91%', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
    },
    explanation: 'En este contrato el dato medido se modela bajo Hallazgo clínico. “Medición/observable” no es una categoría de salida admitida.',
    governance,
  },
  {
    id: 'TRN-004',
    version: '0.2.0',
    skill: 'Normalización',
    specialty: 'Consultorio',
    note: 'Continúa amoxicilina 500 mg por vía oral según indicación previa.',
    prompt: '¿Qué anotación es adecuada para “amoxicilina”?',
    options: [
      { id: 'a', label: 'Fármaco activo actual: amoxicilina.', rationale: 'Se identifica el producto terapéutico sin inferir indicación, vía adicional o diagnóstico.', correct: true },
      { id: 'b', label: 'Procedimiento de antibioticoterapia.', rationale: 'La categoría de salida para el producto es Fármaco.', correct: false },
      { id: 'c', label: 'Infección bacteriana confirmada.', rationale: 'El tratamiento no confirma por sí solo una etiología.', correct: false },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Fármaco', sctid: '27658006', term: 'producto con amoxicilina', textoLiteral: 'amoxicilina', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
    },
    explanation: 'La continuidad del fármaco permite registrar el producto como activo y actual; no habilita a inferir una enfermedad.',
    governance,
  },
  {
    id: 'TRN-005',
    version: '0.2.0',
    skill: 'Atributos',
    specialty: 'Guardia',
    note: 'Infiltrado basal derecho. Se interpreta como probable neumonía y se indica seguimiento.',
    prompt: '¿Qué certeza debe llevar “probable neumonía”?',
    options: [
      { id: 'a', label: 'Confirmado.', rationale: '“Probable” impide tratar el diagnóstico como un hecho confirmado.', correct: false },
      { id: 'b', label: 'Sospecha.', rationale: 'Conserva la entidad propuesta sin perder la incertidumbre explícita.', correct: true },
      { id: 'c', label: 'Diferencial.', rationale: 'No se proponen alternativas explícitas como diagnóstico diferencial.', correct: false },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Hallazgo clínico', sctid: '233604007', term: 'neumonía', textoLiteral: 'neumonía', pol: 'Activo', cert: 'Sospecha', temp: 'Actual', suj: 'Paciente' },
    },
    explanation: 'El concepto puede ser neumonía y la certeza, simultáneamente, Sospecha. La categoría no reemplaza a los atributos.',
    governance,
  },
  {
    id: 'TRN-006',
    version: '0.2.0',
    skill: 'Atributos',
    specialty: 'Cardiología',
    note: 'Antecedente de IAM en 2018; actualmente sin dolor torácico.',
    prompt: '¿Cómo se evita convertir el antecedente en un evento actual?',
    options: [
      { id: 'a', label: 'Eliminar IAM porque no hay dolor actual.', rationale: 'La ausencia de un síntoma actual no elimina un antecedente documentado.', correct: false },
      { id: 'b', label: 'Codificar síndrome coronario agudo actual.', rationale: 'Agrega un evento presente que el texto contradice.', correct: false },
      { id: 'c', label: 'Codificar IAM con temporalidad Histórico.', rationale: 'Mantiene el concepto y deja explícito que pertenece al pasado.', correct: true },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Hallazgo clínico', sctid: '22298006', term: 'infarto de miocardio', textoLiteral: 'IAM', pol: 'Activo', cert: 'Confirmado', temp: 'Histórico', suj: 'Paciente' },
    },
    glossary: [{ term: 'IAM', definition: 'Infarto agudo de miocardio; el año y “antecedente” determinan la temporalidad.' }],
    explanation: 'Activo no significa “actual”: describe que el evento ocurrió. Histórico conserva su ubicación temporal.',
    governance,
  },
  {
    id: 'TRN-007',
    version: '0.2.0',
    skill: 'Normalización',
    specialty: 'Cardiología',
    note: 'Paciente con FA crónica, en anticoagulación oral.',
    prompt: '¿Qué expansión está respaldada por el contexto?',
    options: [
      { id: 'a', label: 'Fosfatasa alcalina.', rationale: 'Es otra expansión posible de la forma breve, pero no concuerda con “crónica” ni con la anticoagulación.', correct: false },
      { id: 'b', label: 'Fracción de acortamiento.', rationale: 'Es una expresión cardiológica posible, pero la nota no describe una medición ecocardiográfica.', correct: false },
      { id: 'c', label: 'Fibrilación auricular crónica.', rationale: 'La nota y el tratamiento ofrecen evidencia contextual concordante.', correct: true },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Hallazgo clínico', sctid: '426749004', term: 'fibrilación auricular crónica', textoLiteral: 'FA crónica', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
    },
    glossary: [{ term: 'FA', definition: 'La expansión requiere contexto; “FA” aislada no alcanza para decidir.' }],
    explanation: 'La abreviatura se normaliza porque el contexto cardiovascular la hace verificable. En una nota aislada se debe abstener.',
    governance,
  },
  {
    id: 'TRN-008',
    version: '0.2.0',
    skill: 'Granularidad',
    specialty: 'Medicina intensiva',
    note: 'Paciente en ARM invasiva; se ajustan parámetros ventilatorios.',
    prompt: '¿Qué categoría de salida corresponde a “ARM invasiva”?',
    options: [
      { id: 'a', label: 'Hallazgo clínico.', rationale: 'Describe una intervención terapéutica, no sólo un estado clínico.', correct: false },
      { id: 'b', label: 'Procedimiento.', rationale: 'La ventilación mecánica invasiva pertenece a la jerarquía de procedimientos.', correct: true },
      { id: 'c', label: 'Fármaco.', rationale: 'No se menciona un producto medicinal.', correct: false },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Procedimiento', sctid: '1258985005', term: 'ventilación mecánica invasiva', textoLiteral: 'ARM invasiva', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
    },
    glossary: [{ term: 'ARM', definition: 'Asistencia respiratoria mecánica; el contexto de la nota define si refiere ventilación invasiva.' }],
    explanation: 'La intervención está documentada como presente. Por eso se codifica como Procedimiento, no como un diagnóstico respiratorio.',
    governance,
  },
  {
    id: 'TRN-009',
    version: '0.2.0',
    skill: 'Selección de expresión',
    specialty: 'Pediatría',
    note: 'Dificultad ventilatoria de 12 horas. Al examen: tiraje subcostal y sibilancias espiratorias.',
    prompt: '¿Qué literal debe asociarse al concepto de sibilancias?',
    options: [
      { id: 'a', label: 'Dificultad ventilatoria de 12 horas.', rationale: 'Incluye otro hallazgo y temporalidad que no forman parte del concepto objetivo.', correct: false },
      { id: 'b', label: 'Tiraje subcostal y sibilancias espiratorias.', rationale: 'Fusiona dos hallazgos que pueden codificarse por separado.', correct: false },
      { id: 'c', label: 'Sibilancias espiratorias.', rationale: 'Mantiene el hallazgo clínico completo sin absorber otra afirmación.', correct: true },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Hallazgo clínico', sctid: '56018004', term: 'sibilancias', textoLiteral: 'sibilancias espiratorias', pol: 'Activo', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
    },
    explanation: 'La mención debe conservar el modificador que caracteriza al hallazgo y excluir las menciones clínicas independientes.',
    governance,
  },
  {
    id: 'TRN-010',
    version: '0.2.0',
    skill: 'Auditoría',
    specialty: 'Traumatología',
    note: 'En ateneo se decide considerar ventilación mecánica invasiva si empeora la mecánica respiratoria.',
    prompt: '¿Cuál es la decisión compatible con el contrato actual?',
    options: [
      { id: 'a', label: 'Codificar ventilación mecánica invasiva como realizada.', rationale: '“Considerar” no documenta que el procedimiento se haya ejecutado.', correct: false },
      { id: 'b', label: 'Abstenerse y derivar la decisión a revisión operativa.', rationale: 'El contrato no tiene una temporalidad “planificado”; no debe registrarse como procedimiento actual.', correct: true },
      { id: 'c', label: 'Registrar insuficiencia respiratoria confirmada.', rationale: 'Agrega un diagnóstico no documentado.', correct: false },
    ],
    expected: { kind: 'abstain', reason: 'La nota expresa una intención condicionada; no confirma la ejecución de un procedimiento.' },
    explanation: 'Abstenerse es una decisión de calidad cuando la nota sólo expresa intención terapéutica y el modelo no dispone de un estado de planificación.',
    governance,
  },
  {
    id: 'TRN-011',
    version: '0.2.0',
    skill: 'Atributos',
    specialty: 'Guardia',
    note: 'Niega fiebre. Refiere cefalea desde ayer.',
    prompt: '¿Qué salida corresponde a “fiebre”?',
    options: [
      { id: 'a', label: 'Hallazgo clínico Fiebre con polaridad Negado.', rationale: 'La negación conserva la mención y evita transformarla en temperatura normal.', correct: true },
      { id: 'b', label: 'Hallazgo clínico Fiebre activo.', rationale: 'Invierte el sentido de “niega”.', correct: false },
      { id: 'c', label: 'No anotar porque cefalea es el único síntoma activo.', rationale: 'La presencia de otro síntoma no elimina la información negativa.', correct: false },
    ],
    expected: {
      kind: 'code',
      annotation: { cat: 'Hallazgo clínico', sctid: '386661006', term: 'fiebre', textoLiteral: 'fiebre', pol: 'Negado', cert: 'Confirmado', temp: 'Actual', suj: 'Paciente' },
    },
    explanation: 'La polaridad modifica el significado del concepto; no autoriza a reemplazarlo por un hallazgo diferente.',
    governance,
  },
  {
    id: 'TRN-012',
    version: '0.2.0',
    skill: 'Auditoría',
    specialty: 'Clínica médica',
    note: 'Evolución breve: SV sin cambios. No se agregan más precisiones.',
    prompt: '¿Qué decisión evita resolver arbitrariamente la abreviatura “SV”?',
    options: [
      { id: 'a', label: 'Abstenerse y solicitar más contexto antes de normalizar.', rationale: 'La nota no permite distinguir entre usos locales plausibles de la abreviatura.', correct: true },
      { id: 'b', label: 'Codificar sonda vesical.', rationale: 'Es una expansión posible, pero el texto no aporta evidencia suficiente para elegirla.', correct: false },
      { id: 'c', label: 'Codificar control de signos vitales.', rationale: 'También es posible y tampoco está resuelta por el contexto disponible.', correct: false },
    ],
    expected: { kind: 'abstain', reason: '“SV” puede referir, entre otros usos locales, a sonda vesical o signos vitales; el contexto no resuelve el sentido.' },
    explanation: 'En la práctica real, reconocer una abreviatura ambigua y pedir contexto es preferible a forzar una expansión.',
    governance,
  },
] as const;
