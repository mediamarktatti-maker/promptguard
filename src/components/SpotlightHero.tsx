import { PropsWithChildren, useMemo } from "react";
import { cn } from "@/lib/utils";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function SpotlightHero({ children, className }: PropsWithChildren<{ className?: string }>) {
  const reduced = useMemo(() => prefersReducedMotion(), []);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-hero shadow-lift",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-wash before:opacity-100",
        className,
      )}
      onPointerMove={(e) => {
        if (reduced) return;
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty("--spot-x", `${x.toFixed(2)}%`);
        el.style.setProperty("--spot-y", `${y.toFixed(2)}%`);
      }}
    >
      <div className="relative">{children}</div>
    </section>
  );
}
