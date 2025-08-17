import { extractDateUK } from '../src/ocr/parseDate';
import { collapseSpacedCaps, matchVendor } from '../src/ocr/normalizeVendor';

function assertEqual(actual: any, expected: any, msg: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion failed: ${msg}\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`);
  }
}

// Vendor spaced caps tests
(() => {
  const r = collapseSpacedCaps('T E S C O');
  assertEqual(r.collapsed, 'TESCO', 'collapse spaced caps');
  if (!r.changed) throw new Error('Expected changed=true');
})();

(() => {
  const lines = ['   T E S C O  ', 'Some other line'];
  const res = matchVendor(lines, null);
  if (res.vendor !== 'Tesco') throw new Error(`Expected Tesco got ${res.vendor}`);
})();

(() => {
  const lines = ['TE SCO', 'Subtotal 9.99'];
  const res = matchVendor(lines, null);
  if (res.vendor !== 'Tesco') throw new Error('Expected Tesco from TE SCO');
})();

// Date tests
(() => {
  const lines = ['Item A', '17/08/2025', 'TOTAL 12.00'];
  const d = extractDateUK(lines);
  if (d.purchase_date_iso !== '2025-08-17') throw new Error('Expected 2025-08-17');
})();

(() => {
  const lines = ['03/04/2025']; // ambiguous -> UK day first => 3 April
  const d = extractDateUK(lines);
  if (d.purchase_date_iso !== '2025-04-03') throw new Error('Expected 2025-04-03 for UK ambiguity');
})();

(() => {
  const lines = ['17 Aug 2025'];
  const d = extractDateUK(lines);
  if (d.purchase_date_iso !== '2025-08-17') throw new Error('Month name date failed');
})();

console.log('ocr.spec.ts tests passed');
