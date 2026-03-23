import { JSX, splitProps } from "solid-js";

const baseInput =
  "w-full bg-base border border-rim rounded text-sm text-text" +
  " placeholder:text-text-faint transition-colors duration-150" +
  " focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/25" +
  " disabled:opacity-40 disabled:pointer-events-none";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ["label", "class"]);
  return (
    <label class="flex flex-col gap-1.5 w-full">
      {local.label && (
        <span class="text-xs font-medium text-text-muted tracking-wide uppercase">{local.label}</span>
      )}
      <input
        class={[baseInput, "px-3 py-2.5", local.class ?? ""].filter(Boolean).join(" ")}
        {...rest}
      />
    </label>
  );
}

export function Textarea(props: TextareaProps) {
  const [local, rest] = splitProps(props, ["label", "class"]);
  return (
    <label class="flex flex-col gap-1.5 w-full">
      {local.label && (
        <span class="text-xs font-medium text-text-muted tracking-wide uppercase">{local.label}</span>
      )}
      <textarea
        class={[baseInput, "px-3 py-2.5 resize-none", local.class ?? ""].filter(Boolean).join(" ")}
        {...(rest as JSX.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    </label>
  );
}
