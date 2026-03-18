import { createSignal, For, onCleanup, onMount } from "solid-js";
import { arrows, removeArrow } from "../stores/targetingStore";

function getCardCenter(cardId: string): { x: number; y: number } | null {
  const el = document.querySelector(`[data-card-id="${cardId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Quadratic bezier path between two card centers, curving left of the line
function makePath(s: { x: number; y: number }, t: { x: number; y: number }): string {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Control point: midpoint offset perpendicular to the line
  const cx = (s.x + t.x) / 2 - (dy / len) * Math.min(len * 0.25, 80);
  const cy = (s.y + t.y) / 2 + (dx / len) * Math.min(len * 0.25, 80);
  return `M ${s.x} ${s.y} Q ${cx} ${cy} ${t.x} ${t.y}`;
}

const ArrowPath = (props: { sourceId: string; targetId: string; id: string }) => {
  const [d, setD] = createSignal("");
  const [dashLen, setDashLen] = createSignal(0);

  let rafId = 0;
  const tick = () => {
    const s = getCardCenter(props.sourceId);
    const t = getCardCenter(props.targetId);
    if (s && t) {
      const path = makePath(s, t);
      setD(path);
      // Approximate path length for dash animation
      const dx = t.x - s.x, dy = t.y - s.y;
      setDashLen(Math.sqrt(dx * dx + dy * dy) * 1.05);
    }
    rafId = requestAnimationFrame(tick);
  };

  onMount(() => { rafId = requestAnimationFrame(tick); });
  onCleanup(() => cancelAnimationFrame(rafId));

  return (
    <g
      class="targeting-arrow"
      style={{ "pointer-events": "stroke", cursor: "pointer" }}
      onClick={() => removeArrow(props.id)}
    >
      {/* Outer glow */}
      <path
        d={d()}
        fill="none"
        stroke="rgba(255, 80, 30, 0.25)"
        stroke-width="10"
        stroke-linecap="round"
      />
      {/* Flowing dashes */}
      <path
        d={d()}
        fill="none"
        stroke="rgba(255, 100, 40, 0.6)"
        stroke-width="3"
        stroke-linecap="round"
        stroke-dasharray={`${dashLen() * 0.06} ${dashLen() * 0.04}`}
        class="arrow-flow"
      />
      {/* Solid core */}
      <path
        d={d()}
        fill="none"
        stroke="rgba(255, 60, 30, 0.95)"
        stroke-width="2"
        stroke-linecap="round"
        marker-end="url(#targeting-arrowhead)"
        style={{ filter: "drop-shadow(0 0 4px rgba(255,60,30,0.9))" }}
      />
    </g>
  );
};

export const ArrowOverlay = () => (
  <svg
    class="arrow-overlay"
    style={{
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      "pointer-events": "none",
      "z-index": "9500",
      overflow: "visible",
    }}
  >
    <defs>
      <marker
        id="targeting-arrowhead"
        markerWidth="7"
        markerHeight="7"
        refX="3.5"
        refY="3.5"
        orient="auto"
      >
        <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="rgba(255,60,30,0.95)" />
      </marker>
    </defs>
    <For each={arrows}>
      {(arrow) => (
        <ArrowPath sourceId={arrow.sourceId} targetId={arrow.targetId} id={arrow.id} />
      )}
    </For>
  </svg>
);
