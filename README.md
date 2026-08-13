# SemantIAr · Entrenamiento

Aplicación Angular independiente para formación en anotación de semántica clínica. El recorrido principal lleva desde la lectura de una mención hasta la práctica, el seguimiento y, finalmente, un laboratorio bayesiano optativo.

## Contrato operativo

El banco sólo admite los valores disponibles en el anotador:

- categorías: `Hallazgo clínico`, `Procedimiento`, `Fármaco`;
- polaridad: `Activo`, `Negado`;
- certeza: `Confirmado`, `Sospecha`, `Diferencial`;
- temporalidad: `Actual`, `Histórico`;
- sujeto: `Paciente`, `Familiar`.

Los casos codificables incluyen literal, SCTID y término. Cuando la evidencia no permite una decisión compatible con el contrato, la respuesta esperada es abstenerse y solicitar revisión, no inventar un valor adicional.

### Política única de literal y contexto

`textoLiteral` es la mención mínima, contigua y visible en la nota que expresa el concepto. La negación, la certeza, la temporalidad, el sujeto y la evidencia contextual se registran en sus atributos o en la explicación; no se extiende el literal para incluir la oración completa. Esta misma regla se aplica en el recorrido, el entrenamiento y el laboratorio.

## Recorrido pedagógico

1. **Recorrido conceptual:** selección de la expresión, elección del concepto, atributos, auditoría y lenguaje local.
2. **Entrenamiento guiado:** explicación paso a paso y devolución inmediata.
3. **Práctica:** aplicación del criterio en notas clínicas derivadas.
4. **Dominio:** se registra la primera respuesta y la confianza antes de revelar la devolución.
5. **Seguimiento local:** exactitud por competencia y lectura preliminar de calibración.
6. **Laboratorio Bayes:** módulo optativo para explorar cómo el contexto modifica la ambigüedad.

El progreso se conserva únicamente en `localStorage`; no se transmite al servidor ni constituye una evaluación de competencia profesional.

## Laboratorio bayesiano

El laboratorio es optativo y trabaja con hipótesis contextuales, no con una anotación operativa alternativa. Su actualización es un modelo de Bayes explícito: `P(H|E₁…Eₙ) ∝ P(H) × ∏ LR(Eᵢ|H)`. Los priors deben sumar 1 y cada evento declara independencia condicional dado el candidato. El IIS es la entropía normalizada `H(p) / log(n)`: 0 indica una hipótesis dominante y 1 una distribución completamente ambigua. Cuando la evidencia no resuelve la hipótesis, la salida operativa de referencia es abstenerse.

## Gobierno del banco

El banco vigente es `SEMANTIAR-TRAINING-0.2`. Sus textos son derivados didácticos de patrones de notas de-identificadas y no contienen identificadores internos. Cada caso declara versión, edición terminológica y estado de revisión.

Los SCTID del banco fueron comprobados técnicamente contra SNOMED CT Argentina 2026-05-20, la edición que el anotador detecta y prioriza actualmente en el servidor configurado, el 13 de agosto de 2026. Antes de usar una versión como material operativo, se requiere revisión clínica y terminológica local documentada. La validación automática controla:

- vocabularios cerrados compatibles con el anotador;
- formato del SCTID y presencia literal en la nota;
- una única respuesta correcta por caso;
- balance de posiciones para reducir estrategias de adivinación;
- cobertura de las tres categorías operativas.

El procedimiento de revisión, versionado, privacidad y liberación está detallado en [`docs/CASE_BANK_GOVERNANCE.md`](docs/CASE_BANK_GOVERNANCE.md).

## Desarrollo y verificación

```bash
npm ci
npm audit --audit-level=low
npm test -- --watch=false
npm run build:pages
```

Para desarrollo local:

```bash
npm start -- --host 127.0.0.1 --port 4200
```

Abrir `http://localhost:4200/`.
