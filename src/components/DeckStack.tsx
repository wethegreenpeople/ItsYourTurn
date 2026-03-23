interface DeckStackProps {
  count: number;
  title?: string;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
}

/** Visual deck stack — 3 fanned card backs with a count overlay. */
export function DeckStack(props: DeckStackProps) {
  return (
    <div
      class="flex flex-col items-center justify-center h-full p-1 gap-0 select-none
             cursor-pointer transition-[filter] duration-150
             hover:brightness-125 active:brightness-90 active:scale-[.97]"
      onClick={props.onClick}
      onContextMenu={(e) => { e.preventDefault(); props.onContextMenu?.(e); }}
      onMouseDown={(e) => { if (e.button === 0) e.preventDefault(); }}
      title={props.title}
    >
      <div class="relative w-8 h-11 flex-shrink-0 mx-1.5 my-1 md:w-9 md:h-[50px] md:mx-2.5">
        {/* Fanned card backs */}
        <div class="absolute inset-0 rounded-[3px] border border-gold-dim bg-gradient-to-br from-[#2d2d30] to-base
                    shadow-[1px_2px_5px_rgba(0,0,0,.55)] rotate-[-6deg] translate-x-[-3px] translate-y-[3px] opacity-55
                    before:content-[''] before:absolute before:inset-[3px] before:border before:border-gold/22 before:rounded-[1px]" />
        <div class="absolute inset-0 rounded-[3px] border border-gold-dim bg-gradient-to-br from-[#2d2d30] to-base
                    shadow-[1px_2px_5px_rgba(0,0,0,.55)] rotate-[-3deg] translate-x-[-1.5px] translate-y-[1.5px] opacity-[.78]
                    before:content-[''] before:absolute before:inset-[3px] before:border before:border-gold/22 before:rounded-[1px]" />
        <div class="absolute inset-0 rounded-[3px] border border-gold bg-gradient-to-br from-[#303035] to-[#1c1c1f]
                    shadow-[1px_2px_5px_rgba(0,0,0,.55)]
                    before:content-[''] before:absolute before:inset-[3px] before:border before:border-gold/22 before:rounded-[1px]" />

        {/* Count overlay */}
        <span class="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none select-none
                     font-cinzel text-[clamp(11px,1vw,16px)] font-bold text-gold
                     [text-shadow:0_1px_4px_rgba(0,0,0,.9),0_0_8px_rgba(0,0,0,.7)]">
          {props.count}
        </span>
      </div>
    </div>
  );
}
