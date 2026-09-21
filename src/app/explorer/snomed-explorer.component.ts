import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface SnomedNeighbor {
  sctid: string;
  similarity: number;
  term: string;
}
interface SnomedContext {
  caseId: string;
  annotatorId: string;
  before: string;
  mention: string;
  after: string;
  hasPrefix: boolean;
  hasSuffix: boolean;
}

interface SnomedContextPayload {
  generatedAt: string;
  contexts: Record<string, SnomedContext[]>;
}

interface SnomedRelation {
  sctid: string;
  term: string;
  onMap: boolean;
}

interface SnomedPoint {
  sctid: string;
  term: string;
  semanticTag: string;
  occurrences: number;
  caseCount: number;
  annotatorCount: number;
  categories: Record<string, number>;
  polarities: Record<string, number>;
  temporalities: Record<string, number>;
  subjects: Record<string, number>;
  parents: SnomedRelation[];
  children: SnomedRelation[];
  pca: [number, number];
  tsne: [number, number];
  neighbors: SnomedNeighbor[];
}

interface SnomedHierarchyEdge {
  source: string;
  target: string;
}

interface SnomedPayload {
  source: {
    editionLabel?: string;
    embeddingDimension: number;
    hierarchyEdgeCount: number;
    hierarchyLinkedConceptCount: number;
    generatedAt: string;
    annotatedSctidCount: number;
    embeddedSctidCount: number;
    missingSctidCount?: number;
    annotatedCaseCount?: number;
    annotatorCount?: number;
    annotatedOccurrenceCount?: number;
    publicDataPolicy?: {
      clinicalTextIncluded: boolean;
      caseIdentifiersIncluded: boolean;
      annotatorIdentifiersIncluded: boolean;
      sourcePathsIncluded: boolean;
    };
  };
  hierarchyEdges: SnomedHierarchyEdge[];
  points: SnomedPoint[];
}

interface ConceptPosition {
  x: number;
  y: number;
}

type PositionedConcept = SnomedPoint & ConceptPosition & { color: string; colorLabel: string };
type PositionedEdge = { source: PositionedConcept; target: PositionedConcept };
type ProjectionMode = 'pca' | 'tsne';
type ColorMode = 'tag' | 'category' | 'frequency' | 'annotators';

