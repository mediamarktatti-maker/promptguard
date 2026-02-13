import { useEffect, useRef, useCallback } from "react";

/**
 * CursorGlow — a full-page background glow that follows the mouse,
 * creating a subtle "spotlight" shadow effect behind the content.
 * Respects prefers-reduced-motion.
 */
export function CursorTrail() {
    const glowRef = useRef<HTMLDivElement>(null);
    const pos = useRef({ x: 50, y: 50 });
    const current = useRef({ x: 50, y: 50 });
    const rafId = useRef<number>(0);

    const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const handleMove = useCallback((e: MouseEvent) => {
        pos.current = { x: e.clientX, y: e.clientY };
    }, []);

    useEffect(() => {
        if (prefersReduced) return;

        window.addEventListener("mousemove", handleMove);

        const loop = () => {
            // Smooth follow with easing
            current.current.x += (pos.current.x - current.current.x) * 0.08;
            current.current.y += (pos.current.y - current.current.y) * 0.08;

            if (glowRef.current) {
                glowRef.current.style.setProperty(
                    "background",
                    `radial-gradient(800px circle at ${current.current.x}px ${current.current.y}px, var(--cursor-glow-color), transparent 55%)`
                );
            }

            rafId.current = requestAnimationFrame(loop);
        };

        rafId.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(rafId.current);
            window.removeEventListener("mousemove", handleMove);
        };
    }, [prefersReduced, handleMove]);

    if (prefersReduced) return null;

    return (
        <div
            ref={glowRef}
            className="cursor-glow-layer"
            aria-hidden="true"
        />
    );
}
