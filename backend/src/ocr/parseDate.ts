// UK-aware date extraction logic
// Focus: prefer DD/MM/YYYY (or variants) then named month formats. Handles 2-digit years and ambiguity.

interface DateResult {
  purchase_date_iso: string | null;
  date_raw: string | null;
  warnings: string[];
}

const MONTH_NAMES = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

function pad(n: number) { return n.toString().padStart(2,'0'); }

function isValidDate(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m-1, d);
  return dt.getFullYear() === y && dt.getMonth() === m-1 && dt.getDate() === d;
}

function toIso(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }

function normalizeYear(y: number) { return y < 100 ? 2000 + y : y; }

export function extractDateUK(lines: string[], now: Date = new Date()): DateResult {
  const warnings: string[] = [];
  const joined = lines.join('\n');
  const candidates: { raw: string; iso: string; score: number; }[] = [];

  const numericPattern = /(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b)/g;
  let m: RegExpExecArray | null;
  while ((m = numericPattern.exec(joined)) !== null) {
    const raw = m[1];
    const parts = raw.split(/[\/\-]/);
    if (parts.length === 3) {
      let [a,b,c] = parts.map(p=>parseInt(p,10));
      c = normalizeYear(c);
      // UK assumption: a=day, b=month first
      let dayFirstValid = isValidDate(c, b, a);
      let monthFirstValid = isValidDate(c, a, b);
      if (dayFirstValid && !monthFirstValid) {
        candidates.push({ raw, iso: toIso(c,b,a), score: 3 });
      } else if (!dayFirstValid && monthFirstValid) {
        // ambiguous but only month-first valid -> treat as fallback; warning
        warnings.push('date_ambiguous_mmdd');
        candidates.push({ raw, iso: toIso(c,a,b), score: 2 });
      } else if (dayFirstValid && monthFirstValid) {
        // Fully ambiguous (e.g., 03/04/2025): prefer UK day-first
        candidates.push({ raw, iso: toIso(c,b,a), score: 4 });
        warnings.push('date_ambiguous_chosen_day_first');
      } else {
        warnings.push('date_invalid_pattern');
      }
    }
  }

  // Month name patterns (e.g., 17 Aug 2025 / 7 Sep 25)
  const namePattern = /(\b\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{2,4})/gi;
  while ((m = namePattern.exec(joined)) !== null) {
    const raw = m[0];
    const d = parseInt(m[1],10);
    const mon = MONTH_NAMES.indexOf(m[2].toLowerCase()) + 1;
    let y = normalizeYear(parseInt(m[3],10));
    if (isValidDate(y, mon, d)) {
      candidates.push({ raw, iso: toIso(y, mon, d), score: 5 });
    }
  }

  if (candidates.length === 0) {
    return { purchase_date_iso: null, date_raw: null, warnings };
  }

  // Pick highest score, tie-break earliest occurrence preserves earlier push order.
  candidates.sort((a,b)=> b.score - a.score);
  const chosen = candidates[0];
  // Future date sanity (allow +2 days margin)
  const chosenDate = new Date(chosen.iso + 'T00:00:00Z');
  const diffDays = (chosenDate.getTime() - now.getTime()) / 86400000;
  if (diffDays > 2) {
    warnings.push('date_future_adjust');
    // Attempt swap if numeric ambiguous could fix
    const raw = chosen.raw;
    const parts = raw.split(/[\/\-]/);
    if (parts.length === 3 && /\d/.test(parts[0]) && /\d/.test(parts[1])) {
      let [a,b,c] = parts.map(p=>parseInt(p,10));
      c = normalizeYear(c);
      if (isValidDate(c,a,b)) {
        const iso = toIso(c,a,b);
        return { purchase_date_iso: iso, date_raw: raw, warnings };
      }
    }
  }

  return { purchase_date_iso: chosen.iso, date_raw: chosen.raw, warnings };
}
