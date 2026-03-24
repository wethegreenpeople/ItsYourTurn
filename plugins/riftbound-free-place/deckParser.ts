// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedEntry {
  count: number;
  name?: string;
  riftbound_id?: string;
  section: string;
}

export interface ApiCard {
  id: string;
  name: string;
  riftbound_id: string;
  media: { image_url: string; artist: string; accessibility_text: string };
}

interface ApiResponse {
  items: ApiCard[];
  total: number;
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

/**
 * Format 2 token: SET-CARDNUM-VARIANT  e.g. SFD-195-2, OGN-046-1, OGS-011-1
 * The trailing digit is an art variant, not a count. Each token = one copy.
 */
const ID_TOKEN_RE = /^[A-Z]{2,4}-[A-Z]?\d+-\d+$/;

type DeckFormat = "id-only" | "sectioned" | "name-list";

function detectFormat(text: string): DeckFormat {
  const trimmed = text.trim();
  // Format 2: every whitespace-separated token looks like SET-NUM-VARIANT
  const tokens = trimmed.split(/\s+/);
  if (tokens.length > 0 && tokens.every(t => ID_TOKEN_RE.test(t))) {
    return "id-only";
  }
  // Format 1: contains at least one section header line like "MainDeck:"
  if (/^[A-Za-z][A-Za-z ]*:\s*$/m.test(trimmed)) {
    return "sectioned";
  }
  // Format 3: plain numbered lines, optionally with (SET-ID) suffix
  return "name-list";
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

/**
 * Format 2: space-separated riftbound ID tokens.
 * Counts are derived by how many times each base ID (SET-NUM) appears.
 */
function parseIdOnly(text: string): ParsedEntry[] {
  const counts = new Map<string, number>();
  for (const token of text.trim().split(/\s+/)) {
    const m = token.match(/^([A-Z]{2,4}-[A-Z]?\d+)-\d+$/);
    if (!m) continue;
    const id = m[1];
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([riftbound_id, count]) => ({
    count,
    riftbound_id,
    section: "default",
  }));
}

/**
 * Format 1: section headers followed by "COUNT Name" lines.
 * Example section headers: "Legend:", "MainDeck:", "Runes:"
 */
function parseSectioned(text: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  let section = "default";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const headerMatch = line.match(/^([A-Za-z][A-Za-z ]*):\s*$/);
    if (headerMatch) {
      section = headerMatch[1].trim();
      continue;
    }
    // Try with parenthetical riftbound ID first: "1 Obelisk of Power (BF-001)"
    let m = line.match(/^(\d+)\s+(.+?)\s+\(([A-Z]{2,4}-[A-Z0-9]+)\)\s*$/);
    if (m) {
      entries.push({ count: parseInt(m[1]), name: m[2].trim(), riftbound_id: m[3], section });
      continue;
    }
    m = line.match(/^(\d+)\s+(.+)$/);
    if (m) entries.push({ count: parseInt(m[1]), name: m[2].trim(), section });
  }
  return entries;
}

/**
 * Format 3: numbered lines, optionally with a parenthesised riftbound ID.
 * Examples:
 *   1 Leona - Radiant Dawn (OGN-261)
 *   6 Order Rune (SFD-R06)
 *   3 Guardian Angel (SFD-051)
 */
function parseNameList(text: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    // With ID suffix
    let m = line.match(/^(\d+)\s+(.+?)\s+\(([A-Z]{2,4}-[A-Z0-9]+)\)\s*$/);
    if (m) {
      entries.push({
        count: parseInt(m[1]),
        name: m[2].trim(),
        riftbound_id: m[3],
        section: "default",
      });
      continue;
    }
    // Plain name only
    m = line.match(/^(\d+)\s+(.+)$/);
    if (m) {
      entries.push({ count: parseInt(m[1]), name: m[2].trim(), section: "default" });
    }
  }
  return entries;
}

/** Parse any of the three supported deck list formats into structured entries. */
export function parseDeckList(text: string): ParsedEntry[] {
  const fmt = detectFormat(text);
  if (fmt === "id-only") return parseIdOnly(text);
  if (fmt === "sectioned") return parseSectioned(text);
  return parseNameList(text);
}

// ---------------------------------------------------------------------------
// API fetchers
// ---------------------------------------------------------------------------

// In dev the Vite proxy forwards /riftcodex-api/* → https://api.riftcodex.com/*,
// bypassing CORS. In production builds we hit the API directly (requires the API
// to accept the tauri:// origin, or a native HTTP plugin to be added later).
const API_BASE = import.meta.env.DEV
  ? "/riftcodex-api"
  : "https://api.riftcodex.com";

/** Returns true if at least one significant word from the query appears in the result name.
 *  Prevents obviously wrong fuzzy matches (e.g. "Obelisk of Power" → "Kaisa"). */
function namesOverlap(searched: string, returned: string): boolean {
  const significant = searched.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (significant.length === 0) return true;
  const ret = returned.toLowerCase();
  return significant.some(w => ret.includes(w));
}

export async function fetchByName(name: string): Promise<ApiCard | null> {
  // 1. Exact match first
  try {
    const res = await fetch(
      `${API_BASE}/cards/name?exact=${encodeURIComponent(name)}`,
      { headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data: ApiResponse = await res.json();
      if (data.items[0]) return data.items[0];
    }
  } catch { /* fall through */ }

  // 2. Fuzzy fallback — try original name and without leading "The "
  const variants = [name];
  if (/^the\s/i.test(name)) variants.push(name.replace(/^the\s+/i, ""));

  for (const variant of variants) {
    try {
      const res = await fetch(
        `${API_BASE}/cards/name?fuzzy=${encodeURIComponent(variant)}&size=5`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) continue;
      const data: ApiResponse = await res.json();
      for (const card of data.items) {
        if (namesOverlap(name, card.name)) return card;
      }
    } catch { continue; }
  }
  return null;
}

/**
 * Fetch a card by its riftbound ID (e.g. "OGN-046").
 * NOTE: Assumes an endpoint at GET /cards/:riftbound_id — update if it differs.
 */
export async function fetchByRiftboundId(
  riftbound_id: string
): Promise<ApiCard | null> {
  const url = `${API_BASE}/cards/${encodeURIComponent(riftbound_id)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data: ApiResponse = await res.json();
    return data.items?.[0] ?? null;
  } catch {
    return null;
  }
}
