// Vendor normalization: collapse spaced caps, fuzzy match against lexicon.

export interface VendorResult {
  vendor: string | null;
  vendor_raw: string | null;
  warnings: string[];
}

const DEFAULT_LEXICON = [
  'Tesco','Sainsbury\'s','Asda','Aldi','Lidl','Morrisons','Waitrose','Co-op','Iceland','Boots','Superdrug','Primark','B&Q'
];

// Collapse forms like 'T E S C O' or 'T  E  S  C  O' to 'TESCO'
export function collapseSpacedCaps(s: string): { collapsed: string; changed: boolean; } {
  const pattern = /^(?:[A-Z](?:\s)){2,}[A-Z]$/; // Single spaces between capitals
  if (pattern.test(s.trim())) {
    const collapsed = s.replace(/\s+/g,'');
    if (collapsed.length >= 3 && collapsed.length <= 15) {
      return { collapsed, changed: true };
    }
  }
  // Handle cases like 'TE SCO' (single internal space splitting a cap sequence)
  if (/^[A-Z]{2}\s[A-Z]{2,}$/.test(s)) {
    const collapsed = s.replace(/\s+/g,'');
    return { collapsed, changed: true };
  }
  return { collapsed: s, changed: false };
}

// Simple normalized distance (Damerau-Levenshtein limited) for short tokens
function distance(a: string, b: string): number {
  const la=a.length, lb=b.length;
  const dp = Array.from({length: la+1}, ()=> Array(lb+1).fill(0));
  for (let i=0;i<=la;i++) dp[i][0]=i;
  for (let j=0;j<=lb;j++) dp[0][j]=j;
  for (let i=1;i<=la;i++) {
    for (let j=1;j<=lb;j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + cost
      );
      if (i>1 && j>1 && a[i-1]===b[j-2] && a[i-2]===b[j-1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i-2][j-2] + cost); // transposition
      }
    }
  }
  return dp[la][lb];
}

function similarity(a: string, b: string): number {
  const d = distance(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - d / maxLen;
}

function normalizeForMatch(s: string): string {
  return s.replace(/[0O]/g,'O').replace(/[1I]/g,'I').replace(/5/g,'S').replace(/8/g,'B');
}

export function matchVendor(lines: string[], extraLexicon: string[] | null): VendorResult {
  const warnings: string[] = [];
  const lexicon = new Set<string>([...DEFAULT_LEXICON, ...(extraLexicon || [])]);
  const header = lines.slice(0,6).map(l=>l.trim()).filter(Boolean);
  if (header.length === 0) return { vendor: null, vendor_raw: null, warnings };

  let bestRaw: string | null = null;
  let bestCandidate: string | null = null;
  let bestScore = 0;

  for (const line of header) {
    const { collapsed, changed } = collapseSpacedCaps(line);
    let candidate = collapsed;
    if (changed) warnings.push('vendor_spaced_caps_collapsed');
    candidate = candidate.replace(/[^A-Za-z&'\-]/g,''); // strip digits/symbols except allowed
    if (!candidate || candidate.length < 3 || candidate.length > 40) continue;
    const norm = normalizeForMatch(candidate);
    for (const canonical of lexicon) {
      const score = similarity(norm, normalizeForMatch(canonical));
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = canonical;
        bestRaw = line;
      }
    }
  }

  if (bestCandidate && bestScore >= 0.86) {
    return { vendor: bestCandidate, vendor_raw: bestRaw, warnings };
  }
  if (bestRaw) warnings.push('vendor_low_confidence');
  return { vendor: null, vendor_raw: bestRaw, warnings };
}
