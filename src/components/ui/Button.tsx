import { JSX, splitProps } from "solid-js";

type ButtonVariant = "primary" | "ghost" | "icon" | "danger" | "menu-item" | "tab";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  active?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded" +
    " font-medium text-sm tracking-wide transition-colors duration-150" +
    " bg-transparent border border-rim text-text" +
    " hover:border-gold hover:text-gold hover:bg-gold/7" +
    " active:bg-gold/14" +
    " disabled:opacity-40 disabled:pointer-events-none",

  ghost:
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded" +
    " font-medium text-sm transition-colors duration-150" +
    " bg-transparent border border-rim text-text-muted" +
    " hover:border-text-muted hover:text-text hover:bg-text-muted/6" +
    " disabled:opacity-40 disabled:pointer-events-none",

  icon:
    "inline-flex items-center justify-center w-9 h-9 rounded" +
    " transition-colors duration-150" +
    " bg-transparent border border-rim text-text-muted" +
    " hover:border-text-muted hover:text-text hover:bg-text-muted/8" +
    " disabled:opacity-40 disabled:pointer-events-none",

  danger:
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded" +
    " font-medium text-sm transition-colors duration-150" +
    " bg-transparent border border-rim text-text-muted" +
    " hover:border-danger hover:text-danger hover:bg-danger/8" +
    " disabled:opacity-40 disabled:pointer-events-none",

  "menu-item":
    "w-full flex items-center gap-2.5 px-3.5 py-2 rounded text-left" +
    " font-medium text-sm transition-colors duration-100" +
    " bg-transparent text-text-muted" +
    " hover:bg-text-muted/8 hover:text-text" +
    " disabled:opacity-40 disabled:pointer-events-none",

  tab:
    "inline-flex items-center justify-center px-4 py-1.5 rounded text-sm font-medium" +
    " transition-colors duration-150 border" +
    " border-transparent text-text-muted" +
    " hover:text-text hover:border-rim" +
    " disabled:opacity-40 disabled:pointer-events-none",
};

const activeClasses: Partial<Record<ButtonVariant, string>> = {
  primary: "border-gold text-gold bg-gold/7",
  ghost:   "border-text-muted text-text bg-text-muted/6",
  tab:     "border-rim text-gold bg-gold/8",
};

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "active", "class", "children"]);
  const variant = () => local.variant ?? "ghost";

  return (
    <button
      class={[
        variantClasses[variant()],
        local.active ? (activeClasses[variant()] ?? "") : "",
        local.class ?? "",
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      {local.children}
    </button>
  );
}
