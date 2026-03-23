import { JSX, splitProps } from "solid-js";

type BadgeVariant = "gold" | "muted" | "danger" | "success";

interface BadgeProps {
  variant?: BadgeVariant;
  children: JSX.Element;
  class?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  gold:    "bg-gold/15 text-gold border border-gold/35",
  muted:   "bg-text-muted/8 text-text-muted border border-text-muted/20",
  danger:  "bg-danger/12 text-danger border border-danger/30",
  success: "bg-success/12 text-success border border-success/30",
};

export function Badge(props: BadgeProps) {
  const [local] = splitProps(props, ["variant", "children", "class"]);
  const variant = () => local.variant ?? "muted";

  return (
    <span
      class={[
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-widest uppercase",
        variantClasses[variant()],
        local.class ?? "",
      ].filter(Boolean).join(" ")}
    >
      {local.children}
    </span>
  );
}
