import { Component, onCleanup, onMount } from "solid-js";
import {
  TbOutlineArrowNarrowRight, TbOutlineBrandGithub, TbOutlineDeviceDesktop,
  TbOutlineBrandGooglePlay, TbOutlineBrandApple, TbOutlineDeviceMobile,
  TbOutlineBell, TbOutlineCards, TbOutlineCode, TbOutlineLockOpen, TbOutlineGlobe,
} from "solid-icons/tb";

// Minimal CSS for things Tailwind cannot express:
// keyframe animations, pseudo-elements, reveal animation, CSS mask
const styles = `
@keyframes floatA {
  0%, 100% { transform: rotate(-13deg) translateY(12px); }
  50%       { transform: rotate(-11deg) translateY(-10px); }
}
@keyframes floatB {
  0%, 100% { transform: rotate(4deg) translateY(0); }
  50%       { transform: rotate(6deg) translateY(-16px); }
}
@keyframes floatC {
  0%, 100% { transform: rotate(18deg) translateY(8px); }
  50%       { transform: rotate(16deg) translateY(-12px); }
}
.hcard-a { margin-left: -152px; margin-top: -172px; z-index: 1; animation: floatA 5.2s ease-in-out infinite; }
.hcard-b { margin-left: -100px; margin-top: -158px; z-index: 3; animation: floatB 6.1s ease-in-out infinite 0.7s; }
.hcard-c { margin-left: -48px;  margin-top: -148px; z-index: 2; animation: floatC 4.8s ease-in-out infinite 1.4s; }

.rv { opacity: 0; transform: translateY(16px); transition: opacity 0.6s ease, transform 0.6s ease; }
.rv.visible { opacity: 1; transform: none; }
.d1 { transition-delay: 0.07s; }
.d2 { transition-delay: 0.14s; }
.d3 { transition-delay: 0.21s; }
.d4 { transition-delay: 0.28s; }
.d5 { transition-delay: 0.35s; }
.d6 { transition-delay: 0.42s; }

.hero-aura::before {
  content: '';
  position: absolute;
  width: 700px; height: 700px;
  left: -60px; top: 50%;
  transform: translateY(-55%);
  background: radial-gradient(circle, rgba(245,203,92,0.04) 0%, transparent 65%);
  border-radius: 50%;
}
.hero-aura::after {
  content: '';
  position: absolute;
  width: 480px; height: 480px;
  right: 5%; top: 20%;
  background: radial-gradient(circle, rgba(45,27,78,0.2) 0%, transparent 65%);
  border-radius: 50%;
}

.hero-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(#27272A 1px, transparent 1px),
    linear-gradient(90deg, #27272A 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: 0.5;
  mask-image: radial-gradient(ellipse 55% 80% at 30% 50%, black 0%, transparent 70%);
}

.sec-eyebrow::before {
  content: '';
  width: 16px; height: 1px;
  background: #7a8c88;
  flex-shrink: 0;
}

.dl-cs {
  position: relative;
  overflow: hidden;
}
.dl-cs::after {
  content: 'Soon';
  position: absolute;
  top: -1px; right: -1px;
  padding: 3px 7px;
  background: #f5cb5c;
  color: #0f0e09;
  font-size: 0.54rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 0 8px 0 5px;
  font-family: 'Cinzel', Georgia, serif;
}
`;

const GH_URL = "https://github.com/itsyourturn/itsyourturn";

