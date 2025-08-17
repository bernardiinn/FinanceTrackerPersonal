import { createWorker } from 'tesseract.js';
import fs from 'fs';
import { preprocessImageIfEnabled } from './preprocess';
import { extractDateUK } from './parseDate';
import { matchVendor } from './normalizeVendor';

interface ParsedReceiptData {
  success: boolean;
  error?: string;
  raw_text: string;
  merchant: string | null; // kept for backward compat (alias of vendor)
  total: number | null;
  date: string | null;
  all_amounts?: number[];
  warnings?: string[];
  vendor_raw?: string | null;
}

let workerPromise: Promise<any> | null = null;

export async function ensureOcrReady(): Promise<boolean> {
  try {
    if (!workerPromise) {
      workerPromise = createWorker();
      const w = await workerPromise;
      const lang = process.env.TESSERACT_LANG || 'eng';
      await w.loadLanguage(lang);
      await w.initialize(lang);
      // Config similar to psm 6
      await w.setParameters({ tessedit_pageseg_mode: '6' });
    }
    return true;
  } catch (e) {
    console.error('[ocr] initialization failed', e);
    workerPromise = null;
    return false;
  }
}

function extractAmounts(text: string): number[] {
  const patterns = [
    /\$\s*(\d+(?:\.\d{2})?)/g,
    /(\d+\.\d{2})\s*\$/g,
    /€\s*(\d+(?:\.\d{2})?)/g,
    /£\s*(\d+(?:\.\d{2})?)/g,
    /\b(\d+\.\d{2})\b/g,
    /\b(\d+,\d{3}\.\d{2})\b/g
  ];
  const amounts: number[] = [];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(text)) !== null) {
      const amtStr = m[1].replace(/,/g, '');
      const val = parseFloat(amtStr);
      if (!isNaN(val) && val >= 0.01 && val <= 10000) amounts.push(val);
    }
  }
  return amounts;
}

// Legacy merchant heuristic retained (unused now, but fallback if vendor matching fails catastrophically)
function legacyExtractMerchant(text: string): string | null {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (/^[\d\s\-\.,$€£()]+$/.test(line)) continue;
    const lower = line.toLowerCase();
    if (['receipt','invoice','bill','ticket','date','time','tax','total','subtotal'].some(w => lower.includes(w))) continue;
    if (/[a-zA-Z]/.test(line) && line.length >= 3 && line.length <= 50) {
      const cleaned = line.replace(/[^\w\s&\-.]/g, '').trim();
      if (cleaned) return cleaned;
    }
  }
  return null;
}

// Legacy extractDate removed.

export async function parseReceiptImage(imagePath: string): Promise<ParsedReceiptData> {
  try {
    if (!fs.existsSync(imagePath)) {
      return { success: false, error: 'Image not found', raw_text: '', merchant: null, total: null, date: null };
    }
    if (!await ensureOcrReady()) {
      return { success: false, error: 'OCR engine failed to initialize', raw_text: '', merchant: null, total: null, date: null };
    }
    const preprocess = await preprocessImageIfEnabled(imagePath);
    const w = await workerPromise!;
    const { data } = await w.recognize(preprocess.path);
    preprocess.cleanup();
    const raw = (data?.text || '').trim();
    if (!raw) {
      return { success: false, error: 'No text extracted', raw_text: '', merchant: null, total: null, date: null, warnings: preprocess.warnings };
    }
    const warnings: string[] = [...preprocess.warnings];
  const lines = raw.split(/\r?\n/).map((l: string)=>l.trim()).filter((l: string)=>l.length>0);
    // Date extraction UK aware
    const dateRes = extractDateUK(lines);
    warnings.push(...dateRes.warnings);
    const date = dateRes.purchase_date_iso;
    // Vendor matching
    let extraLexicon: string[] | null = null;
    if (process.env.OCR_VENDOR_LEXICON_PATH) {
      try {
        const p = process.env.OCR_VENDOR_LEXICON_PATH;
        if (p && fs.existsSync(p)) {
          const parsed = JSON.parse(fs.readFileSync(p,'utf8'));
          if (Array.isArray(parsed)) extraLexicon = parsed.filter(x=> typeof x === 'string');
        }
      } catch (e) { warnings.push('vendor_lexicon_load_failed'); }
    }
    const vendorRes = matchVendor(lines, extraLexicon);
    warnings.push(...vendorRes.warnings);
    let merchant = vendorRes.vendor || vendorRes.vendor_raw || legacyExtractMerchant(raw);
    if (vendorRes.vendor_raw && vendorRes.vendor && vendorRes.vendor_raw !== vendorRes.vendor) {
      // Log normalization
      console.log(`[ocr] vendor_normalized '${vendorRes.vendor_raw}' -> '${vendorRes.vendor}'`);
    }
    const amounts = extractAmounts(raw);
    let total: number | null = amounts.length ? Math.max(...amounts) : null;
    if (total !== null) {
      // Suspicious if appears on a line with BALANCE/ACCOUNT or too many integer digits (>8) before decimal
  const suspiciousLine = lines.find((l: string) => l.includes(total!.toFixed(2)) || l.includes(total!.toString()));
      if (suspiciousLine && /balance|account/i.test(suspiciousLine)) {
        warnings.push('total_suspicious_context');
      }
      if (total >= 100000000) { // 9+ digits
        warnings.push('total_suspicious_size');
      }
    }
    return { success: true, raw_text: raw, merchant, total, date, error: undefined, all_amounts: amounts, warnings, vendor_raw: vendorRes.vendor_raw };
  } catch (e: any) {
    return { success: false, error: e.message, raw_text: '', merchant: null, total: null, date: null, warnings: ['unexpected_error'] };
  }
}
