#!/usr/bin/env node
/**
 * Creates annotator-safe exports from the PI-only adjudication input.
 * The trace map is intentionally private and must never be distributed.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function arg(name, fallback) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; }
const input = path.resolve(arg('--input', 'adjudication_input.json'));
const outDir = path.resolve(arg('--out-dir', path.dirname(input)));
const source = JSON.parse(fs.readFileSync(input, 'utf8'));
const experimentId = String(source.experimentId || 'private-study');
const blindQueueVersion = 'annotator_blind_v2';
const TOKEN_ALPHABET = 'GHIJKLMNOPQRSTUVWXYZ23456789';
function opaqueToken(prefix, length = 24) { const bytes = crypto.randomBytes(length); let suffix = ''; for (const byte of bytes) suffix += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]; return prefix + suffix; }
function integrityToken() { return crypto.randomBytes(32).toString('hex'); }
function deepBlind(value, label) {
  if (Array.isArray(value)) return value.map((item) => deepBlind(item, label));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, key === 'annotatorId' ? label : deepBlind(child, label)]));
  return value;
}
function blindAnnotator(value, label) { const output = deepBlind(value || {}, label); output.annotatorId = label; return output; }
const records = (source.records || []).map((record) => ({
  blindRecordId: opaqueToken('BLD-'), noteType: record.noteType || null, kind: record.kind || null, priority: record.priority || null,
  clinicalText: record.clinicalText || '', integrityToken: integrityToken(),
  annotatorA: blindAnnotator(record.annotatorA, 'A'), annotatorB: blindAnnotator(record.annotatorB, 'B'),
  mismatchFields: record.mismatchFields || [], alignment: record.alignment || null, blindQueueVersion
}));
const safeDocument = { schemaVersion: 'adjudication-input-blind.v3', protocolVersion: source.protocolVersion || null, task: source.task || null, blindQueueVersion, instructions: source.instructions || null, records };
const traceMap = { schemaVersion: 'adjudication-blind-trace-map.v2', experimentId, blindQueueVersion, generatedAt: new Date().toISOString(), records: (source.records || []).map((record, index) => ({ blindRecordId: records[index].blindRecordId, sourceDiscrepancyId: record.discrepancyId, sourceCaseId: record.caseId, sourceQueueRow: record.queueRow, sourcePair: record.pair, sourceTextSha256: record.textSha256 || null })) };
fs.mkdirSync(outDir, { recursive: true });
const groupedFile = path.join(outDir, 'adjudication_input_blinded.json');
const jsonlFile = path.join(outDir, 'adjudication_input_blinded.jsonl');
const traceFile = path.join(outDir, 'adjudication_input_blind_trace_map.private.json');
const jsonl = records.map((record) => JSON.stringify(record)).join('\n') + '\n';
fs.writeFileSync(groupedFile, JSON.stringify(safeDocument, null, 2) + '\n');
fs.writeFileSync(jsonlFile, jsonl);
fs.writeFileSync(traceFile, JSON.stringify(traceMap, null, 2) + '\n');
const manifest = { schemaVersion: 'adjudication-blind-manifest.v2', blindQueueVersion, generatedAt: new Date().toISOString(), recordCount: records.length, jsonlSha256: crypto.createHash('sha256').update(jsonl).digest('hex'), jsonlFile: path.basename(jsonlFile), groupedJsonFile: path.basename(groupedFile), traceMapFile: path.basename(traceFile), traceMapScope: 'PI-only; never distribute to annotators' };
fs.writeFileSync(path.join(outDir, 'adjudication_input_blinded.manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ recordCount: records.length, outDir, jsonlSha256: manifest.jsonlSha256 }, null, 2));
