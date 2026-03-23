import { createEffect, createSignal, For, Show } from "solid-js";
import { chatMessages, sendChatMessage, type ChatMessage } from "../stores/chatStore";
import { gameState, myUserId } from "../stores/gameStore";

const PLAYER_COLORS = ["#c9a84c", "#7ab0d4", "#c47abd", "#7abc8f"];

function playerColor(playerId: string | undefined): string {
  if (!playerId) return "rgba(207,219,213,0.5)";
  const idx = gameState.players.findIndex((p) => p.id === playerId);
  return idx >= 0 ? (PLAYER_COLORS[idx % PLAYER_COLORS.length] ?? "#c9a84c") : "rgba(207,219,213,0.5)";
}

function playerName(playerId: string | undefined): string {
  if (!playerId) return "?";
  if (playerId === myUserId) return "You";
  return gameState.players.find((p) => p.id === playerId)?.name ?? "Player";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatRow(props: { msg: ChatMessage }) {
  const isLocal = () => props.msg.fromPlayerId === myUserId;
  return (
    <div
      class="px-2.5 py-1 mb-px border-l-2 transition-colors"
      classList={{
        "border-gold/35 bg-gold/4": isLocal(),
        "border-transparent": !isLocal(),
      }}
    >
      <div class="flex items-baseline gap-1.5 mb-0.5">
        <span class="font-bold text-[11px] tracking-wide uppercase" style={{ color: playerColor(props.msg.fromPlayerId) }}>
          {playerName(props.msg.fromPlayerId)}
        </span>
        <span class="text-[9px] text-text-muted/30 ml-auto flex-shrink-0">{formatTime(props.msg.timestamp)}</span>
      </div>
      <p class="text-[13px] text-text/80 leading-snug break-words m-0">{props.msg.content}</p>
    </div>
  );
}

function EventRow(props: { msg: ChatMessage }) {
  const hasMultiActor = () =>
    !!props.msg.actorPlayerId && !!props.msg.targetPlayerId && props.msg.actorPlayerId !== props.msg.targetPlayerId;
  const hasSingleActor = () => !!props.msg.actorPlayerId && !hasMultiActor();

  return (
    <div
      class="px-2.5 py-0.5 mb-px"
      classList={{
        "bg-[rgba(80,40,140,.1)] border-l-2 border-[rgba(140,80,220,.28)] rounded-r pl-2": hasMultiActor(),
      }}
    >
      <Show when={hasMultiActor()}>
        <div class="flex items-center gap-1.5 mb-px">
          <span class="font-bold text-[11px] tracking-wide uppercase" style={{ color: playerColor(props.msg.actorPlayerId) }}>
            {playerName(props.msg.actorPlayerId)}
          </span>
          <span class="text-[11px] flex-shrink-0" style="color:rgba(140,80,220,.6)">⇢</span>
          <span class="font-bold text-[11px] tracking-wide uppercase" style={{ color: playerColor(props.msg.targetPlayerId) }}>
            {playerName(props.msg.targetPlayerId)}
          </span>
        </div>
      </Show>
      <div class="flex items-baseline gap-1.5 flex-wrap">
        <Show when={hasSingleActor()}>
          <span class="font-bold text-[10px] tracking-wide uppercase" style={{ color: playerColor(props.msg.actorPlayerId) }}>
            {playerName(props.msg.actorPlayerId)}
          </span>
        </Show>
        <span class="text-[10px] text-text-muted/45 uppercase tracking-wider flex-1">{props.msg.content}</span>
        <span class="text-[9px] text-text-muted/30 flex-shrink-0 ml-auto">{formatTime(props.msg.timestamp)}</span>
      </div>
    </div>
  );
}

function MessageRow(props: { msg: ChatMessage }) {
  return (
    <Show when={props.msg.type === "chat"} fallback={<EventRow msg={props.msg} />}>
      <ChatRow msg={props.msg} />
    </Show>
  );
}

export function MessagingPanel() {
  const [draft, setDraft] = createSignal("");
  let listRef: HTMLDivElement | undefined;

  createEffect(() => {
    void chatMessages().length;
    queueMicrotask(() => { if (listRef) listRef.scrollTop = listRef.scrollHeight; });
  });

  const send = () => {
    const content = draft().trim();
    if (!content) return;
    sendChatMessage(content);
    setDraft("");
  };

  return (
    <div class="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div class="flex items-center gap-2 px-3 py-1.5 border-b border-rim/40 flex-shrink-0">
        <span class="font-cinzel text-[9px] font-semibold tracking-[.18em] uppercase text-gold/55 flex-1">Chat &amp; Log</span>
        <Show when={chatMessages().length > 0}>
          <span class="text-[10px] text-text-muted/35 font-semibold">{chatMessages().length}</span>
        </Show>
      </div>

      {/* Message list — keeps CSS class for scrollbar styling */}
      <div class="msg-list" ref={listRef}>
        <Show
          when={chatMessages().length > 0}
          fallback={
            <p class="text-[11px] text-text-muted/25 text-center px-3 py-5 uppercase tracking-wider leading-relaxed m-0">
              Game events and chat will appear here
            </p>
          }
        >
          <For each={chatMessages()}>
            {(msg) => <MessageRow msg={msg} />}
          </For>
        </Show>
      </div>

      {/* Input */}
      <div class="flex items-center gap-1.5 px-2 py-1.5 border-t border-rim/40 flex-shrink-0 bg-base/60">
        <input
          class="flex-1 min-w-0 bg-surface/85 border border-rim/50 text-text/90 text-[13px] px-2.5 py-1 rounded
                 outline-none transition-colors duration-150
                 placeholder:text-text-muted/35
                 focus:border-gold/35 focus:bg-surface/95"
          type="text"
          placeholder="Send a message…"
          autocomplete="off"
          value={draft()}
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button
          class="w-[30px] h-[30px] flex-shrink-0 flex items-center justify-center rounded
                 bg-gold/10 border border-gold/20 text-gold/60 text-[13px] cursor-pointer
                 transition-all duration-150
                 disabled:opacity-25 disabled:cursor-not-allowed"
          onClick={send}
          disabled={!draft().trim()}
          aria-label="Send"
        >↵</button>
      </div>
    </div>
  );
}
