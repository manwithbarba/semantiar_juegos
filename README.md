# SemantIAr · Entrenamiento

Aplicación Angular independiente para formación en anotación de semántica clínica. El recorrido lleva desde la lectura de una mención hasta la práctica y, finalmente, a decidir si el contexto alcanza para resolver una ambigüedad.

Las cuatro estaciones aportan a un único puntaje guardado localmente en el equipo. Cada ejercicio correcto suma hasta 100 puntos y las repeticiones conservan el mejor resultado de ese ejercicio, por lo que practicar nuevamente no infla el total. El puntaje es una señal lúdica de avance y no una calificación de competencia profesional.

## Contrato operativo

El banco sólo admite los valores disponibles en el anotador:

- categorías: `Hallazgo clínico`, `Procedimiento`, `Fármaco`;
- polaridad: `Activo`, `Negado`;
- certeza: `Confirmado`, `Sospecha`, `Diferencial`;
- temporalidad: `Actual`, `Histórico`;
- sujeto: `Paciente`, `Familiar`.

Los casos codificables incluyen literal, SCTID y término. Cuando la evidencia no permite una decisión compatible con el contrato, la respuesta esperada es abstenerse y solicitar revisión, no inventar un valor adicional.

### Política única de literal y contexto

`textoLiteral` es la mención mínima, contigua y visible en la nota que expresa el concepto. La negación, la certeza, la temporalidad, el sujeto y la evidencia contextual se registran en sus atributos o en la explicación; no se extiende el literal para incluir la oración completa. Esta misma regla se aplica en las cuatro estaciones.

## Recorrido pedagógico

1. **Conceptos:** selección de la expresión, elección del concepto, atributos, auditoría y lenguaje local.
2. **Catarata:** reconocimiento rápido de menciones clínicas, formas breves y atributos.
3. **Casos clínicos:** resolución de una secuencia única de casos con devolución formativa.
4. **Ambigüedad:** comparación didáctica de conceptos para decidir si el contexto alcanza o si corresponde abstenerse.

El progreso se conserva únicamente en `localStorage`; no se transmite al servidor ni constituye una evaluación de competencia profesional.

## Módulo de ambigüedad

Cada ejercicio presenta primero una mención aislada y luego muestra la nota completa. La decisión se habilita únicamente después de leer ese contexto. Si la nota permite sostener un concepto, se elige y se completan sus atributos; si no permite distinguir las opciones, la respuesta formativa es abstenerse.

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

## Uso portable para anotadores

La carpeta `semantiar-juegos-portable` contiene una compilación autocontenida para Windows. No requiere Node, Angular, Python ni conexión a internet. La distribución no usa un service worker, para que las actualizaciones no queden retenidas por la caché del navegador.

1. Copiar o extraer la carpeta completa en la computadora del anotador.
2. Hacer doble clic en `Abrir Semantiar Juegos.bat`.
3. Usar Chrome o Edge en la dirección local que se abre automáticamente.
4. Mantener abierta la ventana de PowerShell mientras se usa la aplicación.

El progreso y el puntaje quedan guardados únicamente en ese navegador y en esa computadora. El paquete no envía notas ni resultados a servidores externos.
