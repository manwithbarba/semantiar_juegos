import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TRAINING_CASES } from '../training/training-case-bank';

const TRAINING_CASE_BY_ID = new Map(TRAINING_CASES.map((item) => [item.id, item]));

interface LearningPage {
  path: string;
  eyebrow: string;
  title: string;
  intro: string;
  objective: string;
  steps: string[];
  exampleTitle: string;
  exampleText: string;
  options: { label: string; note: string; correct?: boolean }[];
  takeaway: string;
}

interface LearningExercise {
  title: string;
  prompt: string;
  instruction: string;
  options: { label: string; note: string; correct: boolean }[];
  feedback: string;
  source?: string;
}

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf],
  templateUrl: './learning.component.html',
  styleUrls: ['./learning.component.css', './learning.component.extra.css'],
})
export class LearningComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly selectedAnswers = signal<Record<string, number>>({});

  readonly pages: readonly LearningPage[] = [
    { path: 'expresiones', eyebrow: 'Paso 1 · expresión', title: '¿Qué parte de la nota expresa una decisión clínica?', intro: 'Aprendé a delimitar la mención clínica que vas a revisar sin agregar información que la nota no documenta.', objective: 'Delimitá la mención clínica que expresa una idea y separá la evidencia contextual de otras afirmaciones.', steps: ['Leé la oración completa.', 'Marcá la expresión clínica mínima que conserva el significado.', 'Conservá los modificadores inseparables de la mención y registrá negación, certeza, temporalidad y sujeto en sus campos correspondientes.', 'No incorpores contexto que pertenece a otra afirmación.'], exampleTitle: 'Ejemplo de selección', exampleText: 'Paciente con insuficiencia cardíaca congestiva descompensada en tratamiento.', options: [{ label: 'insuficiencia', note: 'Demasiado amplio.' }, { label: 'insuficiencia cardíaca congestiva descompensada', note: 'Conserva el significado clínico documentado.', correct: true }, { label: 'insuficiencia cardíaca congestiva descompensada en tratamiento', note: 'Incluye una acción que puede anotarse por separado.' }], takeaway: 'Una selección incorrecta de la expresión condiciona todo el mapeo posterior.' },
    { path: 'granularidad', eyebrow: 'Paso 2 · concepto', title: 'Elegí el concepto justo', intro: 'Practicá con el caso del banco de entrenamiento para elegir el nivel de detalle que realmente sostiene la evidencia.', objective: 'La granularidad adecuada es la máxima precisión que la nota permite justificar, sin inventar detalles.', steps: ['Identificá qué está explícitamente documentado.', 'Compará el concepto general con sus descendientes.', 'Descartá conceptos que agreguen etiología, gravedad o localización no escrita.', 'Elegí el concepto más específico respaldado por el contexto.'], exampleTitle: 'Ejemplo de granularidad · TRN-003', exampleText: 'SatO2 91% al aire ambiente, por debajo del rango esperado. Sin disnea en reposo.', options: [{ label: 'Insuficiencia respiratoria confirmada.', note: 'Agrega un diagnóstico no documentado.' }, { label: 'Saturación de oxígeno por debajo del rango de referencia.', note: 'Representa el dato efectivamente registrado.', correct: true }, { label: 'Hipoxemia grave confirmada.', note: 'Agrega interpretación y gravedad no documentadas.' }], takeaway: 'El concepto correcto no es el más sofisticado: es el más preciso que la evidencia permite.' },
    { path: 'atributos', eyebrow: 'Paso 3 · atributos', title: 'Un concepto, distintas afirmaciones', intro: 'El mismo concepto puede cambiar de significado clínico según cuatro atributos independientes: polaridad, certeza, temporalidad y sujeto.', objective: 'Separá la identidad del concepto de la forma en que la nota afirma, niega o contextualiza ese concepto.', steps: ['Seleccioná el concepto.', 'Determiná la polaridad: Activo o Negado.', 'Reconocé la certeza: Confirmado, Sospecha o Diferencial.', 'Definí la temporalidad y el sujeto con los valores del contrato.'], exampleTitle: 'Ejemplo de atributos · TRN-002', exampleText: 'Antecedente familiar: madre con DBT2. El paciente no refiere diabetes conocida.', options: [{ label: 'Diabetes mellitus tipo 2 · Hallazgo clínico · Activo · Confirmado · Histórico · Paciente', note: 'Confunde el sujeto: la mención corresponde a la madre.', correct: false }, { label: 'Diabetes mellitus tipo 2 · Hallazgo clínico · Activo · Confirmado · Histórico · Familiar', note: 'Conserva los cuatro atributos del contrato para la mención de la madre.', correct: true }, { label: 'Diabetes mellitus tipo 2 · Hallazgo clínico · Negado · Confirmado · Histórico · Familiar', note: 'Confunde polaridad con la negación referida al paciente.', correct: false }], takeaway: 'Mapear el concepto no alcanza: una anotación clínica necesita sus cuatro atributos.' },
    { path: 'auditoria', eyebrow: 'Paso 4 · auditoría', title: 'Detectá el error del anotador', intro: 'Revisá anotaciones propuestas y distinguí errores de expresión, concepto, granularidad o atributos.', objective: 'La auditoría permite transformar desacuerdos en decisiones reproducibles y documentadas.', steps: ['Compará la nota con la expresión seleccionada.', 'Verificá si el concepto está sustentado.', 'Revisá los cuatro atributos.', 'Decidí si corregir, adjudicar o abstenerse.'], exampleTitle: 'Ejemplo de auditoría', exampleText: 'Niega fiebre. Anotación propuesta: fiebre · activo · paciente.', options: [{ label: 'Aceptar la anotación', note: 'La polaridad contradice el texto.' }, { label: 'Corregir a fiebre · negado · paciente', note: 'Conserva el concepto y corrige la aserción.', correct: true }, { label: 'Eliminar la expresión', note: 'La negación no borra el concepto mencionado.' }], takeaway: 'Una auditoría rigurosa explica el error; no solo marca una respuesta como incorrecta.' },
    { path: 'lenguaje-local', eyebrow: 'Paso 5 · lenguaje local', title: 'Del lenguaje local al concepto estándar', intro: 'Relacioná expresiones coloquiales, abreviaturas y términos regionales con conceptos clínicos normalizados.', objective: 'El lenguaje cotidiano puede variar; el significado clínico debe mantenerse estable y explícito.', steps: ['Leé la expresión local en su contexto.', 'Expandí abreviaturas sin asumir significados.', 'Compará sinónimos y conceptos cercanos.', 'Elegí el concepto estándar que la nota permite sostener.'], exampleTitle: 'Ejemplo de normalización', exampleText: 'Paciente con “presión alta” de larga evolución, sin tratamiento actual.', options: [{ label: 'Hipertensión arterial', note: 'Concepto clínico que el contexto permite normalizar.', correct: true }, { label: 'Crisis hipertensiva', note: 'Agrega una gravedad no documentada.' }, { label: 'Presión arterial elevada aislada', note: 'No representa necesariamente una condición crónica.' }], takeaway: 'Normalizar no es traducir palabra por palabra: es conservar el significado clínico.' },
  ];

  readonly current = computed(() => {
    const path = this.route.snapshot.data['page'] as string;
    return this.pages.find((page) => page.path === path) ?? this.pages[0];
  });
  readonly index = computed(() => this.pages.findIndex((page) => page.path === this.current().path));
  readonly previous = computed(() => this.pages[this.index() - 1]);
  readonly next = computed(() => this.pages[this.index() + 1]);
  readonly exercises = computed(() => this.exerciseSets[this.current().path] ?? []);

  readonly exerciseSets: Record<string, readonly LearningExercise[]> = {
    expresiones: [
      {
        title: 'Selección con negación',
        prompt: '“Niega dolor abdominal, pero refiere náuseas desde ayer”.',
        instruction: '¿Qué expresión conviene seleccionar para anotar el concepto negado?',
        options: [
          { label: 'dolor', note: 'Es demasiado general y pierde la localización.', correct: false },
          { label: 'dolor abdominal', note: 'Conserva el concepto completo; la negación se registra como atributo.', correct: true },
          { label: 'náuseas desde ayer', note: 'Es otra afirmación clínica, no la expresión negada.', correct: false },
        ],
        feedback: 'La negación no se elimina ni se mezcla con otra afirmación: se selecciona “dolor abdominal” y luego se registra polaridad negada.',
      },
      {
        title: 'Dos afirmaciones, dos unidades',
        prompt: '“Presenta tos seca y fiebre de 38,5 °C desde hace 48 horas”.',
        instruction: '¿Cómo separarías las expresiones para que cada una pueda mapearse con sus propios atributos?',
        options: [
          { label: 'tos seca · fiebre de 38,5 °C', note: 'Son dos conceptos diferentes y deben conservarse como unidades separadas.', correct: true },
          { label: 'tos seca y fiebre', note: 'Une dos conceptos que podrían tener distinto tiempo o certeza.', correct: false },
          { label: 'cuadro febril respiratorio', note: 'Interpreta y resume; no es una expresión textual documentada.', correct: false },
        ],
        feedback: 'Cuando una oración contiene más de una afirmación, separar las unidades evita atribuir a un concepto los modificadores del otro.',
      },
      {
        title: 'No extender el span',
        prompt: '“Antecedente de ACV isquémico en 2019; actualmente sin déficit focal”.',
        instruction: '¿Cuál es el span del concepto histórico?',
        options: [
          { label: 'ACV isquémico en 2019', note: 'Incluye el concepto y su temporalidad histórica.', correct: true },
          { label: 'Antecedente de ACV isquémico en 2019; actualmente sin déficit focal', note: 'Incluye una segunda afirmación y cambia el foco.', correct: false },
          { label: 'déficit focal', note: 'Es un concepto distinto y además está negado por el contexto.', correct: false },
        ],
        feedback: 'El span debe conservar la evidencia del concepto seleccionado, pero no absorber la afirmación siguiente.',
      },
    ],
    granularidad: TRAINING_CASES.filter((item) => item.id === 'TRN-003').map((item) => ({
      title: `${item.id} · ${item.specialty}`,
      prompt: item.note,
      instruction: item.prompt,
      options: item.options.map((option) => ({ label: option.label, note: option.rationale, correct: option.correct })),
      feedback: item.explanation,
      source: item.id,
    })),
    atributos: [
      {
        title: 'Polaridad · TRN-001',
        prompt: TRAINING_CASE_BY_ID.get('TRN-001')!.note,
        instruction: '¿Qué polaridad corresponde a la mención “disnea”? La polaridad sólo puede ser Activo o Negado.',
        options: [
          { label: 'disnea · Hallazgo clínico · Activo · Confirmado · Actual · Paciente', note: 'Invierte el alcance de “niega”.', correct: false },
          { label: 'disnea · Hallazgo clínico · Negado · Confirmado · Actual · Paciente', note: 'Conserva la mención y registra la negación en polaridad.', correct: true },
          { label: 'disnea · Hallazgo clínico · Negado · Sospecha · Actual · Paciente', note: 'La negación está confirmada; no cambia la certeza a Sospecha.', correct: false },
        ],
        feedback: 'La negación se registra como polaridad = Negado. La certeza permanece Confirmado porque la nota confirma que la mención fue negada; no significa que confirme la presencia de disnea.',
        source: 'TRN-001',
      },
      {
        title: 'Certeza · TRN-005',
        prompt: TRAINING_CASE_BY_ID.get('TRN-005')!.note,
        instruction: '¿Qué certeza corresponde a “neumonía”? La certeza sólo puede ser Confirmado, Sospecha o Diferencial.',
        options: [
          { label: 'neumonía · Hallazgo clínico · Activo · Confirmado · Actual · Paciente', note: '“Probable” no permite afirmar Confirmado.', correct: false },
          { label: 'neumonía · Hallazgo clínico · Activo · Sospecha · Actual · Paciente', note: 'Registra la incertidumbre explícita como Sospecha.', correct: true },
          { label: 'neumonía · Hallazgo clínico · Activo · Diferencial · Actual · Paciente', note: 'No se presentan alternativas diagnósticas explícitas.', correct: false },
        ],
        feedback: 'La palabra “probable” corresponde a certeza = Sospecha. No es una polaridad: la mención sigue siendo Activa.',
        source: 'TRN-005',
      },
      {
        title: 'Temporalidad · TRN-006',
        prompt: TRAINING_CASE_BY_ID.get('TRN-006')!.note,
        instruction: '¿Qué temporalidad corresponde a “IAM”? La temporalidad sólo puede ser Actual o Histórico.',
        options: [
          { label: 'infarto de miocardio · Hallazgo clínico · Activo · Confirmado · Actual · Paciente', note: 'Confunde el antecedente con un evento presente.', correct: false },
          { label: 'infarto de miocardio · Hallazgo clínico · Activo · Confirmado · Histórico · Paciente', note: 'Conserva que el evento ocurrió en el pasado.', correct: true },
          { label: 'infarto de miocardio · Hallazgo clínico · Activo · Confirmado · Histórico · Familiar', note: 'La fecha es histórica, pero el sujeto sigue siendo el paciente.', correct: false },
        ],
        feedback: '“Antecedente” y “en 2018” fijan temporalidad = Histórico. Activo no significa actual: indica que el evento está documentado.',
        source: 'TRN-006',
      },
      {
        title: 'Sujeto · TRN-002',
        prompt: TRAINING_CASE_BY_ID.get('TRN-002')!.note,
        instruction: '¿Qué sujeto corresponde a “DBT2”? El sujeto sólo puede ser Paciente o Familiar.',
        options: [
          { label: 'diabetes mellitus tipo 2 · Hallazgo clínico · Activo · Confirmado · Histórico · Paciente', note: 'Atribuye al paciente una mención que corresponde a la madre.', correct: false },
          { label: 'diabetes mellitus tipo 2 · Hallazgo clínico · Activo · Confirmado · Histórico · Familiar', note: 'Conserva el sujeto documentado y los demás atributos.', correct: true },
          { label: 'diabetes mellitus tipo 2 · Hallazgo clínico · Negado · Confirmado · Histórico · Familiar', note: 'La negación corresponde al paciente, no a la mención familiar.', correct: false },
        ],
        feedback: 'El sujeto = Familiar porque la condición pertenece a la madre. La negación que aparece después no se transfiere a esta mención.',
        source: 'TRN-002',
      },
    ],
    auditoria: [
      {
        title: 'Error de polaridad',
        prompt: 'Nota: “Niega fiebre”. Anotación: fiebre · activo · paciente.',
        instruction: 'Elegí la acción de auditoría más adecuada.',
        options: [
          { label: 'Aceptar', note: 'La anotación contradice una negación explícita.', correct: false },
          { label: 'Corregir polaridad a negado', note: 'Mantiene el concepto mencionado y corrige el atributo.', correct: true },
          { label: 'Eliminar la mención', note: 'La negación es información clínica relevante y no debe borrarse.', correct: false },
        ],
        feedback: 'Auditar no significa eliminar conceptos negados: significa conservarlos con la aserción correcta.',
      },
      {
        title: 'Error de sujeto',
        prompt: 'Nota: “Padre con cáncer de colon”. Anotación: cáncer de colon · paciente · activo.',
        instruction: '¿Qué debe corregirse?',
        options: [
          { label: 'El concepto', note: 'El concepto está explícitamente documentado.', correct: false },
          { label: 'El sujeto a familiar', note: 'La condición corresponde al padre, no al paciente.', correct: true },
          { label: 'La polaridad a negado', note: 'No hay una negación en el texto.', correct: false },
        ],
        feedback: 'El sujeto es un atributo independiente: una mención familiar no debe convertirse en antecedente del paciente.',
      },
      {
        title: 'Error de exceso interpretativo',
        prompt: 'Nota: “Tos y fiebre”. Anotación: neumonía · confirmado · paciente.',
        instruction: '¿Cómo se resuelve la discrepancia?',
        options: [
          { label: 'Aceptar porque es clínicamente posible', note: 'La posibilidad no reemplaza la evidencia textual.', correct: false },
          { label: 'Rechazar y anotar los hallazgos documentados', note: 'La propuesta agrega una enfermedad y una certeza no expresadas.', correct: true },
          { label: 'Cambiar solo confirmado por sospecha', note: 'Aún quedaría un concepto diagnóstico no documentado.', correct: false },
        ],
        feedback: 'La auditoría debe identificar tanto el concepto no sustentado como la certeza que se le atribuyó.',
      },
    ],
    'lenguaje-local': [
      {
        title: 'Expresión coloquial',
        prompt: '“Tiene la presión alta desde hace años”.',
        instruction: 'Elegí el concepto estándar que mejor conserva el significado contextual.',
        options: [
          { label: 'Hipertensión arterial', note: 'La cronicidad aporta contexto suficiente para normalizar la expresión.', correct: true },
          { label: 'Crisis hipertensiva', note: 'Agrega una urgencia y una gravedad que no aparecen.', correct: false },
          { label: 'Presión arterial elevada aislada', note: 'Pierde la información de larga evolución.', correct: false },
        ],
        feedback: 'Normalizar considera el contexto: “desde hace años” permite distinguir una condición persistente de un valor aislado.',
      },
      {
        title: 'Abreviatura ambigua',
        prompt: '“Paciente con IR crónica, control nefrológico”.',
        instruction: '¿Qué harías antes de asignar un concepto SNOMED CT?',
        options: [
          { label: 'Expandir IR automáticamente como insuficiencia respiratoria', note: 'Es una expansión posible, pero el contexto nefrológico la contradice.', correct: false },
          { label: 'Interpretar IR como insuficiencia renal y documentar la regla local', note: 'El contexto orienta la expansión y la regla debe quedar trazable.', correct: true },
          { label: 'Elegir cualquier concepto que contenga “IR”', note: 'La coincidencia de siglas no garantiza equivalencia clínica.', correct: false },
        ],
        feedback: 'Las abreviaturas deben resolverse con contexto y reglas explícitas; si persiste la ambigüedad, corresponde abstenerse.',
      },
      {
        title: 'Sinónimo regional',
        prompt: '“Consulta por falta de aire al acostarse”.',
        instruction: 'Seleccioná la normalización que conserva el fenómeno descrito.',
        options: [
          { label: 'Ortopnea', note: 'Es el término clínico estándar para disnea en decúbito.', correct: true },
          { label: 'Disnea de esfuerzo', note: 'La frase no relaciona el síntoma con el ejercicio.', correct: false },
          { label: 'Insuficiencia respiratoria', note: 'Convierte un síntoma contextual en un diagnóstico.', correct: false },
        ],
        feedback: 'La normalización puede transformar una expresión local en un término estándar siempre que el contexto sostenga la equivalencia.',
      },
    ],
  };

  exerciseKey(index: number): string {
    return `${this.current().path}-${index}`;
  }

  selectAnswer(index: number, optionIndex: number): void {
    const key = this.exerciseKey(index);
    this.selectedAnswers.update((answers) => ({ ...answers, [key]: optionIndex }));
  }

  selectedAnswer(index: number): number | undefined {
    return this.selectedAnswers()[this.exerciseKey(index)];
  }

  hasAnswer(index: number): boolean {
    return this.selectedAnswer(index) !== undefined;
  }

  isCorrect(exercise: LearningExercise, index: number): boolean {
    const selected = this.selectedAnswer(index);
    return selected !== undefined && exercise.options[selected].correct;
  }
}