@Component({
  selector: 'app-snomed-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './snomed-explorer.component.html',
  styleUrl: './snomed-explorer.component.css',
})
export class SnomedExplorerComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly palette = ['#16a896', '#e78635', '#7568e8', '#d6557d', '#2b86c5', '#89a83d', '#e6a23c', '#4b9b91', '#ce5b4c', '#5574aa', '#a85c9a', '#5b8e4b'];

  loading = true;
  error = '';
  query = '';
  projectionMode: ProjectionMode = 'pca';
  colorMode: ColorMode = 'category';
  zoom = 1;
  showHierarchyEdges = false;
  categoryFilter = 'all';
  polarityFilter = 'all';
  temporalityFilter = 'all';
  subjectFilter = 'all';
  payload: SnomedPayload | null = null;
  contextPayload: SnomedContextPayload | null = null;
  records: SnomedPoint[] = [];
  points: PositionedConcept[] = [];
  selected: PositionedConcept | null = null;
  hovered: PositionedConcept | null = null;

  ngOnInit(): void {
    this.http.get<SnomedPayload>('snomed-concepts-data.json').subscribe({
      next: (payload) => this.setPayload(payload),
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar public/snomed-concepts-data.json. Ejecutá la aplicación desde su servidor local.';
      },
    });
    this.http.get<SnomedContextPayload>('snomed-context-data.local.json').subscribe({
      next: (payload) => this.contextPayload = payload,
      error: () => this.contextPayload = { generatedAt: '', contexts: {} },
    });
  }

  get source(): SnomedPayload['source'] | null {
    return this.payload?.source ?? null;
  }

  get selectedContexts(): SnomedContext[] {
    return this.selected ? this.contextPayload?.contexts[this.selected.sctid] ?? [] : [];
  }

  get projectionLabel(): string {
    return this.projectionMode === 'pca' ? 'Vista general de los conceptos anotados' : 'Conceptos parecidos entre sí';
  }

  get projectionDescription(): string {
    if (this.projectionMode === 'pca') {
      return 'Esta vista agrupa visualmente los conceptos anotados según el parecido entre sus términos y descripciones en SNOMED CT. Permite reconocer tendencias generales del conjunto; la relación de padre e hijo se muestra por separado.';
    }
    return 'Esta vista acerca los conceptos que tienen términos y descripciones parecidos en SNOMED CT. Sirve para explorar qué conceptos tienen una representación terminológica próxima en el conjunto.';
  }

  get mapDefinition(): string {
    return 'Cada círculo representa un concepto SNOMED CT presente en las anotaciones';
  }

  get proximityDefinition(): string {
    return 'La cercanía se calcula comparando los términos y descripciones de los conceptos; no significa que sean equivalentes ni que tengan una relación de padre e hijo.';
  }

  get hierarchyDefinition(): string {
    return 'Una línea une conceptos relacionados en la jerarquía SNOMED: el concepto más específico es un tipo del concepto más general.';
  }

  get zoomTransform(): string {
    return `translate(500 310) scale(${this.zoom}) translate(-500 -310)`;
  }

  get zoomPercent(): string {
    return `${Math.round(this.zoom * 100)}%`;
  }

  get visibleOccurrences(): number {
    return this.points.reduce((sum, point) => sum + point.occurrences, 0);
  }

  get visibleCases(): number {
    return this.points.reduce((sum, point) => sum + point.caseCount, 0);
  }

  get visibleAnnotators(): number {
    return this.source?.annotatorCount ?? 0;
  }

  get colorLabel(): string {
    const labels: Record<ColorMode, string> = {
      tag: 'Tipo de concepto SNOMED',
      category: 'Categoría clínica de la anotación',
      frequency: 'Cantidad de apariciones',
      annotators: 'Cantidad de anotadores',
    };
    return labels[this.colorMode];
  }

  get legendItems(): Array<{ label: string; color: string }> {
    return this.unique(this.points.map((point) => point.colorLabel))
      .slice(0, 24)
      .map((label) => ({ label, color: this.colorFor(label) }));
  }

  get hierarchyEdges(): SnomedHierarchyEdge[] {
    return this.payload?.hierarchyEdges ?? [];
  }

  get visibleHierarchyEdges(): PositionedEdge[] {
    if (!this.showHierarchyEdges) return [];
    const byId = new Map(this.points.map((point) => [point.sctid, point]));
    return this.hierarchyEdges
      .map((edge) => {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        return source && target ? { source, target } : null;
      })
      .filter((edge): edge is PositionedEdge => edge !== null);
  }

  get neighborConcepts(): Array<PositionedConcept & { similarity: number }> {
    if (!this.selected) return [];
    const byId = new Map(this.records.map((point) => [point.sctid, point]));
    return this.selected.neighbors
      .map((neighbor) => {
        const point = byId.get(neighbor.sctid);
        if (!point) return null;
        return { ...this.positioned(point), similarity: neighbor.similarity };
      })
      .filter((point): point is PositionedConcept & { similarity: number } => point !== null);
  }

  get categoryOptions(): string[] {
    return this.unique(this.records.flatMap((point) => Object.keys(point.categories)));
  }

  get polarityOptions(): string[] {
    return this.unique(this.records.flatMap((point) => Object.keys(point.polarities)));
  }

  get temporalityOptions(): string[] {
    return this.unique(this.records.flatMap((point) => Object.keys(point.temporalities)));
  }

  get subjectOptions(): string[] {
    return this.unique(this.records.flatMap((point) => Object.keys(point.subjects)));
  }

  get activeFilterCount(): number {
    return [this.categoryFilter, this.polarityFilter, this.temporalityFilter, this.subjectFilter].filter((value) => value !== 'all').length;
  }

  recompute(): void {
    const visible = this.records.filter((point) => this.matches(point));
    this.points = visible.map((point) => this.positioned(point));
    if (this.selected) {
      const refreshed = this.points.find((point) => point.sctid === this.selected?.sctid);
      this.selected = refreshed ?? this.selected;
    }
  }

  selectPoint(point: PositionedConcept): void {
    this.selected = point;
    this.hovered = null;
  }

  selectRelated(relation: SnomedRelation): void {
    const point = this.records.find((item) => item.sctid === relation.sctid);
    if (point) this.selectPoint(this.positioned(point));
  }

  closeDetails(): void {
    this.selected = null;
  }

  entries(values: Record<string, number>): Array<{ key: string; value: number }> {
    return Object.entries(values)
      .map(([key, value]) => ({ key, value }))
      .sort((left, right) => right.value - left.value);
  }

  formatSimilarity(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  tooltipTransform(point: ConceptPosition): string {
    const x = Math.min(720, Math.max(42, point.x - 5));
    const y = Math.min(500, Math.max(52, point.y - 65));
    return 'translate(' + x + ' ' + y + ')';
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.zoom = Math.min(2.4, Math.max(0.72, this.zoom + (event.deltaY < 0 ? 0.1 : -0.1)));
  }

  resetZoom(): void {
    this.zoom = 1;
  }

  zoomIn(): void {
    this.zoom = Math.min(2.4, this.zoom + 0.15);
  }

  zoomOut(): void {
    this.zoom = Math.max(0.72, this.zoom - 0.15);
  }

  clearSearch(): void {
    this.query = '';
    this.recompute();
  }

  clearFilters(): void {
    this.categoryFilter = 'all';
    this.polarityFilter = 'all';
    this.temporalityFilter = 'all';
    this.subjectFilter = 'all';
    this.recompute();
  }

  private setPayload(payload: SnomedPayload): void {
    this.payload = payload;
    this.records = payload.points;
    this.loading = false;
    this.error = '';
    this.recompute();
  }

  private matches(point: SnomedPoint): boolean {
    const normalized = this.normalize(this.query);
    if (normalized) {
      const searchable = this.normalize([
        point.sctid,
        point.term,
        point.semanticTag,
        ...Object.keys(point.categories),
        ...Object.keys(point.polarities),
        ...Object.keys(point.temporalities),
        ...Object.keys(point.subjects),
      ].join(' '));
      if (!searchable.includes(normalized)) return false;
    }
    if (this.categoryFilter !== 'all' && !point.categories[this.categoryFilter]) return false;
    if (this.polarityFilter !== 'all' && !point.polarities[this.polarityFilter]) return false;
    if (this.temporalityFilter !== 'all' && !point.temporalities[this.temporalityFilter]) return false;
    if (this.subjectFilter !== 'all' && !point.subjects[this.subjectFilter]) return false;
    return true;
  }

  private positioned(point: SnomedPoint): PositionedConcept {
    return {
      ...point,
      ...this.coordinatesFor(point),
      colorLabel: this.colorValue(point),
      color: this.colorFor(this.colorValue(point)),
    };
  }

  private coordinatesFor(point: SnomedPoint): ConceptPosition {
    const raw = this.projectionMode === 'pca' ? point.pca : point.tsne;
    const all = this.records.map((item) => this.projectionMode === 'pca' ? item.pca : item.tsne);
    const xValues = all.map((value) => value[0]);
    const yValues = all.map((value) => value[1]);
    const xRatio = this.axisRatio(raw[0], Math.min(...xValues), Math.max(...xValues));
    const yRatio = this.axisRatio(raw[1], Math.min(...yValues), Math.max(...yValues));
    return { x: 78 + xRatio * 844, y: 56 + (1 - yRatio) * 508 };
  }

  private colorValue(point: SnomedPoint): string {
    if (this.colorMode === 'tag') return point.semanticTag || 'Sin etiqueta';
    if (this.colorMode === 'frequency') {
      if (point.occurrences >= 5) return '5 o más apariciones';
      if (point.occurrences >= 2) return '2–4 apariciones';
      return '1 aparición';
    }
    if (this.colorMode === 'annotators') {
      return point.annotatorCount === 1 ? '1 anotador' : `${point.annotatorCount} anotadores`;
    }
    return Object.entries(point.categories).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'Sin categoría';
  }

  private colorFor(label: string): string {
    let hash = 0;
    for (let index = 0; index < label.length; index += 1) hash = (hash * 31 + label.charCodeAt(index)) | 0;
    return this.palette[Math.abs(hash) % this.palette.length];
  }

  private unique(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, 'es'));
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  private axisRatio(value: number, minimum: number, maximum: number): number {
    return minimum === maximum ? 0.5 : Math.min(1, Math.max(0, (value - minimum) / (maximum - minimum)));
  }
}
