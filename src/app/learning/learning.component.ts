import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
  references: { label: string; url: string }[];
}

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.css',
})
export class LearningComponent {
  private readonly route = inject(ActivatedRoute);

  readonly pages: readonly LearningPage[] = [
    { path: 'expresiones', eyebrow: 'Página 4 · selección', title: '¿Dónde empieza y termina?', intro: 'Aprendé a seleccionar la expresión clínica completa sin agregar información que la nota no documenta.', objective: 'El objetivo es delimitar la unidad de texto que expresa una idea clínica y conservar los modificadores que cambian su significado.', steps: ['Leé la oración completa.', 'Marcá la expresión clínica mínima que conserva el significado.', 'Incluí negaciones, temporalidad o certeza cuando modifiquen la expresión.', 'No incorpores contexto que pertenece a otra afirmación.'], exampleTitle: 'Ejemplo de selección', exampleText: 'Paciente con insuficiencia cardíaca congestiva descompensada en tratamiento.', options: [{ label: 'insuficiencia', note: 'Demasiado amplio.' }, { label: 'insuficiencia cardíaca congestiva descompensada', note: 'Conserva el significado clínico documentado.', correct: true }, { label: 'insuficiencia cardíaca congestiva descompensada en tratamiento', note: 'Incluye una acción que puede anotarse por separado.' }], takeaway: 'Una selección incorrecta de la expresión condiciona todo el mapeo posterior.', references: [{ label: 'MedCAT: extracción y normalización de conceptos clínicos en textos', url: 'https://www.nature.com/articles/s41746-020-0258-0' }, { label: 'MedSTS: corpus para similitud semántica clínica', url: 'https://arxiv.org/abs/1808.09397' }] },
    { path: 'granularidad', eyebrow: 'Página 5 · precisión', title: 'Elegí el concepto justo', intro: 'Compará conceptos generales y específicos para elegir el nivel de detalle que realmente sostiene la evidencia.', objective: 'La granularidad adecuada es la máxima precisión que la nota permite justificar, sin inventar detalles.', steps: ['Identificá qué está explícitamente documentado.', 'Compará el concepto general con sus descendientes.', 'Descartá conceptos que agreguen etiología, gravedad o localización no escrita.', 'Elegí el concepto más específico respaldado por el contexto.'], exampleTitle: 'Ejemplo de granularidad', exampleText: 'SatO₂ 91 % al aire ambiente. Paciente sin disnea en reposo.', options: [{ label: 'Insuficiencia respiratoria', note: 'Agrega un diagnóstico no documentado.' }, { label: 'Saturación de oxígeno (observable)', note: 'Representa el dato efectivamente registrado.', correct: true }, { label: 'Hipoxemia grave', note: 'Agrega interpretación y gravedad.' }], takeaway: 'El concepto correcto no es el más sofisticado: es el más preciso que la evidencia permite.', references: [{ label: 'SNOMED CT: casos de uso clínico en sistemas de historia clínica', url: 'https://medinform.jmir.org/2023/1/e43750/' }, { label: 'SNOMED International: guía de implementación', url: 'https://www.snomed.org/implementation-guide' }] },
    { path: 'atributos', eyebrow: 'Página 6 · aserción', title: 'Un concepto, distintas afirmaciones', intro: 'El mismo concepto puede cambiar de significado clínico según la polaridad, la certeza, el tiempo y el sujeto.', objective: 'Separá la identidad del concepto de la forma en que la nota afirma, niega o contextualiza ese concepto.', steps: ['Seleccioná el concepto.', 'Determiná si está activo o negado.', 'Reconocé confirmación, sospecha o diagnóstico diferencial.', 'Definí temporalidad y sujeto.'], exampleTitle: 'Ejemplo de atributos', exampleText: 'La madre tiene diabetes tipo 2; el paciente no refiere diagnóstico conocido.', options: [{ label: 'Diabetes tipo 2 · paciente · activo', note: 'Atribuye la enfermedad a la persona equivocada.' }, { label: 'Diabetes tipo 2 · familiar · activo', note: 'Conserva concepto y sujeto documentados.', correct: true }, { label: 'Hiperglucemia · paciente · confirmado', note: 'Cambia concepto y sujeto sin evidencia.' }], takeaway: 'Mapear el concepto no alcanza: una anotación clínica necesita sus atributos.', references: [{ label: 'HL7 FHIR: recurso Condition y sus elementos clínicos', url: 'https://hl7.org/fhir/condition.html' }, { label: 'Extracción de negación y aserción en textos clínicos', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2654525/' }] },
    { path: 'auditoria', eyebrow: 'Página 7 · control de calidad', title: 'Detectá el error del anotador', intro: 'Revisá anotaciones propuestas y distinguí errores de expresión, concepto, granularidad o atributos.', objective: 'La auditoría permite transformar desacuerdos en decisiones reproducibles y documentadas.', steps: ['Compará la nota con la expresión seleccionada.', 'Verificá si el concepto está sustentado.', 'Revisá los cuatro atributos.', 'Decidí si corregir, adjudicar o abstenerse.'], exampleTitle: 'Ejemplo de auditoría', exampleText: 'Niega fiebre. Anotación propuesta: fiebre · activo · paciente.', options: [{ label: 'Aceptar la anotación', note: 'La polaridad contradice el texto.' }, { label: 'Corregir a fiebre · negado · paciente', note: 'Conserva el concepto y corrige la aserción.', correct: true }, { label: 'Eliminar la expresión', note: 'La negación no borra el concepto mencionado.' }], takeaway: 'Una auditoría rigurosa explica el error; no solo marca una respuesta como incorrecta.', references: [{ label: 'Extracción de negación y aserción en textos clínicos', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2654525/' }, { label: 'SNOMED CT: revisión de casos de uso clínico', url: 'https://medinform.jmir.org/2023/1/e43750/' }] },
    { path: 'lenguaje-local', eyebrow: 'Página 8 · normalización', title: 'Del lenguaje local al concepto estándar', intro: 'Relacioná expresiones coloquiales, abreviaturas y términos regionales con conceptos clínicos normalizados.', objective: 'El lenguaje cotidiano puede variar; el significado clínico debe mantenerse estable y explícito.', steps: ['Leé la expresión local en su contexto.', 'Expandí abreviaturas sin asumir significados.', 'Compará sinónimos y conceptos cercanos.', 'Elegí el concepto estándar que la nota permite sostener.'], exampleTitle: 'Ejemplo de normalización', exampleText: 'Paciente con “presión alta” de larga evolución, sin tratamiento actual.', options: [{ label: 'Hipertensión arterial', note: 'Concepto clínico que el contexto permite normalizar.', correct: true }, { label: 'Crisis hipertensiva', note: 'Agrega una gravedad no documentada.' }, { label: 'Presión arterial elevada aislada', note: 'No representa necesariamente una condición crónica.' }], takeaway: 'Normalizar no es traducir palabra por palabra: es conservar el significado clínico.', references: [{ label: 'Interoperabilidad semántica de historias clínicas: revisión sistemática', url: 'https://pubmed.ncbi.nlm.nih.gov/38686541/' }, { label: 'FHIR y problemas semánticos en historias clínicas: revisión sistemática', url: 'https://www.jmir.org/2024/1/e45209/' }] },
  ];

  readonly current = computed(() => {
    const path = this.route.snapshot.data['page'] as string;
    return this.pages.find((page) => page.path === path) ?? this.pages[0];
  });
  readonly index = computed(() => this.pages.findIndex((page) => page.path === this.current().path));
  readonly previous = computed(() => this.pages[this.index() - 1]);
  readonly next = computed(() => this.pages[this.index() + 1]);
  readonly references = computed(() => this.current().references);
}
