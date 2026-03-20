import { createCard } from "../../src/models/Card";
import { addCardToDeck, clearDeck } from "../../src/stores/deckStore";
import { setHorizontal } from "../../src/stores/cardStateStore";
import { getCachedById, getCachedByName, putCached } from "../../src/lib/cardCache";
import { parseDeckList, fetchByName, fetchByRiftboundId } from "./deckParser";

// ---------------------------------------------------------------------------
// Section → zone routing
// ---------------------------------------------------------------------------

/**
 * Maps deck-list section names to the zone id suffix used by the RiftBound plugin.
 * Anything not listed falls back to "mainDeck".
 */
const SECTION_ZONE: Record<string, string> = {
  Legend:      "legend",
  Champion:    "champion",
  MainDeck:    "mainDeck",
  Runes:       "UnplayedRunes",
  Battlefields: "sideboard",
  Sideboard:   "sideboard",
};

function zoneForSection(section: string): string {
  return SECTION_ZONE[section] ?? "mainDeck";
}

/** Zones that get cleared before loading — in-game zones (hand, played, trash) are left alone. */
const ZONES_TO_CLEAR = ["mainDeck", "UnplayedRunes", "legend", "champion", "sideboard"];

// ---------------------------------------------------------------------------
// Resolver — cache-first, then API
// ---------------------------------------------------------------------------

interface Resolved {
  name: string;
  riftbound_id: string;
  image_url: string;
}

async function resolveCard(
  name: string | undefined,
  riftbound_id: string | undefined
): Promise<Resolved | null> {
  // Cache lookup
  if (riftbound_id) {
    const hit = await getCachedById(riftbound_id);
    if (hit) return hit;
  }
  if (name) {
    const hit = await getCachedByName(name);
    if (hit) return hit;
  }

  // Cache miss — hit the API
  let apiCard = name ? await fetchByName(name) : null;
  if (!apiCard && riftbound_id) apiCard = await fetchByRiftboundId(riftbound_id);
  if (!apiCard) return null;

  const resolved: Resolved = {
    name: apiCard.name,
    riftbound_id: apiCard.riftbound_id,
    image_url: apiCard.media.image_url,
  };

  // Warm the cache for both lookup paths
  await putCached(resolved);

  return resolved;
}

// ---------------------------------------------------------------------------
// Public loader
// ---------------------------------------------------------------------------

export async function loadRiftboundDeck(
  text: string,
  playerId: string
): Promise<{ errors: string[] }> {
  const entries = parseDeckList(text);
  const errors: string[] = [];

  // Deduplicate — one API/cache call per unique card
  const uniqueKeys = new Map<string, { name?: string; riftbound_id?: string }>();
  for (const entry of entries) {
    const key = entry.riftbound_id ?? entry.name ?? "";
    if (key && !uniqueKeys.has(key)) {
      uniqueKeys.set(key, { name: entry.name, riftbound_id: entry.riftbound_id });
    }
  }

  // Resolve all unique cards in parallel
  const resolvedMap = new Map<string, Resolved | null>();
  await Promise.all(
    Array.from(uniqueKeys.entries()).map(async ([key, { name, riftbound_id }]) => {
      const card = await resolveCard(name, riftbound_id);
      if (!card) errors.push(`Could not find card: "${key}"`);
      resolvedMap.set(key, card);
    })
  );

  // Clear the deck zones we're about to populate
  for (const zone of ZONES_TO_CLEAR) {
    clearDeck(`${playerId}:${zone}`);
  }

  // Populate zones
  for (const entry of entries) {
    const key = entry.riftbound_id ?? entry.name ?? "";
    const card = resolvedMap.get(key);
    if (!card) continue;

    const deckId = `${playerId}:${zoneForSection(entry.section)}`;

    for (let i = 0; i < entry.count; i++) {
      const newCard = createCard(card.name, card.image_url);
      if (entry.section === "Battlefields") setHorizontal(newCard.id, true);
      addCardToDeck(deckId, newCard);
    }
  }

  return { errors };
}
