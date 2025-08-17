#!/usr/bin/env ts-node
/*
Usage:
  ts-node scripts/ocr-validate.ts path/to/ocr_text.txt
Reads a plain text file (simulated OCR output) and runs the parsing pipeline (excluding actual OCR).
*/
import fs from 'fs';
import { matchVendor } from '../src/ocr/normalizeVendor';
import { extractDateUK } from '../src/ocr/parseDate';
import { preprocessImageIfEnabled } from '../src/ocr/preprocess'; // referenced for parity (not used directly here)
import { createHash } from 'crypto';

const file = process.argv[2];
if (!file) {
  console.error('Provide path to OCR text file');
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error('File not found:', file);
  process.exit(1);
}
const raw = fs.readFileSync(file,'utf8');
const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(l=>l);
const dateRes = extractDateUK(lines);
const vendorRes = matchVendor(lines, null);
const amounts = (() => {
  const pat = /\b(\d+\.\d{2})\b/g; const out: number[] = []; let m: RegExpExecArray | null;
  while ((m = pat.exec(raw))!==null) { const v = parseFloat(m[1]); if (v>=0.01 && v<=10000) out.push(v);} return out;
})();
const total = amounts.length ? Math.max(...amounts) : null;
const json = {
  vendor: vendorRes.vendor,
  vendor_raw: vendorRes.vendor_raw,
  date: dateRes.purchase_date_iso,
  date_raw: dateRes.date_raw,
  total,
  all_amounts: amounts,
  warnings: [...vendorRes.warnings, ...dateRes.warnings],
  hash_preview: createHash('sha1').update(raw.slice(0,500)).digest('hex')
};
console.log(JSON.stringify(json,null,2));
