import { NgFor, NgIf } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface AnnotationSummary {
  expression: string;
  concept: string;
  category: string;
  polarity: string;
  certainty: string;
  temporal: string;
  subject: string;
  status?: string;
}

interface CorpusOption {
  label: string;
  rationale: string;
  correct: boolean;
}

interface CorpusExercise {
  id: string;
  number: number;
  focus: string;
  focusPath: string;
  note: string;
  question: string;
  options: CorpusOption[];
  explanation: string;
  annotation: AnnotationSummary;
}

@Component({
  selector: 'app-corpus-cases',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf],
  templateUrl: './corpus-cases.component.html',
  styleUrl: './corpus-cases.component.css',
})
export class CorpusCasesComponent {
  private readonly answers = signal<Record<string, number>>({});

  readonly cases: readonly CorpusExercise[] = [
    {
      id: 'corpus-01',
      number: 1,
      focus: 'Medición y granularidad',
      focusPath: '/granularidad',
      note: 'Control de neumonía de 10 días de evolución. Tratamiento recibido: amoxicilina (día 10). Afebril. Sat O2: 96% al aire ambiente.',
      question: '¿Cuál es la anotación más adecuada para “Sat O2: 96% al aire ambiente”?',
      options: [
        { label: 'Saturación de oxígeno · medición/observable', rationale: 'Representa el dato medido sin convertirlo en un diagnóstico.', correct: true },
        { label: 'Hipoxemia · hallazgo activo', rationale: 'Agrega una interpretación que no se sostiene con el valor documentado.', correct: false },
        { label: 'Oxigenoterapia · procedimiento', rationale: 'El texto indica aire ambiente, no administración de oxígeno.', correct: false },
      ],
      explanation: 'La saturación debe conservarse como medición/observable aislado. No corresponde inferir hipoxemia ni oxigenoterapia.',
      annotation: { expression: 'Sat O2: 96% al aire ambiente', concept: 'Saturación de oxígeno', category: 'Medición/observable', polarity: 'Activo', certainty: 'Confirmado', temporal: 'Actual', subject: 'Paciente' },
    },
    {
      id: 'corpus-02',
      number: 2,
      focus: 'Atributos y negación',
      focusPath: '/atributos',
      note: 'Hallazgo de HTA (180/100). No angor ni disnea. Se indica amlodipina 10 mg y nuevo control.',
      question: '¿Qué atributos corresponden al concepto “disnea”?',
      options: [
        { label: 'Disnea · activo · paciente', rationale: 'Invierte el sentido de la frase “no disnea”.', correct: false },
        { label: 'Disnea · negado · paciente', rationale: 'Conserva el concepto mencionado y registra la negación explícita.', correct: true },
        { label: 'No anotar disnea porque no es un diagnóstico', rationale: 'Una mención negada sigue aportando información clínica.', correct: false },
      ],
      explanation: 'La negación no elimina el concepto. Se anota “disnea” con polaridad negada, sujeto paciente y temporalidad actual.',
      annotation: { expression: 'disnea', concept: 'Disnea', category: 'Hallazgo clínico', polarity: 'Negado', certainty: 'Explícito', temporal: 'Actual', subject: 'Paciente' },
    },
    {
      id: 'corpus-03',
      number: 3,
      focus: 'Sujeto y temporalidad',
      focusPath: '/atributos',
      note: 'Antecedente familiar: DBT. Refiere desde hace una semana mareos y cefalea tensional. Presenta en piel: dermatitis ocre?',
      question: '¿Cómo resolver “DBT” en “antecedente familiar: DBT”?',
      options: [
        { label: 'Diabetes mellitus · paciente · actual', rationale: 'Atribuye al paciente una condición que el texto asigna a un familiar.', correct: false },
        { label: 'Diabetes mellitus · familiar · histórico', rationale: 'Expande la abreviatura y conserva sujeto y carácter de antecedente.', correct: true },
        { label: 'Diabetes mellitus · familiar · sospecha', rationale: 'La incertidumbre no está expresada; lo que se marca es el antecedente familiar.', correct: false },
      ],
      explanation: '“DBT” se normaliza como diabetes mellitus. “Antecedente familiar” determina sujeto familiar y temporalidad histórica.',
      annotation: { expression: 'DBT', concept: 'Diabetes mellitus', category: 'Hallazgo clínico', polarity: 'Activo en el familiar', certainty: 'Confirmado como antecedente', temporal: 'Histórico', subject: 'Familiar' },
    },
    {
      id: 'corpus-04',
      number: 4,
      focus: 'Granularidad y localización',
      focusPath: '/granularidad',
      note: 'Paciente afebril. Fauces eritematosas; se palpa adenopatía submaxilar derecha. Se solicita hisopado de fauces, test rápido y cultivo.',
      question: '¿Cuál es el concepto más preciso para “adenopatía submaxilar derecha”?',
      options: [
        { label: 'Adenopatía submandibular derecha', rationale: 'Normaliza el sinónimo y conserva la localización lateral documentada.', correct: true },
        { label: 'Linfadenopatía', rationale: 'Es demasiado general y pierde la localización.', correct: false },
        { label: 'Parotiditis derecha', rationale: 'Agrega una estructura y una enfermedad no documentadas.', correct: false },
      ],
      explanation: 'La selección adecuada mantiene el sitio anatómico y la lateralidad. No se debe reemplazar la adenopatía por otra enfermedad.',
      annotation: { expression: 'adenopatía submaxilar derecha', concept: 'Adenopatía submandibular derecha', category: 'Hallazgo clínico', polarity: 'Activo', certainty: 'Confirmado', temporal: 'Actual', subject: 'Paciente' },
    },
    {
      id: 'corpus-05',
      number: 5,
      focus: 'Abreviatura y certeza',
      focusPath: '/lenguaje-local',
      note: 'A/C ASMA..? M/C control. MH: MONTELUKAST-NEUMOCORT. Se solicitan EFR y TC de TX.',
      question: '¿Cómo debe resolverse “ASMA..?”?',
      options: [
        { label: 'Asma · confirmado · paciente', rationale: 'El signo de interrogación impide tratar el diagnóstico como confirmado.', correct: false },
        { label: 'Asma · sospecha · paciente', rationale: 'Conserva el concepto propuesto y la incertidumbre explícita.', correct: true },
        { label: 'Disnea · confirmado · paciente', rationale: 'Cambia el concepto y elimina la referencia específica a asma.', correct: false },
      ],
      explanation: 'Los signos de interrogación y el contexto de consulta expresan una posibilidad clínica, no una confirmación diagnóstica.',
      annotation: { expression: 'ASMA..?', concept: 'Asma', category: 'Hallazgo clínico', polarity: 'Activo', certainty: 'Sospecha', temporal: 'Actual', subject: 'Paciente' },
    },
    {
      id: 'corpus-06',
      number: 6,
      focus: 'Selección del span',
      focusPath: '/expresiones',
      note: 'Dificultad ventilatoria de 12 horas de evolución. Al examen: tiraje subcostal e intercostal, rales subcrepitantes y sibilancias espiratorias. Saturación 96%.',
      question: '¿Qué selección conserva mejor el hallazgo “sibilancias espiratorias”?',
      options: [
        { label: 'sibilancias espiratorias', rationale: 'Es la expresión clínica completa y literal del hallazgo.', correct: true },
        { label: 'dificultad ventilatoria con rales y sibilancias', rationale: 'Une varios hallazgos que pueden tener conceptos y atributos diferentes.', correct: false },
        { label: 'asma grave', rationale: 'Agrega un diagnóstico y una gravedad no documentados.', correct: false },
      ],
      explanation: 'El span debe conservar el hallazgo expresado sin absorber otros signos ni transformarlo en un diagnóstico.',
      annotation: { expression: 'sibilancias espiratorias', concept: 'Sibilancias', category: 'Hallazgo clínico', polarity: 'Activo', certainty: 'Confirmado', temporal: 'Actual', subject: 'Paciente' },
    },
    {
      id: 'corpus-07',
      number: 7,
      focus: 'Concepto frente a interpretación',
      focusPath: '/granularidad',
      note: 'Cuadro de 24 horas de evolución con fiebre, decaimiento y odinofagia. Cursa faringoamigdalitis. Se indica tratamiento sintomático y antibiótico.',
      question: '¿Qué concepto representa mejor “faringoamigdalitis”?',
      options: [
        { label: 'Faringoamigdalitis · actual · paciente', rationale: 'Conserva la entidad clínica documentada y su contexto actual.', correct: true },
        { label: 'Fiebre · activo · paciente', rationale: 'Es otro hallazgo de la nota, pero no reemplaza al concepto seleccionado.', correct: false },
        { label: 'Faringitis bacteriana confirmada', rationale: 'Agrega una etiología que el texto no documenta.', correct: false },
      ],
      explanation: 'La anotación puede conservar la entidad clínica escrita sin inferir etiología bacteriana a partir del uso de antibióticos.',
      annotation: { expression: 'faringoamigdalitis', concept: 'Faringoamigdalitis', category: 'Hallazgo clínico', polarity: 'Activo', certainty: 'Confirmado en la nota', temporal: 'Actual', subject: 'Paciente' },
    },
    {
      id: 'corpus-08',
      number: 8,
      focus: 'Medicamento y contexto',
      focusPath: '/atributos',
      note: 'Posoperatorio de un día y medio por aborto incompleto, con diagnóstico de anemia. Recibió una unidad de glóbulos rojos y continúa con sulfato ferroso.',
      question: '¿Cómo se anota “sulfato ferroso”?',
      options: [
        { label: 'Sulfato ferroso · medicamento · tratamiento actual', rationale: 'Identifica el fármaco y conserva que continúa indicado.', correct: true },
        { label: 'Anemia · medicamento · actual', rationale: 'Confunde el diagnóstico con el tratamiento.', correct: false },
        { label: 'Hierro intravenoso · procedimiento', rationale: 'Agrega una vía de administración que no aparece en el fragmento.', correct: false },
      ],
      explanation: 'El medicamento se anota como tal. No debe confundirse con la anemia ni asignarse una vía que el texto no documenta.',
      annotation: { expression: 'sulfato ferroso', concept: 'Sulfato ferroso', category: 'Medicamento', polarity: 'Activo', certainty: 'Confirmado', temporal: 'Actual', subject: 'Paciente' },
    },
    {
      id: 'corpus-09',
      number: 9,
      focus: 'Auditoría de procedimiento',
      focusPath: '/auditoria',
      note: 'En ateneo se decide reducción y osteosíntesis con clavo endomedular cervicodiafisario tipo gamma corto.',
      question: '¿Qué error debe evitarse al auditar esta anotación?',
      options: [
        { label: 'Registrar un procedimiento planificado, no uno ya realizado', rationale: '“Se decide” expresa una indicación o plan, no ejecución comprobada.', correct: true },
        { label: 'Cambiarlo por fractura de cadera confirmada', rationale: 'Agrega un diagnóstico que no aparece en el fragmento.', correct: false },
        { label: 'Eliminar la mención porque contiene un implante', rationale: 'La mención es una indicación clínica válida y debe conservarse.', correct: false },
      ],
      explanation: 'La auditoría debe distinguir una decisión terapéutica de un procedimiento efectivamente realizado y no agregar el diagnóstico causal.',
      annotation: { expression: 'reducción y osteosíntesis con clavo endomedular', concept: 'Reducción y osteosíntesis con implante endomedular', category: 'Procedimiento', polarity: 'Activo', certainty: 'Indicación confirmada', temporal: 'Planificado', subject: 'Paciente', status: 'No documentar como realizado' },
    },
  ];

  selectAnswer(id: string, optionIndex: number): void {
    this.answers.update((answers) => ({ ...answers, [id]: optionIndex }));
  }

  selectedAnswer(id: string): number | undefined {
    return this.answers()[id];
  }

  hasAnswer(id: string): boolean {
    return this.selectedAnswer(id) !== undefined;
  }

  isCorrect(item: CorpusExercise): boolean {
    const selected = this.selectedAnswer(item.id);
    return selected !== undefined && item.options[selected].correct;
  }
}
