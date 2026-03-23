/**
 * Public game lobby via Supabase Realtime Presence.
 * Hosts of public games "track" their presence with game metadata.
 * All browsers see the live list of open public games.
 */

import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { myUserId } from "../stores/gameStore";

export interface LobbyEntry {
  userId: string;
  roomCode: string;
  gameType: string;
  hostName: string;
  currentPlayers: number;
  maxPlayers: number;
  createdAt: number;
}

let _ch: RealtimeChannel | null = null;
let _onUpdate: ((games: LobbyEntry[]) => void) | null = null;
let _isTracking = false;
let _currentEntry: Omit<LobbyEntry, "userId" | "createdAt"> | null = null;

function parseState(raw: Record<string, any[]>): LobbyEntry[] {
  return Object.values(raw)
    .flatMap((arr) => arr as LobbyEntry[])
    .filter((e) => e?.roomCode)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** Subscribe to the lobby to receive public game listings. */
export function subscribeLobby(onUpdate: (games: LobbyEntry[]) => void) {
  _onUpdate = onUpdate;

  if (_ch) {
    // Already connected — emit current state immediately.
    onUpdate(parseState(_ch.presenceState<LobbyEntry>() as any));
    return;
  }

  _ch = supabase
    .channel("global-lobby", { config: { presence: { key: myUserId } } })
    .on("presence", { event: "sync" }, () => {
      if (!_ch) return;
      _onUpdate?.(parseState(_ch.presenceState<LobbyEntry>() as any));
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED" && _ch) {
        _onUpdate?.(parseState(_ch.presenceState<LobbyEntry>() as any));
      }
    });
}

/** Unsubscribe if we're not also hosting a public game. */
export function unsubscribeLobby() {
  _onUpdate = null;
  if (_isTracking) return; // keep channel alive while announcing
  if (_ch) {
    supabase.removeChannel(_ch);
    _ch = null;
  }
}

/** Announce a public game (called by the host). */
export function announcePublicGame(entry: Omit<LobbyEntry, "userId" | "createdAt">) {
  _isTracking = true;
  _currentEntry = entry;

  if (!_ch) {
    _ch = supabase
      .channel("global-lobby", { config: { presence: { key: myUserId } } })
      .on("presence", { event: "sync" }, () => {
        if (!_ch) return;
        _onUpdate?.(parseState(_ch.presenceState<LobbyEntry>() as any));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          _ch?.track({ ...entry, userId: myUserId, createdAt: Date.now() });
        }
      });
  } else {
    _ch.track({ ...entry, userId: myUserId, createdAt: Date.now() });
  }
}

/** Update player count after someone joins. */
export function updateLobbyPlayerCount(count: number) {
  if (!_isTracking || !_currentEntry || !_ch) return;
  _ch.track({ ..._currentEntry, currentPlayers: count, userId: myUserId, createdAt: Date.now() });
}

/** Stop announcing (host quits or game turns private). */
export function stopAnnouncingGame() {
  _isTracking = false;
  _currentEntry = null;
  _ch?.untrack();
  if (!_onUpdate) {
    if (_ch) supabase.removeChannel(_ch);
    _ch = null;
  }
}
