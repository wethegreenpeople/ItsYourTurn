interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  class?: string;
}

export function Toggle(props: ToggleProps) {
  return (
    <label
      class={[
        "inline-flex items-center gap-3 cursor-pointer select-none",
        props.disabled ? "opacity-40 pointer-events-none" : "",
        props.class ?? "",
      ].filter(Boolean).join(" ")}
    >
      <input
        type="checkbox"
        class="sr-only"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
      />

      {/* Track */}
      <span
        class={[
          "relative inline-flex items-center h-5 w-9 rounded-full transition-colors duration-200",
          props.checked ? "bg-gold" : "bg-rim",
        ].join(" ")}
      >
        {/* Thumb */}
        <span
          class={[
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-base shadow transition-transform duration-200",
            props.checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </span>

      {props.label && (
        <span class="text-sm text-text-muted">{props.label}</span>
      )}
    </label>
  );
}
