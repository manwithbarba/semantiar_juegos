import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = resolve(
  projectRoot,
  '..',
  'calibration_reports',
  'output',
  'gold_standard_gpt56_sol.json'
);
const outputPath = resolve(
  projectRoot,
  'src',
  'app',
  'fall-game',
  'fall-game-data.generated.ts'
);

function locateLiteral(text, literal) {
  const exact = text.indexOf(literal);
  if (exact >= 0) return exact;

  const lowerText = text.toLocaleLowerCase('es');
  const lowerLiteral = literal.toLocaleLowerCase('es');
  return lowerText.indexOf(lowerLiteral);
}

function caseLabel(id, index) {
  const parts = id.split('__');
  const level = parts[1] === 'AVANZADO' ? 'Avanzado' : 'Básico';
  const setting = parts[2] === 'INT' ? 'Internación' : 'Ambulatorio';
  return `CAL-${String(index + 1).padStart(2, '0')} · ${level} · ${setting}`;
}

const source = JSON.parse(await readFile(inputPath, 'utf8'));
const cases = source.cases.map((item, index) => {
  const text = String(item.text ?? '');
  const concepts = (item.concepts ?? []).map((concept, conceptIndex) => {
    const literal = String(concept.textoLiteral ?? '').trim();
    const start = locateLiteral(text, literal);
    return {
      id: `${item.id}::${conceptIndex + 1}`,
      literal,
      start,
      end: start >= 0 ? start + literal.length : -1,
      term: String(concept.term ?? '').trim(),
      sctid: String(concept.sctid ?? '').trim(),
      cat: String(concept.cat ?? '').trim(),
      pol: String(concept.pol ?? '').trim(),
      cert: String(concept.cert ?? '').trim(),
      temp: String(concept.temp ?? '').trim(),
      suj: String(concept.suj ?? '').trim(),
    };
  });

  return {
    id: String(item.id),
    label: caseLabel(String(item.id), index),
    text,
    concepts,
  };
});

const missingLiterals = cases.flatMap((item) =>
  item.concepts
    .filter((concept) => concept.start < 0)
    .map((concept) => `${item.id}: ${concept.literal}`)
);

if (missingLiterals.length) {
  console.warn(`Advertencia: ${missingLiterals.length} literales no se localizaron exactamente.`);
  for (const literal of missingLiterals) console.warn(`- ${literal}`);
}

await mkdir(dirname(outputPath), { recursive: true });
const content = `/* Generated from calibration_reports/output/gold_standard_gpt56_sol.json. */
/* The reference is provisional and requires clinical and terminology adjudication. */
export const FALL_GAME_SOURCE = ${JSON.stringify(
  {
    version: 'CAL-GOLD-PROVISIONAL-1.0',
    status: 'provisional',
    sourceFile: 'gold_standard_gpt56_sol.json',
    policy: source.goldPolicy,
  },
  null,
  2
)} as const;

export const FALL_GAME_CASES = ${JSON.stringify(cases, null, 2)} as const;
`;

await writeFile(outputPath, content, 'utf8');
console.log(`OK: ${outputPath} (${cases.length} casos, ${cases.reduce((sum, item) => sum + item.concepts.length, 0)} anotaciones)`);
