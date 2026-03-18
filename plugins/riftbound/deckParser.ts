import { Card } from "../../src/models/Card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedEntry {
  count: number;
  name?: string;
  riftbound_id?: string;
  section: string;
}

interface ApiCard {
  id: string;
  name: string;
  riftbound_id: string;
  media: { image_url: string; artist: string; accessibility_text: string };
}

interface ApiResponse {
  items: ApiCard[];
  total: number;
}

export interface DeckSection {
  section: string;
  cards: Card[];
}

export interface LoadDeckResult {
  sections: DeckSection[];
  errors: string[];
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
    const m = line.match(/^(\d+)\s+(.+)$/);
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
// API
// ---------------------------------------------------------------------------

// In dev the Vite proxy forwards /riftcodex-api/* → https://api.riftcodex.com/*,
// bypassing CORS. In production builds we hit the API directly (requires the API
// to accept the tauri:// origin, or a native HTTP plugin to be added later).
const API_BASE = import.meta.env.DEV
  ? "/riftcodex-api"
  : "https://api.riftcodex.com";

async function fetchByName(name: string): Promise<ApiCard | null> {
  const url = `${API_BASE}/cards/name?fuzzy=${encodeURIComponent(name)}&size=1`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data: ApiResponse = await res.json();
    return data.items[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch a card by its riftbound ID (e.g. "OGN-046").
 * NOTE: This assumes an endpoint at GET /cards/:riftbound_id.
 * Update if the actual endpoint differs.
 */
async function fetchByRiftboundId(riftbound_id: string): Promise<ApiCard | null> {
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

// ---------------------------------------------------------------------------
// Public loader
// ---------------------------------------------------------------------------

/**
 * Parse a deck list string, fetch card data from the riftcodex API for every
 * unique card, then return the full Card[] grouped by section.
 *
 * Parallel fetching is used to minimise load time.
 */
export async function loadDeckFromList(text: string): Promise<LoadDeckResult> {
  const entries = parseDeckList(text);
  const errors: string[] = [];

  // Build a map of unique lookup keys → resolved ApiCard
  // Key: riftbound_id when available, otherwise card name
  const resolved = new Map<string, ApiCard | null>();
  for (const entry of entries) {
    const key = entry.riftbound_id ?? entry.name ?? "";
    if (key && !resolved.has(key)) resolved.set(key, null);
  }

  // Fetch all unique cards in parallel
  await Promise.all(
    Array.from(resolved.keys()).map(async (key) => {
      // Find the original entry to know whether to search by name or id
      const entry = entries.find(e => (e.riftbound_id ?? e.name ?? "") === key)!;
      let apiCard: ApiCard | null = null;

      if (entry.name) {
        apiCard = await fetchByName(entry.name);
      }
      if (!apiCard && entry.riftbound_id) {
        apiCard = await fetchByRiftboundId(entry.riftbound_id);
      }

      if (!apiCard) {
        errors.push(`Could not find card: "${key}"`);
      }
      resolved.set(key, apiCard);
    })
  );

  // Expand entries into Card instances, preserving section grouping
  const sectionMap = new Map<string, Card[]>();
  for (const entry of entries) {
    const key = entry.riftbound_id ?? entry.name ?? "";
    const apiCard = resolved.get(key);
    if (!apiCard) continue;

    if (!sectionMap.has(entry.section)) sectionMap.set(entry.section, []);
    const bucket = sectionMap.get(entry.section)!;
    for (let i = 0; i < entry.count; i++) {
      bucket.push(new Card(apiCard.name, apiCard.media.image_url));
    }
  }

  const sections: DeckSection[] = Array.from(sectionMap.entries()).map(
    ([section, cards]) => ({ section, cards })
  );

  return { sections, errors };
}
