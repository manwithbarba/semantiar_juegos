# Gobierno del banco formativo SemantIAr

## Estado de esta versión

`SEMANTIAR-TRAINING-0.2` es una **versión candidata para revisión**, no una certificación de competencia ni un protocolo clínico. Los casos son derivados didácticos de patrones de notas de-identificadas; el banco declara que no contiene datos directos de pacientes.

La revisión técnica del 13 de agosto de 2026 comprobó que cada SCTID existe en SNOMED CT Argentina 2026-05-20 —la edición que el anotador detecta y prioriza actualmente en el servidor configurado— y que pertenece a la raíz ECL de la categoría que ofrece el anotador:

| Categoría | Restricción del anotador |
|---|---|
| Hallazgo clínico | `<<404684003` |
| Procedimiento | `<<71388002` |
| Fármaco | `<<373873005` |

La revisión clínica y la revisión terminológica local siguen pendientes. Esa condición se muestra en la interfaz y no debe ocultarse al distribuir el material.

## Contrato que no puede divergir

Cada respuesta codificable debe producir exactamente:

- una expresión literal presente en la nota;
- un SCTID y su término;
- categoría: `Hallazgo clínico`, `Procedimiento` o `Fármaco`;
- polaridad: `Activo` o `Negado`;
- certeza: `Confirmado`, `Sospecha` o `Diferencial`;
- temporalidad: `Actual` o `Histórico`;
- sujeto: `Paciente` o `Familiar`.

Si una decisión no puede representarse sin inferir o forzar uno de esos valores, el ejercicio debe enseñar abstención y revisión. No se crean categorías didácticas que el anotador no pueda guardar.

## Revisión necesaria antes de liberar

Cada caso nuevo o modificado debe pasar estas cuatro miradas, registrando revisor, fecha y decisión:

1. **Clínica:** plausibilidad de la nota, alcance de negación, temporalidad, certeza y sujeto.
2. **Terminológica:** concepto suficientemente específico, sin sobreinterpretación, activo y compatible con la raíz ECL.
3. **Pedagógica:** objetivo único, distractores plausibles y devolución que explique evidencia, regla y error.
4. **Privacidad:** texto derivado, sin fechas, lugares, identificadores ni combinaciones potencialmente reidentificables.

Una observación crítica o mayor bloquea la liberación del caso. Las observaciones menores deben resolverse o aceptarse con justificación explícita.

## Control de cambios

- Cambiar nota, respuesta esperada, SCTID, categoría o atributos incrementa la versión del caso.
- Cambiar el contrato, la edición terminológica o la composición del banco incrementa la versión del banco.
- Las decisiones previas del alumno se identifican por `caseId:caseVersion`; una nueva versión puede volver a evaluarse sin sobrescribir la primera decisión anterior.
- La posición de la respuesta correcta se mantiene balanceada en el conjunto y no debe seguir patrones visibles.
- La publicación sólo procede si `npm test -- --watch=false` y `npm run build:pages` finalizan correctamente.
- La publicación también exige `npm audit --audit-level=low` sin vulnerabilidades conocidas.

## Límites de interpretación

El seguimiento se guarda sólo en el navegador. La exactitud es concordancia con este banco, no desempeño clínico general. La calibración se presenta como preliminar hasta reunir ocho primeras decisiones y, aun entonces, no debe usarse como credencial, selección laboral ni evaluación sancionatoria.
