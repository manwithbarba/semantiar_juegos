# Exportación ciega de adjudicaciones

La cola de anotación se distribuye en formato JSONL para procesar un registro por línea. La versión compatible con la interfaz también queda disponible como JSON agrupado.

## Archivos

- `adjudication_input_blinded.jsonl`: un registro ciego por línea; es el formato recomendado para procesamiento y carga por lotes.
- `adjudication_input_blinded.json`: el mismo contenido agrupado en `records`, para clientes que requieren un objeto JSON.
- `adjudication_input_blinded.manifest.json`: versión, cantidad de registros y SHA-256 del JSONL.
- `adjudication_input_blind_trace_map.private.json`: mapa PI-only entre `BLD-…` y el origen. No se entrega a anotadores ni se publica.

## Qué ve un anotador

Cada fila usa un `blindRecordId` opaco (por ejemplo, `BLD-…`). No incluye `discrepancyId`, `caseId`, `pair`, `queueRow` ni los identificadores originales de anotadores. Las dos marcaciones se presentan como `A` y `B`; los identificadores anidados de la evidencia léxica también se normalizan. `textSha256` sólo sirve para verificar integridad y no es una identidad humana.

El archivo fuente `adjudication_input.json` y el mapa privado permanecen fuera de `public/` y son material de trazabilidad del investigador principal.

## Regeneración

Desde la raíz del repositorio: `node scripts/create_blinded_adjudication_exports.cjs --input <fuente-privada.json> --out-dir <carpeta-privada>`.

## Entregas individuales y cola consolidada

Para una carpeta de entregas como `cuarta entrega SemantIAr`, usar:

- `node scripts/create_blinded_annotation_exports.cjs --input-dir <carpeta> --output-dir <salida-ciega> --trace-dir <trazabilidad-PI>`
- `node scripts/create_blinded_disagreement_queue.cjs --input <cola.csv> --output-dir <salida-ciega> --trace-dir <trazabilidad-PI>`

El primer comando genera una copia ciega por JSON y `semantiar_annotations_blinded.jsonl` (un caso por línea). El segundo genera la cola ciega en CSV, JSON y JSONL. Los dos comandos comparten los `CASE-…` cuando la cola y las entregas contienen el mismo caso. Los mapas `*.private.json` son exclusivamente del investigador principal.
