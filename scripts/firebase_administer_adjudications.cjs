#!/usr/bin/env node
/**
 * Administrative, private loader for SemantIAr adjudications.
 * Uses Application Default Credentials; never runs in GitHub Pages.
 *
 * Commands:
 *   bootstrap --principal-email <email> [--study-id <id>]
 *   import --input <adjudication_input.json> [--study-id <id>] [--baselines-dir <responses>]
 *   add-member --email <email> [--study-id <id>]
 */
const fs = require('node:fs');
const path = require('node:path');
const { applicationDefault, initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = 'semantiar-adjudicaciones-12727';
const DATABASE_ID = 'adjudications';
const DEFAULT_STUDY_ID = 'experimento-adjudicacion-multirama-20260922';

function argument(name, required = true) {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (required && (!value || value.startsWith('--'))) throw new Error(`Missing ${name}`);
  return value;
}

function safeStudyId() {
  const value = argument('--study-id', false) || DEFAULT_STUDY_ID;
  if (!/^[a-zA-Z0-9_-]{3,120}$/.test(value)) throw new Error('Invalid study id.');
  return value;
}

function initialize() {
  const app = getApps()[0] || initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  return { auth: getAuth(app), db: getFirestore(app, DATABASE_ID) };
}

function chunks(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

async function bootstrap() {
  const email = argument('--principal-email').trim().toLowerCase();
  const studyId = safeStudyId();
  const { auth, db } = initialize();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), researcher: true });
  await db.doc(`studies/${studyId}`).set({
    studyId,
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await db.doc(`studies/${studyId}/members/${user.uid}`).set({
    uid: user.uid,
    membership: 'principal_investigator',
    grantedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(JSON.stringify({ operation: 'bootstrap', studyId, principalUid: user.uid }));
}

function recordDocument(record) {
  return {
    discrepancyId: record.discrepancyId,
    queueRow: record.queueRow,
    pair: record.pair,
    caseId: record.caseId,
    noteType: record.noteType,
    kind: record.kind,
    priority: record.priority,
    clinicalText: record.clinicalText,
    textSha256: record.textSha256,
    annotatorA: record.annotatorA,
    annotatorB: record.annotatorB,
    mismatchFields: record.mismatchFields,
    alignment: record.alignment,
    workflow: {
      referenceState: 'pending_human_valuation',
      rankingState: 'not_eligible',
    },
    source: 'adjudication_input.json',
    importedAt: FieldValue.serverTimestamp(),
  };
}

async function importStudy() {
  const inputPath = path.resolve(argument('--input'));
  const studyId = safeStudyId();
  const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (!Array.isArray(parsed.records) || !parsed.experimentId) throw new Error('Expected a SemantIAr adjudication input JSON.');
  const { db } = initialize();
  await db.doc(`studies/${studyId}`).set({
    studyId,
    experimentId: parsed.experimentId,
    protocolVersion: parsed.protocolVersion || null,
    recordCount: parsed.records.length,
    sourceQueue: parsed.sourceQueue || null,
    status: 'active',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  for (const group of chunks(parsed.records, 350)) {
    const batch = db.batch();
    for (const record of group) {
      if (!record.discrepancyId || !record.textSha256) throw new Error('A record lacks discrepancyId or textSha256.');
      batch.set(db.doc(`studies/${studyId}/records/${record.discrepancyId}`), recordDocument(record), { merge: true });
    }
    await batch.commit();
  }
  const baselineDir = argument('--baselines-dir', false);
  let baselineCount = 0;
  if (baselineDir) {
    for (const entry of fs.readdirSync(path.resolve(baselineDir), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const source = path.join(path.resolve(baselineDir), entry.name, 'adjudications.json');
      if (!fs.existsSync(source)) continue;
      const output = JSON.parse(fs.readFileSync(source, 'utf8'));
      for (const group of chunks(output.adjudications || [], 350)) {
        const batch = db.batch();
        for (const item of group) {
          batch.set(db.doc(`studies/${studyId}/records/${item.discrepancyId}/modelBaselines/${entry.name}`), {
            modelName: entry.name,
            discrepancyId: item.discrepancyId,
            adjudication: item.adjudication,
            sourceRole: 'comparative_baseline',
            eligibleForOfficialRanking: false,
            importedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
          baselineCount += 1;
        }
        await batch.commit();
      }
    }
  }
  console.log(JSON.stringify({ operation: 'import', studyId, records: parsed.records.length, baselines: baselineCount }));
}

async function addMember() {
  const email = argument('--email').trim().toLowerCase();
  const studyId = safeStudyId();
  const { auth, db } = initialize();
  const user = await auth.getUserByEmail(email);
  await db.doc(`studies/${studyId}/members/${user.uid}`).set({
    uid: user.uid,
    membership: 'annotator',
    grantedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(JSON.stringify({ operation: 'add-member', studyId, uid: user.uid }));
}

async function main() {
  const command = process.argv[2];
  if (command === 'bootstrap') return bootstrap();
  if (command === 'import') return importStudy();
  if (command === 'add-member') return addMember();
  throw new Error('Use bootstrap, import or add-member.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
