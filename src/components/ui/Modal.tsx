import { JSX, Show } from "solid-js";
import { Portal } from "solid-js/web";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  /** Extra classes applied to the modal box */
  class?: string;
  /** Prevent closing on backdrop click */
  persistent?: boolean;
}

export function Modal(props: ModalProps) {
  return (
    <Portal>
      <Show when={props.open}>
        {/* Backdrop */}
        <div
          class="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => { if (!props.persistent) props.onClose(); }}
        >
          {/* Box */}
          <div
            class={[
              "relative w-full max-w-lg rounded-2xl border border-rim/70",
              "bg-surface/98 shadow-[0_32px_80px_rgba(0,0,0,0.8)]",
              "flex flex-col gap-0 overflow-hidden",
              props.class ?? "",
            ].filter(Boolean).join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <Show when={props.title}>
              <div class="flex items-center justify-between px-6 py-4 border-b border-rim/50">
                <h2
                  class="text-base font-semibold text-text tracking-wide"
                  style={{ "font-family": "'Cinzel', Georgia, serif" }}
                >
                  {props.title}
                </h2>
                <button
                  class="w-7 h-7 flex items-center justify-center rounded text-text-faint hover:text-text hover:bg-text-muted/8 transition-colors"
                  onClick={props.onClose}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </Show>

            {/* Content */}
            <div class="px-6 py-5">
              {props.children}
            </div>
          </div>
        </div>
      </Show>
    </Portal>
  );
}

/** Convenience sub-components for common modal sections */
export function ModalActions(props: { children: JSX.Element; class?: string }) {
  return (
    <div class={["flex items-center justify-end gap-3 pt-4 border-t border-rim/50 mt-4", props.class ?? ""].join(" ")}>
      {props.children}
    </div>
  );
}
