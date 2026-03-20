import { createEffect, createSignal, For, Show } from "solid-js";
import { chatMessages, sendChatMessage, type ChatMessage } from "../stores/chatStore";
import { gameState, myUserId } from "../stores/gameStore";

// ── Player colour palette — assigned by position in gameState.players ──────
const PLAYER_COLORS = ["#c9a84c", "#7ab0d4", "#c47abd", "#7abc8f"];

function playerColor(playerId: string | undefined): string {
  if (!playerId) return "rgba(197,195,216,0.5)";
  const idx = gameState.players.findIndex((p) => p.id === playerId);
  return idx >= 0 ? (PLAYER_COLORS[idx % PLAYER_COLORS.length] ?? "#c9a84c") : "rgba(197,195,216,0.5)";
}

function playerName(playerId: string | undefined): string {
  if (!playerId) return "?";
  if (playerId === myUserId) return "You";
  return gameState.players.find((p) => p.id === playerId)?.name ?? "Player";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ChatRow(props: { msg: ChatMessage }) {
  const isLocal = () => props.msg.fromPlayerId === myUserId;
  const color = () => playerColor(props.msg.fromPlayerId);
  const name = () => playerName(props.msg.fromPlayerId);

  return (
    <div class="msg-chat" classList={{ "msg-chat--local": isLocal() }}>
      <div class="msg-chat-meta">
        <span class="msg-author" style={{ color: color() }}>{name()}</span>
        <span class="msg-time">{formatTime(props.msg.timestamp)}</span>
      </div>
      <div class="msg-bubble">{props.msg.content}</div>
    </div>
  );
}

function EventRow(props: { msg: ChatMessage }) {
  const hasMultiActor = () =>
    !!props.msg.actorPlayerId &&
    !!props.msg.targetPlayerId &&
    props.msg.actorPlayerId !== props.msg.targetPlayerId;

  const hasSingleActor = () =>
    !!props.msg.actorPlayerId && !hasMultiActor();

  return (
    <div class="msg-event" classList={{ "msg-event--targeted": hasMultiActor() }}>

      {/* Multi-player interaction: Actor ⇢ Target */}
      <Show when={hasMultiActor()}>
        <div class="msg-actors">
          <span class="msg-actor" style={{ color: playerColor(props.msg.actorPlayerId) }}>
            {playerName(props.msg.actorPlayerId)}
          </span>
          <span class="msg-actor-arrow">⇢</span>
          <span class="msg-actor" style={{ color: playerColor(props.msg.targetPlayerId) }}>
            {playerName(props.msg.targetPlayerId)}
          </span>
        </div>
      </Show>

      {/* Event body: optional inline actor prefix + content + timestamp */}
      <div class="msg-event-body">
        <Show when={hasSingleActor()}>
          <span class="msg-actor-inline" style={{ color: playerColor(props.msg.actorPlayerId) }}>
            {playerName(props.msg.actorPlayerId)}
          </span>
        </Show>
        <span class="msg-event-text">{props.msg.content}</span>
        <span class="msg-time">{formatTime(props.msg.timestamp)}</span>
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

// ── Main panel ─────────────────────────────────────────────────────────────

export function MessagingPanel() {
  const [draft, setDraft] = createSignal("");
  let listRef: HTMLDivElement | undefined;

  // Auto-scroll to bottom whenever a message is added.
  createEffect(() => {
    void chatMessages().length;
    queueMicrotask(() => {
      if (listRef) listRef.scrollTop = listRef.scrollHeight;
    });
  });

  const send = () => {
    const content = draft().trim();
    if (!content) return;
    sendChatMessage(content);
    setDraft("");
  };

  return (
    <div class="msg-panel">

      <div class="msg-panel-header">
        <span class="msg-panel-title">Chat &amp; Log</span>
        <Show when={chatMessages().length > 0}>
          <span class="msg-panel-count">{chatMessages().length}</span>
        </Show>
      </div>

      <div class="msg-list" ref={listRef}>
        <Show
          when={chatMessages().length > 0}
          fallback={<p class="msg-empty">Game events and chat will appear here</p>}
        >
          <For each={chatMessages()}>
            {(msg) => <MessageRow msg={msg} />}
          </For>
        </Show>
      </div>

      <div class="msg-input-row">
        <input
          class="msg-input"
          type="text"
          placeholder="Send a message…"
          autocomplete="off"
          value={draft()}
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          class="msg-send-btn"
          onClick={send}
          disabled={!draft().trim()}
          aria-label="Send"
        >
          ↵
        </button>
      </div>

    </div>
  );
}
