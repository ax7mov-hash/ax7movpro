"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function MotionProvider() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let frame = 0;
    const tick = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((node) => gsap.fromTo(node, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: .85, ease: "power3.out", scrollTrigger: { trigger: node, start: "top 88%", once: true } }));
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((node) => gsap.to(node, { yPercent: 7, ease: "none", scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: .6 } }));
    });
    return () => { cancelAnimationFrame(frame); lenis.destroy(); ctx.revert(); ScrollTrigger.getAll().forEach((item) => item.kill()); };
  }, []);
  return null;
}
