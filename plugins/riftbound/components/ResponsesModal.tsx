import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Modal } from "../../../src/components/ui/Modal";
import { gameState, myUserId } from "../../../src/stores/gameStore";
import {
  responsesState,
  submitResponse,
  finishResponding,
  cancelResponses,
} from "../utils/responsesStore";

const font = { display: "'Cinzel', Georgia, serif", body: "'Rajdhani', system-ui, sans-serif" };

const playerName = (id: string) =>
  gameState.players.find((p) => p.id === id)?.name ?? "Unknown";

const amInitiator = () => responsesState.initiatorId === myUserId;
const amPending = () =>
  responsesState.isActive &&
  !amInitiator() &&
  responsesState.responses[myUserId] === "pending";
const amResponding = () =>
  responsesState.isActive && responsesState.respondingPlayerId === myUserId;

const answeredCount = () =>
  Object.values(responsesState.responses).filter((v) => v !== "pending").length;
const totalCount = () => Object.keys(responsesState.responses).length;

// ── Status icon + label for each player entry ────────────────────────────────

const StatusDot = (props: { status: string }) => (
  <span class="flex-shrink-0 w-4 flex items-center justify-center">
    <Show when={props.status === "pending"}>
      <span
        class="inline-block w-2 h-2 rounded-full bg-gold/70"
        style={{ animation: "turn-pulse 2s ease-in-out infinite" }}
      />
    </Show>
    <Show when={props.status === "no"}>
      <span class="text-[11px] text-text-muted/60">✕</span>
    </Show>
    <Show when={props.status === "yes"}>
      <span class="text-[11px] text-gold">⚡</span>
    </Show>
  </span>
);

const statusLabel = (status: string, playerId: string) => {
  if (responsesState.respondingPlayerId === playerId) return "Responding";
  if (status === "pending") return "Waiting";
  if (status === "no") return "Pass";
  return "Done";
};

// ── Sub-components ───────────────────────────────────────────────────────────

const ModalHeader = () => (
  <div class="flex items-center gap-2 mb-1">
    <span class="text-gold text-base leading-none">⚡</span>
    <h3
      class="text-[13px] font-semibold tracking-[0.14em] uppercase text-text"
      style={{ "font-family": font.display }}
    >
      Response Window
    </h3>
  </div>
);

// ── Initiator view (blocking modal — waiting for others) ─────────────────────

const InitiatorModal = () => (
  <Modal
    open={amInitiator() && responsesState.isActive}
    onClose={() => {}}
    persistent
    class="max-w-sm"
  >
    <div class="flex flex-col gap-3.5">
      <ModalHeader />

      {/* Someone is actively responding */}
      <Show when={responsesState.respondingPlayerId}>
        <div
          class="flex items-center gap-2 px-3 py-2 rounded-md bg-gold/8 border border-gold/30"
        >
          <span
            class="text-gold text-sm leading-none flex-shrink-0"
            style={{ animation: "turn-pulse 2s ease-in-out infinite" }}
          >
            ⚡
          </span>
          <span
            class="text-[13px] text-gold font-semibold"
            style={{ "font-family": font.display }}
          >
            {playerName(responsesState.respondingPlayerId!)} is responding…
          </span>
        </div>
      </Show>

      {/* Player response list */}
      <div class="flex flex-col gap-1.5">
        <For each={Object.keys(responsesState.responses)}>
          {(playerId) => {
            const status = () => responsesState.responses[playerId];
            return (
              <div class="flex items-center gap-2.5 px-3 py-2 rounded bg-surface/60 border border-raised/50">
                <StatusDot status={status()} />
                <span
                  class="text-[13px] text-text flex-1 min-w-0 truncate"
                  style={{ "font-family": font.body }}
                >
                  {playerName(playerId)}
                </span>
                <span
                  class="text-[10px] tracking-wider uppercase font-semibold flex-shrink-0"
                  classList={{
                    "text-text-muted/40": status() === "pending",
                    "text-text-muted/55": status() === "no",
                    "text-gold/70": status() === "yes",
                  }}
                  style={{ "font-family": font.body }}
                >
                  {statusLabel(status(), playerId)}
                </span>
              </div>
            );
          }}
        </For>
      </div>

      {/* Count */}
      <p
        class="text-center text-[11px] text-text-muted tracking-wider"
        style={{ "font-family": font.body }}
      >
        {answeredCount()} of {totalCount()} players responded
      </p>

      {/* Cancel */}
      <button
        class="w-full px-4 py-2 rounded border border-rim/60 text-text-muted text-[12px] font-semibold
               tracking-widest uppercase hover:border-rim/90 hover:text-text transition-colors cursor-pointer"
        style={{ "font-family": font.body }}
        onClick={cancelResponses}
      >
        Cancel
      </button>
    </div>
  </Modal>
);

