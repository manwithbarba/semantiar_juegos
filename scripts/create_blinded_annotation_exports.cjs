#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function arg(name, fallback) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; }
const inputDir = path.resolve(arg('--input-dir', '.'));
const outputDir = path.resolve(arg('--output-dir', path.join(inputDir, '_salida_ciega')));
const traceDir = path.resolve(arg('--trace-dir', path.join(inputDir, '_trazabilidad_PI')));
const names = fs.readdirSync(inputDir, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json')).map((entry) => entry.name).sort();
if (!names.length) throw new Error('No JSON files found in input directory.');
const sources = names.map((name) => ({ name, data: JSON.parse(fs.readFileSync(path.join(inputDir, name), 'utf8')) }));
const TOKEN_ALPHABET = 'GHIJKLMNOPQRSTUVWXYZ23456789';
function randomToken(prefix) { const bytes = crypto.randomBytes(12); let suffix = ''; for (const byte of bytes) suffix += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]; return prefix + suffix; }
const annotatorIds = new Set();
const sourceFiles = new Set(names);
const caseIds = new Set();
const pairIds = new Set();
const caseKeys = new Set(['caseId', 'case_id', 'cell_id']);
function collect(value) {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== 'object') return;
  for (const [childKey, child] of Object.entries(value)) {
    if (childKey === 'annotatorId' && typeof child === 'string') annotatorIds.add(child);
    if (childKey === 'sourceFile' && typeof child === 'string') sourceFiles.add(child);
    if (caseKeys.has(childKey) && typeof child === 'string') caseIds.add(child);
    if ((childKey === 'pairId' || childKey === 'pair') && typeof child === 'string') pairIds.add(child);
    if (childKey === 'cases' && Array.isArray(child)) for (const item of child) if (item && typeof item.id === 'string') caseIds.add(item.id);
    collect(child);
  }
}
for (const source of sources) { collect(source.data); const raw = JSON.stringify(source.data); for (const match of raw.matchAll(/\bA\d{3,}\b/g)) annotatorIds.add(match[0]); }
const annotatorMap = new Map([...annotatorIds].sort().map((id) => [id, randomToken('ANN-')]));
const documentMap = new Map(sources.map((source, index) => [source.name, 'DOC-' + String(index + 1).padStart(3, '0') + '-' + randomToken('').slice(-8)]));
for (const source of sources) { const sf = source.data.sourceFile; if (typeof sf === 'string') documentMap.set(sf, documentMap.get(source.name)); }
const caseMap = new Map([...caseIds].sort().map((id) => [id, randomToken('CASE-')]));
const pairMap = new Map([...pairIds].sort().map((id) => [id, randomToken('PAIR-')]));
function escapeRe(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const replacements = [...new Set([...sourceFiles, ...annotatorMap.keys(), ...caseMap.keys(), ...pairMap.keys()].filter(Boolean))].sort((a, b) => b.length - a.length);
const replacementRe = replacements.length ? new RegExp(replacements.map(escapeRe).join('|'), 'g') : null;
function replaceText(text) { return replacementRe ? text.replace(replacementRe, (match) => annotatorMap.get(match) || caseMap.get(match) || pairMap.get(match) || documentMap.get(match) || match) : text; }
function sanitize(value, context, documentId, blindAnnotatorId) {
  if (Array.isArray(value)) return value.map((item) => sanitize(item, context, documentId, blindAnnotatorId));
  if (typeof value === 'string') return replaceText(value);
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === 'annotatorId') output[key] = blindAnnotatorId;
    else if (key === 'sourceFile') output[key] = 'blind-' + documentId + '.json';
    else if (caseKeys.has(key) && typeof child === 'string') output[key] = caseMap.get(child) || replaceText(child);
    else if ((key === 'pairId' || key === 'pair') && typeof child === 'string') output[key] = pairMap.get(child) || replaceText(child);
    else if (key === 'id' && context === 'case') output[key] = caseMap.get(child) || replaceText(child);
    else if (key === 'cases' && Array.isArray(child)) output[key] = child.map((item) => sanitize(item, 'case', documentId, blindAnnotatorId));
    else output[key] = sanitize(child, context, documentId, blindAnnotatorId);
  }
  return output;
}
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(traceDir, { recursive: true });
const trace = { schemaVersion: 'semantiar-blind-trace-map.v1', generatedAt: new Date().toISOString(), sourceFileCount: sources.length, documents: [], annotatorMappings: [...annotatorMap.entries()].map(([original, blind]) => ({ original, blind })) };
const safeFiles = [];
const jsonlRecords = [];
for (const [index, source] of sources.entries()) {
  const documentId = documentMap.get(source.name);
  const originalAnnotatorId = typeof source.data.annotatorId === 'string' ? source.data.annotatorId : 'UNSPECIFIED';
  const blindAnnotatorId = annotatorMap.get(originalAnnotatorId) || randomToken('ANN-');
  const safe = sanitize(source.data, null, documentId, blindAnnotatorId);
  safe.schemaVersion = 'semantiar-annotation-blind.v1';
  safe.blindExportVersion = 'semantiar-annotation-blind.v1';
  safe.blindDocumentId = documentId;
  safe.annotatorId = blindAnnotatorId;
  safe.sourceFile = 'blind-' + documentId + '.json';
  const safeName = 'blind-document-' + String(index + 1).padStart(3, '0') + '.json';
  const safePath = path.join(outputDir, safeName);
  fs.writeFileSync(safePath, JSON.stringify(safe, null, 2) + '\n');
  const caseTrace = [];
  for (const [caseIndex, item] of (safe.cases || []).entries()) {
    const blindRecordId = randomToken('REC-');
    const original = source.data.cases?.[caseIndex];
    caseTrace.push({ blindRecordId, blindCaseId: item?.id || null, originalCaseId: original?.id || null, index: caseIndex });
    jsonlRecords.push({ schemaVersion: 'semantiar-annotation-blind-jsonl.v1', blindRecordId, blindDocumentId: documentId, annotatorId: blindAnnotatorId, case: item });
  }
  trace.documents.push({ blindDocumentId: documentId, blindFileName: safeName, originalFileName: source.name, originalAnnotatorId, cases: caseTrace });
  safeFiles.push({ file: safeName, sha256: crypto.createHash('sha256').update(fs.readFileSync(safePath)).digest('hex'), caseCount: caseTrace.length });
}
const jsonlPath = path.join(outputDir, 'semantiar_annotations_blinded.jsonl');
const jsonl = jsonlRecords.map((item) => JSON.stringify(item)).join('\n') + '\n';
fs.writeFileSync(jsonlPath, jsonl);
const manifest = { schemaVersion: 'semantiar-blind-manifest.v1', generatedAt: new Date().toISOString(), documentCount: sources.length, recordCount: jsonlRecords.length, jsonlFile: path.basename(jsonlPath), jsonlSha256: crypto.createHash('sha256').update(jsonl).digest('hex'), files: safeFiles, traceMap: 'PRIVATE: ../_trazabilidad_PI/semantiar_blind_trace_map.private.json' };
fs.writeFileSync(path.join(outputDir, 'semantiar_annotations_blinded.manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outputDir, 'README_CIEGO.txt'), 'Estos archivos son para anotación ciega. No contienen los nombres de archivo originales ni los IDs originales de anotadores.\r\nEl JSONL tiene un registro por caso. No distribuir la carpeta ../_trazabilidad_PI.\r\n');
trace.manifest = manifest;
fs.writeFileSync(path.join(traceDir, 'semantiar_blind_trace_map.private.json'), JSON.stringify(trace, null, 2) + '\n');
fs.writeFileSync(path.join(traceDir, 'README_PI_ONLY.txt'), 'MAPA PRIVADO. Contiene la correspondencia entre documentos/IDs originales y sus claves ciegas. No distribuir a anotadores ni publicar.\r\n');
console.log(JSON.stringify({ outputDir, traceDir, documentCount: sources.length, recordCount: jsonlRecords.length, jsonlSha256: manifest.jsonlSha256, blindAnnotatorCount: annotatorMap.size }, null, 2));



