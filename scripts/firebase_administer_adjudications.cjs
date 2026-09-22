#!/usr/bin/env node
/**
 * Private SemantIAr loader. Uses Application Default Credentials and official
 * Firebase/Google APIs; it is never bundled in GitHub Pages.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const PROJECT_ID = 'semantiar-adjudicaciones-12727';
const DATABASE_ID = 'adjudications';
const DEFAULT_STUDY_ID = 'experimento-adjudicacion-multirama-20260922';
const DB_ROOT = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/' + DATABASE_ID;
const IDENTITY_ROOT = 'https://identitytoolkit.googleapis.com/v1/projects/' + PROJECT_ID;

function argument(name, required = true) {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (required && (!value || value.startsWith('--'))) throw new Error('Missing ' + name);
  return value;
}
function studyId() {
  const value = argument('--study-id', false) || DEFAULT_STUDY_ID;
  if (!/^[a-zA-Z0-9_-]{3,120}$/.test(value)) throw new Error('Invalid study id.');
  return value;
}
function safeId(value, name) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,180}$/.test(value)) throw new Error('Invalid ' + name + '.');
  return value;
}
function token() {
  return execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8' }).trim();
}
async function request(url, body) {
  const response = await fetch(url, { method: 'POST', headers: { authorization: 'Bearer ' + token(), 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || ('HTTP ' + response.status));
  return data;
}
function value(input) {
  if (input === null || input === undefined) return { nullValue: null };
  if (typeof input === 'string') return { stringValue: input };
  if (typeof input === 'boolean') return { booleanValue: input };
  if (typeof input === 'number') return Number.isSafeInteger(input) ? { integerValue: String(input) } : { doubleValue: input };
  if (Array.isArray(input)) return { arrayValue: { values: input.map(value) } };
  if (typeof input === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(input).map(([k, v]) => [k, value(v)])) } };
  throw new Error('Unsupported Firestore value.');
}
function documentWrite(relativePath, data) {
  return { update: { name: 'projects/' + PROJECT_ID + '/databases/' + DATABASE_ID + '/documents/' + relativePath, fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, value(v)])) } };
}
function chunks(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}
async function batchWrite(writes) {
  for (const group of chunks(writes, 350)) {
    const result = await request(DB_ROOT + '/documents:batchWrite', { writes: group });
    const failed = (result.status || []).find((status) => Number(status.code || 0) !== 0);
    if (failed) throw new Error('Firestore rejected a write: ' + (failed.message || failed.code));
  }
}
async function userByEmail(email) {
  const result = await request(IDENTITY_ROOT + '/accounts:lookup', { email: [email] });
  const user = result.users?.[0];
  if (!user?.localId) throw new Error('La cuenta todavía no ingresó con Google en el validador publicado.');
  return user;
}
async function bootstrap() {
  const email = argument('--principal-email').trim().toLowerCase();
  const current = await userByEmail(email);
  const claims = JSON.parse(current.customAttributes || '{}');
  await request(IDENTITY_ROOT + '/accounts:update', { localId: current.localId, customAttributes: JSON.stringify({ ...claims, researcher: true }) });
  const id = studyId(), now = new Date().toISOString();
  await batchWrite([
    documentWrite('studies/' + id, { studyId: id, status: 'active', createdAt: now, updatedAt: now }),
    documentWrite('studies/' + id + '/members/' + current.localId, { uid: current.localId, membership: 'principal_investigator', grantedAt: now })
  ]);
  console.log(JSON.stringify({ operation: 'bootstrap', studyId: id, principalUid: current.localId }));
}
function recordDocument(record, now) {
  return { discrepancyId: record.discrepancyId, queueRow: record.queueRow, pair: record.pair, caseId: record.caseId, noteType: record.noteType, kind: record.kind, priority: record.priority, clinicalText: record.clinicalText, textSha256: record.textSha256, annotatorA: record.annotatorA, annotatorB: record.annotatorB, mismatchFields: record.mismatchFields, alignment: record.alignment, workflow: { referenceState: 'pending_human_valuation', rankingState: 'not_eligible' }, source: 'adjudication_input.json', importedAt: now };
}
async function importStudy() {
  const input = JSON.parse(fs.readFileSync(path.resolve(argument('--input')), 'utf8'));
  if (!Array.isArray(input.records) || !input.experimentId) throw new Error('Expected a SemantIAr adjudication input JSON.');
  const id = studyId(), now = new Date().toISOString();
  const writes = [documentWrite('studies/' + id, { studyId: id, experimentId: input.experimentId, protocolVersion: input.protocolVersion || null, recordCount: input.records.length, sourceQueue: input.sourceQueue || null, status: 'active', updatedAt: now })];
  for (const record of input.records) {
    safeId(record.discrepancyId, 'discrepancy id');
    if (typeof record.textSha256 !== 'string' || record.textSha256.length !== 64) throw new Error('A record lacks textSha256.');
    writes.push(documentWrite('studies/' + id + '/records/' + record.discrepancyId, recordDocument(record, now)));
  }
  await batchWrite(writes);
  let baselines = 0;
  const directory = argument('--baselines-dir', false);
  if (directory) {
    const baselineWrites = [];
    for (const entry of fs.readdirSync(path.resolve(directory), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const source = path.join(path.resolve(directory), entry.name, 'adjudications.json');
      if (!fs.existsSync(source)) continue;
      for (const item of JSON.parse(fs.readFileSync(source, 'utf8')).adjudications || []) {
        safeId(item.discrepancyId, 'baseline discrepancy id');
        baselineWrites.push(documentWrite('studies/' + id + '/records/' + item.discrepancyId + '/modelBaselines/' + safeId(entry.name, 'model name'), { modelName: entry.name, discrepancyId: item.discrepancyId, adjudication: item.adjudication, sourceRole: 'comparative_baseline', eligibleForOfficialRanking: false, importedAt: now }));
        baselines += 1;
      }
    }
    await batchWrite(baselineWrites);
  }
  console.log(JSON.stringify({ operation: 'import', studyId: id, records: input.records.length, baselines }));
}
async function addMember() {
  const user = await userByEmail(argument('--email').trim().toLowerCase());
  const id = studyId();
  await batchWrite([documentWrite('studies/' + id + '/members/' + user.localId, { uid: user.localId, membership: 'annotator', grantedAt: new Date().toISOString() })]);
  console.log(JSON.stringify({ operation: 'add-member', studyId: id, uid: user.localId }));
}
(async () => {
  const command = process.argv[2];
  if (command === 'bootstrap') return bootstrap();
  if (command === 'import') return importStudy();
  if (command === 'add-member') return addMember();
  throw new Error('Use bootstrap, import or add-member.');
})().catch((error) => { console.error(error.message); process.exitCode = 1; });