// ── Pending player HUD (non-blocking corner card — they can still see their board) ──

const PendingHud = () => (
  <Portal>
    <Show when={amPending()}>
      <div
        class="fixed z-[20001] flex flex-col gap-3 p-4 rounded-xl
               border border-raised/80 shadow-[0_8px_32px_rgba(0,0,0,0.7)]
               bottom-4 left-4 right-4
               lg:left-auto lg:right-6 lg:bottom-6 lg:min-w-[240px] lg:max-w-[280px]"
        style={{ background: "rgba(20, 23, 38, 0.97)" }}
      >
        {/* Header */}
        <div class="flex flex-col gap-0.5">
          <div class="flex items-center gap-1.5">
            <span class="text-gold text-sm leading-none">⚡</span>
            <span
              class="text-[12px] font-semibold tracking-[0.12em] uppercase text-gold"
              style={{ "font-family": font.display }}
            >
              Response Window
            </span>
          </div>
          <p
            class="text-[11px] text-text-muted pl-[22px]"
            style={{ "font-family": font.body }}
          >
            {playerName(responsesState.initiatorId)} is acting
          </p>
        </div>

        {/* Waiting on someone else */}
        <Show when={!!responsesState.respondingPlayerId}>
          <p
            class="text-[11px] text-text-muted/60 italic"
            style={{ "font-family": font.body }}
          >
            Waiting for {playerName(responsesState.respondingPlayerId!)}…
          </p>
        </Show>

        {/* Buttons */}
        <div class="grid grid-cols-2 gap-2">
          <button
            class="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-rim/60
                   text-text-muted text-[11px] font-bold tracking-widest uppercase bg-surface/40
                   hover:border-rim hover:text-text transition-colors cursor-pointer"
            style={{ "font-family": font.display }}
            onClick={() => submitResponse("no")}
          >
            <span class="text-xs leading-none">✕</span>
            Pass
          </button>
          <button
            class="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-gold/40
                   text-gold text-[11px] font-bold tracking-widest uppercase bg-gold/8
                   hover:border-gold/70 hover:bg-gold/14 transition-colors cursor-pointer
                   disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-gold/40 disabled:hover:bg-gold/8"
            style={{ "font-family": font.display }}
            disabled={!!responsesState.respondingPlayerId}
            onClick={() => submitResponse("yes")}
          >
            <span class="text-xs leading-none">⚡</span>
            Respond
          </button>
        </div>
      </div>
    </Show>
  </Portal>
);

// ── Responding player HUD (non-blocking — they need to interact with board) ──

const RespondingHud = () => (
  <Portal>
    <Show when={amResponding()}>
      <div
        class="fixed z-[20001] flex flex-col gap-3 p-4 rounded-xl
               border border-gold/50 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_24px_rgba(197,163,92,0.1)]
               bottom-4 left-4 right-4
               lg:left-auto lg:right-6 lg:bottom-6 lg:min-w-[260px] lg:max-w-[300px]"
        style={{ background: "rgba(20, 23, 38, 0.97)" }}
      >
        {/* Header */}
        <div class="flex items-center gap-2">
          <span
            class="text-gold text-base leading-none"
            style={{ animation: "turn-pulse 2s ease-in-out infinite" }}
          >
            ⚡
          </span>
          <span
            class="text-[13px] font-semibold tracking-[0.1em] uppercase text-gold"
            style={{ "font-family": font.display }}
          >
            You are responding
          </span>
        </div>

        <p
          class="text-[12px] text-text-muted leading-relaxed"
          style={{ "font-family": font.body }}
        >
          Take your action, then click Done.
        </p>

        {/* Done button */}
        <button
          class="w-full px-4 py-2.5 rounded border border-gold/50 bg-gold/10
                 text-gold text-[12px] font-bold tracking-widest uppercase
                 hover:border-gold/75 hover:bg-gold/18 transition-colors cursor-pointer"
          style={{
            "font-family": font.display,
            animation: "end-turn-glow 2s ease-in-out infinite",
          }}
          onClick={finishResponding}
        >
          Done Responding
        </button>
      </div>
    </Show>
  </Portal>
);

// ── Main export ──────────────────────────────────────────────────────────────

export function ResponsesModal() {
  return (
    <>
      <InitiatorModal />
      <PendingHud />
      <RespondingHud />
    </>
  );
}
