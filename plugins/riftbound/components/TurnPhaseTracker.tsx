import { For, Show } from "solid-js";
import { gameState, myUserId, setGameState } from "../../../src/stores/gameStore";
import { broadcastGameState } from "../../../src/utils/socket";

export const PHASES = [
  { key: "A", label: "Awaken" },
  { key: "B", label: "Begin" },
  { key: "C", label: "Channel" },
  { key: "D", label: "Draw" },
] as const;

/** Advance to the next turn phase. No-op when it's not the local player's turn. */
export function advanceTurnPhase(): void {
  if (gameState.currentTurnPlayerId !== myUserId) return;
  setGameState("turnPhase", (gameState.turnPhase + 1) % PHASES.length);
  broadcastGameState();
}

export const TurnPhaseTracker = () => {
  const phase = () => gameState.turnPhase ?? 0;
  const isMyTurn = () => gameState.currentTurnPlayerId === myUserId;

  const setPhase = (idx: number) => {
    if (!isMyTurn()) return;
    setGameState("turnPhase", idx);
    broadcastGameState();
  };

  return (
    <div class="w-full flex flex-col gap-2 px-3 py-2.5 bg-surface/85 border border-raised rounded">

      {/* Header */}
      <span
        class="text-[9px] font-bold tracking-[0.18em] uppercase text-text-muted select-none"
        style={{ "font-family": "var(--plugin-font-body, 'Rajdhani', system-ui, sans-serif)" }}
      >
        Turn Phase
      </span>

      {/* Phase steps */}
      <div class="flex items-center justify-between gap-0.5">
        <For each={PHASES}>
          {(p, i) => (
            <>
              <div
                class="flex flex-col items-center gap-[3px] flex-shrink-0 transition-opacity duration-300"
                classList={{
                  "opacity-100": i() === phase(),
                  "opacity-30": i() !== phase(),
                  "cursor-pointer hover:opacity-80": isMyTurn() && i() !== phase(),
                  "cursor-default": !isMyTurn() || i() === phase(),
                }}
                onClick={() => setPhase(i())}
                title={isMyTurn() ? p.label : undefined}
              >
                <div
                  class="w-[28px] h-[28px] flex items-center justify-center rounded text-[11px] font-bold border transition-all duration-300"
                  classList={{
                    "bg-gold/15 border-gold/55 text-gold shadow-[0_0_10px_rgba(197,163,92,0.18)]": i() === phase(),
                    "bg-surface/50 border-raised/60 text-text-muted": i() > phase(),
                    "bg-gold/5 border-gold/20 text-gold/50": i() < phase(),
                  }}
                  style={{ "font-family": "var(--plugin-font-display, 'Cinzel', Georgia, serif)" }}
                >
                  {p.key}
                </div>
                <span
                  class="text-[7.5px] font-bold tracking-[0.06em] uppercase leading-none transition-colors duration-300"
                  classList={{
                    "text-gold/80": i() === phase(),
                    "text-text-muted/45": i() !== phase(),
                  }}
                  style={{ "font-family": "var(--plugin-font-body, 'Rajdhani', system-ui, sans-serif)" }}
                >
                  {p.label.slice(0, 3)}
                </span>
              </div>
              <Show when={i() < 3}>
                <span
                  class="flex-1 text-center text-[8px] leading-none mb-[14px] transition-colors duration-300 select-none"
                  classList={{
                    "text-gold/25": i() < phase(),
                    "text-raised/40": i() >= phase(),
                  }}
                >
                  ─
                </span>
              </Show>
            </>
          )}
        </For>
      </div>

      {/* Current phase name */}
      <div
        class="text-[10px] font-semibold tracking-[0.08em] text-gold/60 leading-none select-none transition-all duration-300"
        style={{ "font-family": "var(--plugin-font-display, 'Cinzel', Georgia, serif)" }}
      >
        {PHASES[phase()].label} Phase
      </div>
    </div>
  );
};
