#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function arg(name, fallback) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; }
const input = path.resolve(arg('--input'));
const outputDir = path.resolve(arg('--output-dir', path.join(path.dirname(input), '_salida_ciega')));
const traceDir = path.resolve(arg('--trace-dir', path.join(path.dirname(input), '_trazabilidad_PI')));
const tracePath = path.join(traceDir, 'semantiar_blind_trace_map.private.json');
const text = fs.readFileSync(input, 'utf8');
function parseCsvLine(line) { const output=[]; let cell=''; let quoted=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='"'){ if(quoted && line[i+1]==='"'){cell+='"'; i++;} else quoted=!quoted; } else if(ch===',' && !quoted){output.push(cell); cell='';} else cell+=ch;} output.push(cell); return output; }
function csvCell(value) { const text=String(value ?? ''); return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g,'""') + '"' : text; }
const lines = text.split(/\r?\n/).filter(Boolean); const headers = parseCsvLine(lines[0]); const rows = lines.slice(1).map(parseCsvLine); const idx=Object.fromEntries(headers.map((header,index)=>[header,index]));
if (!idx.case_id || idx.pair === undefined) throw new Error('CSV must include case_id and pair.');
const TOKEN_ALPHABET = 'GHIJKLMNOPQRSTUVWXYZ23456789';
function randomToken(prefix) { const bytes = crypto.randomBytes(12); let suffix = ''; for (const byte of bytes) suffix += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]; return prefix + suffix; }
let trace = fs.existsSync(tracePath) ? JSON.parse(fs.readFileSync(tracePath,'utf8')) : { schemaVersion:'semantiar-blind-trace-map.v1', documents:[], annotatorMappings:[] };
const caseMap = new Map(); for(const doc of trace.documents || []) for(const item of doc.cases || []) if(item.originalCaseId && item.blindCaseId) caseMap.set(String(item.originalCaseId), String(item.blindCaseId));
const pairMap = new Map(); const queueTraceRows=[]; const safeRows=[];
function replaceKnown(value){let out=String(value ?? ''); for(const [original,blind] of caseMap) out=out.split(original).join(blind); for(const [original,blind] of pairMap) out=out.split(original).join(blind); for(const pair of (trace.annotatorMappings||[])) if(pair.original) out=out.split(pair.original).join(pair.blind); return out;}
for(const [rowIndex, row] of rows.entries()){
  const originalCaseId=String(row[idx.case_id] ?? ''); const originalPair=String(row[idx.pair] ?? '');
  if(!caseMap.has(originalCaseId)) caseMap.set(originalCaseId, randomToken('CASE-'));
  if(!pairMap.has(originalPair)) pairMap.set(originalPair, randomToken('PAIR-'));
  const blindRecordId=randomToken('QUEUE-'); const blindCaseId=caseMap.get(originalCaseId); const blindPair=pairMap.get(originalPair);
  const safe={blindRecordId, blindQueueRow:rowIndex+1, blindCaseId, blindPair};
  for(const header of headers){ if(header==='case_id'||header==='pair') continue; safe[header]=replaceKnown(row[idx[header]]); }
  safeRows.push(safe);
  queueTraceRows.push({blindRecordId, blindQueueRow:rowIndex+1, originalCaseId, blindCaseId, originalPair, blindPair});
}
fs.mkdirSync(outputDir,{recursive:true}); fs.mkdirSync(traceDir,{recursive:true});
const safeHeaders=['blind_record_id','blind_queue_row','blind_case_id','blind_pair',...headers.filter((header)=>header!=='case_id'&&header!=='pair')];
const csvLines=[safeHeaders.map(csvCell).join(',')]; for(const row of safeRows) csvLines.push(safeHeaders.map((header)=>csvCell(row[header])).join(','));
const csvOut=path.join(outputDir,'cola_desacuerdos_completa_20260922_blind.csv'); fs.writeFileSync(csvOut,csvLines.join('\n')+'\n');
const jsonl= safeRows.map((row)=>JSON.stringify({schemaVersion:'semantiar-disagreement-queue-blind-jsonl.v1',...row})).join('\n')+'\n';
const jsonlOut=path.join(outputDir,'cola_desacuerdos_completa_20260922_blind.jsonl'); fs.writeFileSync(jsonlOut,jsonl);
const jsonOut=path.join(outputDir,'cola_desacuerdos_completa_20260922_blind.json'); fs.writeFileSync(jsonOut,JSON.stringify({schemaVersion:'semantiar-disagreement-queue-blind.v1',blindQueueVersion:'annotator_blind_v2',recordCount:safeRows.length,records:safeRows},null,2)+'\n');
const queueTrace={schemaVersion:'semantiar-disagreement-queue-trace-map.v1',generatedAt:new Date().toISOString(),sourceFile:path.basename(input),records:queueTraceRows,pairs:[...pairMap.entries()].map(([original,blind])=>({original,blind})),cases:[...caseMap.entries()].map(([original,blind])=>({original,blind}))};
fs.writeFileSync(path.join(traceDir,'cola_desacuerdos_completa_20260922_blind_trace_map.private.json'),JSON.stringify(queueTrace,null,2)+'\n');
const manifest={schemaVersion:'semantiar-disagreement-queue-blind-manifest.v1',generatedAt:new Date().toISOString(),recordCount:safeRows.length,csvFile:path.basename(csvOut),jsonlFile:path.basename(jsonlOut),jsonFile:path.basename(jsonOut),jsonlSha256:crypto.createHash('sha256').update(jsonl).digest('hex'),traceMap:'PRIVATE: ../_trazabilidad_PI/cola_desacuerdos_completa_20260922_blind_trace_map.private.json'};
fs.writeFileSync(path.join(outputDir,'cola_desacuerdos_completa_20260922_blind.manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({outputDir,traceDir,recordCount:safeRows.length,caseCount:caseMap.size,pairCount:pairMap.size,jsonlSha256:manifest.jsonlSha256},null,2));