function TcgCard(props: {
  posClass: string;
  bgGradient: string;
  artGradient: string;
  sym: string;
  name: string;
  type: string;
  flavor: string;
  cost: string;
  pt: string;
}) {
  return (
    <div class={`absolute w-48 h-[272px] rounded-xl top-1/2 left-1/2 shadow-[0_24px_56px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden ${props.posClass}`}>
      <div class="absolute inset-0 rounded-xl" style={`background: ${props.bgGradient}`} />
      <div class="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[rgba(255,255,255,0.06)] to-transparent rounded-t-xl z-[4] pointer-events-none" />
      <div class="absolute inset-0 rounded-xl border border-[rgba(255,255,255,0.08)] z-[5] pointer-events-none" />
      <div class="absolute top-[10px] left-[10px] right-[10px] h-6 bg-[rgba(0,0,0,0.5)] rounded border border-[rgba(255,255,255,0.07)] flex items-center justify-between px-[7px] z-[3]">
        <span class="text-[0.65rem] opacity-60">{props.sym}</span>
        <span class="font-cinzel text-[0.5rem] tracking-[0.1em] uppercase opacity-45 flex-1 text-center">{props.name}</span>
        <span class="text-[0.55rem] opacity-50 font-mono font-bold">{props.cost}</span>
      </div>
      <div class="absolute top-[42px] left-[10px] right-[10px] h-[148px] rounded overflow-hidden z-[2]">
        <div class="absolute inset-0 rounded" style={`background: ${props.artGradient}`} />
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[3.5rem] opacity-[0.12] pointer-events-none select-none">{props.sym}</div>
      </div>
      <div class="absolute top-[198px] left-[10px] right-[10px] h-[18px] bg-[rgba(0,0,0,0.45)] rounded-[3px] border border-[rgba(255,255,255,0.05)] flex items-center px-[6px] z-[3]">
        <span class="font-cinzel text-[0.44rem] tracking-[0.12em] uppercase opacity-35">{props.type}</span>
      </div>
      <div class="absolute top-[224px] left-[10px] right-[10px] bottom-7 bg-[rgba(0,0,0,0.35)] rounded-[3px] border border-[rgba(255,255,255,0.05)] z-[2] flex items-center px-[6px] py-[4px]">
        <span class="text-[0.38rem] italic opacity-30 leading-[1.4] tracking-[0.01em]">{props.flavor}</span>
      </div>
      <div class="absolute bottom-[10px] right-[10px] w-7 h-[18px] bg-[rgba(0,0,0,0.55)] border border-[rgba(255,255,255,0.1)] rounded-[3px] flex items-center justify-center text-[0.5rem] font-bold opacity-50 z-[3] font-mono">
        {props.pt}
      </div>
    </div>
  );
}

