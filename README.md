# SemantIAr · Entrenamiento

Aplicación Angular independiente para formación en anotación de semántica clínica. El recorrido principal reproduce el contrato del anotador SemantIAr y reserva el laboratorio bayesiano como módulo optativo de profundización.

## Contrato operativo

El banco sólo admite los valores disponibles en el anotador:

- categorías: `Hallazgo clínico`, `Procedimiento`, `Fármaco`;
- polaridad: `Activo`, `Negado`;
- certeza: `Confirmado`, `Sospecha`, `Diferencial`;
- temporalidad: `Actual`, `Histórico`;
- sujeto: `Paciente`, `Familiar`.

Los casos codificables incluyen literal, SCTID y término. Cuando la evidencia no permite una decisión compatible con el contrato, la respuesta esperada es abstenerse y solicitar revisión, no inventar un valor adicional.

## Recorrido pedagógico

1. **Guiado:** devolución inmediata para aprender el contrato.
2. **Práctica:** aplicación del criterio en notas clínicas derivadas.
3. **Dominio:** se registra la primera respuesta y la confianza antes de revelar la devolución.
4. **Seguimiento local:** exactitud por competencia y lectura preliminar de calibración.
5. **Laboratorio Bayes:** módulo optativo para explorar cómo el contexto modifica la ambigüedad.

El progreso se conserva únicamente en `localStorage`; no se transmite al servidor ni constituye una evaluación de competencia profesional.

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
