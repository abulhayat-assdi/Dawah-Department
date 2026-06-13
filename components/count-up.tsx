"use client";

import { useEffect, useRef, useState } from "react";

const BN = "০১২৩৪৫৬৭৮৯";
const enToBn = (s: string) => s.replace(/[0-9]/g, (d) => BN[+d]);
const bnToEn = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));

/**
 * Animated count-up. Parses the first number out of a value like "৫৫০+" or
 * "৭ জন" (Bengali or ASCII digits), animates 0 → number when scrolled into
 * view, and re-renders it in Bengali digits with the original prefix/suffix.
 */
export function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const match = value.match(/[০-৯0-9]+/);
  const target = match ? parseInt(bnToEn(match[0]), 10) : 0;
  const idx = match?.index ?? 0;
  const prefix = match ? value.slice(0, idx) : value;
  const suffix = match ? value.slice(idx + match[0].length) : "";

  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!match) return;
    if (!el || typeof IntersectionObserver === "undefined") {
      setN(target);
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.disconnect();
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration, match]);

  if (!match) return <span ref={ref}>{value}</span>;
  return (
    <span ref={ref}>
      {prefix}
      {enToBn(String(n))}
      {suffix}
    </span>
  );
}