export const HomePage: Component = () => {
  let containerRef: HTMLDivElement | undefined;
  let observer: IntersectionObserver | undefined;

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -28px 0px" },
    );
    containerRef?.querySelectorAll(".rv").forEach((el) => observer!.observe(el));
  });

  onCleanup(() => observer?.disconnect());

  return (
    <div class="font-body bg-base text-text h-screen overflow-y-auto overflow-x-hidden" ref={containerRef}>
      <style>{styles}</style>

      {/* ── NAV ── */}
      <nav class="fixed top-0 left-0 right-0 z-[100] px-[52px] py-4 flex items-center justify-between backdrop-blur-[14px] bg-gradient-to-b from-[rgba(24,24,27,0.95)] to-transparent max-[960px]:px-6 max-[960px]:py-3">
        <a class="font-cinzel text-[1.1rem] font-bold tracking-[0.08em] text-text no-underline uppercase" href="/">
          Its<em class="not-italic bg-gradient-to-br from-gold to-gold-dim bg-clip-text text-transparent">Your</em>Turn
        </a>
        <div class="flex items-center gap-7">
          <a
            class="text-[0.82rem] text-text-faint no-underline transition-colors duration-150 font-normal tracking-[0.02em] hover:text-text-muted max-[960px]:hidden"
            href={GH_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a
            class="px-5 py-2 bg-gold text-[#0f0e09] rounded-md text-[0.82rem] font-semibold no-underline tracking-[0.04em] font-cinzel transition-all duration-200 uppercase whitespace-nowrap hover:bg-gold-bright hover:shadow-[0_4px_20px_rgba(245,203,92,0.25)] hover:-translate-y-px"
            href="/app"
          >
            Play Now
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section class="grid grid-cols-[54%_1fr] items-start px-20 pt-[120px] pb-20 gap-10 relative overflow-hidden max-[960px]:grid-cols-1 max-[960px]:px-6 max-[960px]:pt-[88px] max-[960px]:pb-14 max-[960px]:gap-11">
        <div class="hero-aura absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div class="hero-grid" aria-hidden="true" />

        <div class="relative z-[2]">
          <h1 class="font-cinzel font-bold leading-none mb-7">
            <span class="block tracking-[0.18em] text-text/55 mb-0.5" style="font-size: clamp(1.4rem, 2.8vw, 2.6rem)">It's Your</span>
            <span class="block tracking-[0.04em] bg-gradient-to-br from-gold to-gold-dim bg-clip-text text-transparent leading-[0.88]" style="font-size: clamp(4.5rem, 9vw, 9.5rem)">Turn</span>
          </h1>

          <div class="h-px bg-[linear-gradient(90deg,transparent,rgba(245,203,92,0.35)_40%,rgba(245,203,92,0.35)_60%,transparent)] mt-[18px] mb-5 max-w-[360px]" aria-hidden="true" />

          <p class="text-base leading-[1.75] text-text-faint max-w-[450px] mb-9 font-normal">
            Play card games online from any device. Open a browser and go, or install the app for richer features like turn notifications and more.
          </p>

          <div class="flex items-center gap-3 flex-wrap mb-[22px]">
            <a href="/app" class="group inline-flex items-center gap-[9px] px-[30px] py-[13px] bg-gold text-[#0f0e09] rounded-[7px] text-[0.9rem] font-bold no-underline tracking-[0.06em] font-cinzel uppercase transition-all duration-[220ms] hover:bg-gold-bright hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(245,203,92,0.22)]">
              Play Now
              <span class="transition-transform duration-200 group-hover:translate-x-[3px]">
                <TbOutlineArrowNarrowRight size={14} />
              </span>
            </a>
            <a
              href={GH_URL}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-[22px] py-[13px] bg-transparent text-text-faint border border-raised rounded-[7px] text-[0.875rem] font-normal no-underline transition-all duration-200 hover:text-text-muted hover:border-rim hover:bg-[rgba(255,255,255,0.02)]"
            >
              <TbOutlineBrandGithub size={14} />
              View on GitHub
            </a>
          </div>

          {/* Download badges */}
          <div class="flex gap-[9px] flex-wrap mb-10">
            <a href="#" class="inline-flex items-center gap-[9px] px-[13px] py-[9px] bg-surface border border-raised rounded-lg no-underline text-text text-[0.8rem] font-normal transition-all duration-200 hover:border-rim hover:bg-[#2f2f33] hover:-translate-y-px">
              <span class="text-[1.1rem] leading-none flex-shrink-0 flex items-center"><TbOutlineDeviceDesktop size={18} /></span>
              <span>
                <small class="block text-[0.57rem] text-text-faint uppercase tracking-[0.08em] mb-[1px]">Download for</small>
                <strong class="text-[0.8rem] font-medium">PC / Desktop</strong>
              </span>
            </a>
            <div class="dl-cs inline-flex items-center gap-[9px] px-[13px] py-[9px] bg-surface border border-raised rounded-lg text-text text-[0.8rem] font-normal opacity-40 cursor-default pointer-events-none">
              <span class="text-[1.1rem] leading-none flex-shrink-0 flex items-center"><TbOutlineBrandGooglePlay size={18} /></span>
              <span>
                <small class="block text-[0.57rem] text-text-faint uppercase tracking-[0.08em] mb-[1px]">Get it on</small>
                <strong class="text-[0.8rem] font-medium">Google Play</strong>
              </span>
            </div>
            <div class="dl-cs inline-flex items-center gap-[9px] px-[13px] py-[9px] bg-surface border border-raised rounded-lg text-text text-[0.8rem] font-normal opacity-40 cursor-default pointer-events-none">
              <span class="text-[1.1rem] leading-none flex-shrink-0 flex items-center"><TbOutlineBrandApple size={18} /></span>
              <span>
                <small class="block text-[0.57rem] text-text-faint uppercase tracking-[0.08em] mb-[1px]">Download on the</small>
                <strong class="text-[0.8rem] font-medium">App Store</strong>
              </span>
            </div>
          </div>

          {/* Features inline grid — 6 fixed items, borders encoded per-item for responsive correctness */}
          <div class="grid grid-cols-2 max-[960px]:grid-cols-1 border-t border-raised pt-7">
            <div class="rv d1 flex items-start gap-[10px] py-[14px] pr-[14px] border-b border-raised">
              <span class="flex-shrink-0 mt-[1px]"><TbOutlineDeviceMobile size={15} /></span>
              <div>
                <strong class="block text-[0.82rem] font-semibold mb-[2px] tracking-[0.01em] text-text-muted">Mobile Ready</strong>
                <span class="text-[0.75rem] text-text-faint leading-[1.5]">Touch-optimized for any screen</span>
              </div>
            </div>
            <div class="rv d2 flex items-start gap-[10px] py-[14px] pr-[14px] pl-[18px] border-b border-l border-raised max-[960px]:pl-0 max-[960px]:border-l-0">
              <span class="flex-shrink-0 mt-[1px]"><TbOutlineBell size={15} /></span>
              <div>
                <strong class="block text-[0.82rem] font-semibold mb-[2px] tracking-[0.01em] text-text-muted">Async Play</strong>
                <span class="text-[0.75rem] text-text-faint leading-[1.5]">Get notified when it's your turn</span>
              </div>
            </div>
            <div class="rv d3 flex items-start gap-[10px] py-[14px] pr-[14px] border-b border-raised">
              <span class="flex-shrink-0 mt-[1px]"><TbOutlineCards size={15} /></span>
              <div>
                <strong class="block text-[0.82rem] font-semibold mb-[2px] tracking-[0.01em] text-text-muted">Multiple Games</strong>
                <span class="text-[0.75rem] text-text-faint leading-[1.5]">MTG, Riftbound &amp; more coming</span>
              </div>
            </div>
            <div class="rv d4 flex items-start gap-[10px] py-[14px] pr-[14px] pl-[18px] border-b border-l border-raised max-[960px]:pl-0 max-[960px]:border-l-0">
              <span class="flex-shrink-0 mt-[1px]"><TbOutlineCode size={15} /></span>
              <div>
                <strong class="block text-[0.82rem] font-semibold mb-[2px] tracking-[0.01em] text-text-muted">Community Games</strong>
                <span class="text-[0.75rem] text-text-faint leading-[1.5]">Build &amp; ship your own plugin</span>
              </div>
            </div>
            {/* Last row on desktop — no border-b; on mobile (1-col) restore border-b for 2nd-to-last */}
            <div class="rv d5 flex items-start gap-[10px] py-[14px] pr-[14px] border-raised max-[960px]:border-b">
              <span class="flex-shrink-0 mt-[1px]"><TbOutlineLockOpen size={15} /></span>
              <div>
                <strong class="block text-[0.82rem] font-semibold mb-[2px] tracking-[0.01em] text-text-muted">Open Source</strong>
                <span class="text-[0.75rem] text-text-faint leading-[1.5]">MIT licensed, self-hostable</span>
              </div>
            </div>
            <div class="rv d6 flex items-start gap-[10px] py-[14px] pr-[14px] pl-[18px] border-l border-raised max-[960px]:pl-0 max-[960px]:border-l-0">
              <span class="flex-shrink-0 mt-[1px]"><TbOutlineGlobe size={15} /></span>
              <div>
                <strong class="block text-[0.82rem] font-semibold mb-[2px] tracking-[0.01em] text-text-muted">Public Lobby</strong>
                <span class="text-[0.75rem] text-text-faint leading-[1.5]">No account required to start</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating TCG cards */}
        <div class="sticky top-[110px] z-[2] h-[480px] flex items-center justify-center max-[960px]:static max-[960px]:h-[260px]" aria-hidden="true">
          <div class="absolute w-[360px] h-[360px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(245,203,92,0.05)_0%,transparent_65%)] pointer-events-none" />
          <div class="relative w-60 h-[340px] max-[960px]:scale-[0.72]">
            <TcgCard
              posClass="hcard-a"
              bgGradient="linear-gradient(170deg, #2d1b4e 0%, #180830 50%, #0e0818 100%)"
              artGradient="radial-gradient(ellipse at 50% 35%, #3d1f6e 0%, #180830 60%, #0e0618 100%)"
              sym="✦"
              name="Void Sentinel"
              type="Creature — Shade"
              flavor='"Between shadows and silence, it endures."'
              cost="3"
              pt="2/4"
            />
            <TcgCard
              posClass="hcard-b"
              bgGradient="linear-gradient(170deg, #1b2d4e 0%, #081030 50%, #081218 100%)"
              artGradient="radial-gradient(ellipse at 50% 35%, #1f3d6e 0%, #081030 60%, #040c18 100%)"
              sym="◈"
              name="Tidal Warden"
              type="Creature — Elemental"
              flavor='"The tide answers to no lord."'
              cost="2"
              pt="3/3"
            />
            <TcgCard
              posClass="hcard-c"
              bgGradient="linear-gradient(170deg, #1b4e2d 0%, #083018 50%, #081a0e 100%)"
              artGradient="radial-gradient(ellipse at 50% 35%, #1f6e3d 0%, #083018 60%, #04150a 100%)"
              sym="❋"
              name="Grove Protector"
              type="Creature — Druid"
              flavor='"Roots run deeper than memory."'
              cost="4"
              pt="4/5"
            />
          </div>
        </div>
      </section>

      <div class="h-px bg-[linear-gradient(90deg,transparent,#3F3F46_25%,#3F3F46_75%,transparent)] mx-20 max-[960px]:mx-6" aria-hidden="true" />

      {/* ── OPEN SOURCE ── */}
      <section class="px-20 py-[100px] bg-[#1c1c1f] grid grid-cols-2 gap-20 items-center max-[960px]:px-6 max-[960px]:py-16 max-[960px]:grid-cols-1 max-[960px]:gap-11">
        <div>
          <div class="sec-eyebrow rv flex items-center gap-[10px] text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-text-faint mb-[18px] font-cinzel">
            Open Source
          </div>
          <h2 class="rv d1 font-cinzel font-bold leading-[1.1] tracking-[0.04em] mb-[18px] uppercase" style="font-size: clamp(2rem, 3.2vw, 3.6rem)">
            Fork it.<br />Host it.<br />Build on it.
          </h2>
          <p class="rv d2 text-[0.95rem] leading-[1.75] text-text-faint max-w-[480px] font-normal mb-8">
            ItsYourTurn is MIT licensed and fully self-hostable. Deploy your own instance for your playgroup, fork it and build your own games, or contribute plugins back to the community.
          </p>
          <a
            href={GH_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="rv d3 inline-flex items-center gap-2 px-[22px] py-[13px] bg-transparent text-text-faint border border-raised rounded-[7px] text-[0.875rem] font-normal no-underline transition-all duration-200 hover:text-text-muted hover:border-rim hover:bg-[rgba(255,255,255,0.02)]"
          >
            <TbOutlineBrandGithub size={14} />
            View on GitHub →
          </a>
        </div>

        <div class="rv d2 bg-base border border-raised rounded-xl overflow-hidden">
          <div class="flex items-center gap-[7px] px-4 py-3 border-b border-raised bg-surface">
            <div class="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
            <div class="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
            <div class="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
          </div>
          <pre class="px-[26px] py-[22px] text-[0.8rem] leading-[1.95] text-text-faint m-0 overflow-x-auto" style="font-family: 'Fira Code', 'JetBrains Mono', Consolas, monospace"><span class="text-rim italic"># self-host in minutes</span>
<span class="text-[#5dba8a]">git clone</span> <span class="text-gold">github.com/itsyourturn/itsyourturn</span>
<span class="text-[#5dba8a]">npm install</span>
<span class="text-[#5dba8a]">npm run build</span>
<span class="text-[#5dba8a]">node server.js</span>

<span class="text-rim italic"># your instance is running at</span>
<span class="text-[#6ab0f5]">http://localhost:3000</span></pre>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section class="px-20 py-[130px] text-center relative overflow-hidden max-[960px]:px-6 max-[960px]:py-20">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(245,203,92,0.03)_0%,transparent_68%)] pointer-events-none" aria-hidden="true" />
        <h2 class="rv font-cinzel font-bold leading-none mb-6 relative uppercase">
          <span class="block tracking-[0.18em] text-text/55 mb-1" style="font-size: clamp(1rem, 1.8vw, 1.6rem)">Ready to play?</span>
          <span class="block tracking-[0.04em] bg-gradient-to-br from-gold to-gold-dim bg-clip-text text-transparent leading-[0.88]" style="font-size: clamp(3.5rem, 7vw, 7rem)">It's Your Turn.</span>
        </h2>
        <div class="rv d1 h-px bg-[linear-gradient(90deg,transparent,rgba(245,203,92,0.3)_40%,rgba(245,203,92,0.3)_60%,transparent)] mx-auto mt-5 mb-[22px] max-w-[280px] relative" aria-hidden="true" />
        <p class="rv d2 text-[0.95rem] text-text-faint mb-12 font-normal relative">No account required. Pick a name and start a game in seconds.</p>
        <a
          href="/app"
          class="rv d3 inline-flex items-center gap-[9px] bg-gold text-[#0f0e09] font-cinzel font-bold uppercase tracking-[0.06em] no-underline rounded-[7px] transition-all duration-[220ms] hover:bg-gold-bright hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(245,203,92,0.22)]"
          style="font-size: 0.95rem; padding: 15px 40px"
        >
          Open the App →
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer class="px-20 py-7 border-t border-raised flex items-center justify-between flex-wrap gap-4 bg-base max-[960px]:px-6">
        <div class="text-[0.75rem] text-text-faint tracking-[0.03em]">© 2025 ItsYourTurn — MIT License</div>
        <div class="flex gap-6">
          <a href={GH_URL} target="_blank" rel="noopener noreferrer" class="text-[0.75rem] text-text-faint no-underline tracking-[0.03em] transition-colors duration-150 hover:text-text-muted">GitHub</a>
          <a href="/app" class="text-[0.75rem] text-text-faint no-underline tracking-[0.03em] transition-colors duration-150 hover:text-text-muted">Play</a>
        </div>
      </footer>
    </div>
  );
};
