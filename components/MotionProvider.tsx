"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function MotionProvider() {
  const cursor = useRef<HTMLDivElement>(null);
  const cursorText = useRef<HTMLSpanElement>(null);
  const progress = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const precisePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduced) return;

    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let frame = 0;
    const tick = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);

    const ctx = gsap.context(() => {
      const heroTimeline = gsap.timeline({ defaults: { ease: "power4.out" } });
      heroTimeline
        .from(".hero-eyebrow", { y: 18, opacity: 0, duration: .65 }, .1)
        .from("[data-hero-title] > *", { yPercent: 115, rotate: 2, duration: 1.15, stagger: .12 }, .16)
        .from("[data-hero-copy]", { y: 28, opacity: 0, duration: .8 }, .58)
        .from(".scroll-cue", { opacity: 0, duration: .7 }, .9);

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((node) => {
        gsap.fromTo(node, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: "power3.out", scrollTrigger: { trigger: node, start: "top 88%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-text-reveal]").forEach((node) => {
        gsap.from(node, { yPercent: 28, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: node, start: "top 85%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-image-reveal]").forEach((node) => {
        const image = node.querySelector("img");
        gsap.fromTo(node, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.15, ease: "power4.inOut", scrollTrigger: { trigger: node, start: "top 86%", once: true } });
        if (image) gsap.from(image, { scale: 1.13, duration: 1.55, ease: "power3.out", scrollTrigger: { trigger: node, start: "top 86%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((node) => {
        gsap.to(node, { yPercent: 7, ease: "none", scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: .65 } });
      });
      gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((node, index) => {
        gsap.to(node, { yPercent: index % 2 ? -5 : 5, ease: "none", scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: 1 } });
      });
      if (progress.current) {
        gsap.set(progress.current, { transformOrigin: "left center", scaleX: 0 });
        gsap.to(progress.current, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .15 } });
      }
    });

    if (precisePointer && cursor.current) {
      document.documentElement.classList.add("motion-ready");
      const cursorNode = cursor.current;
      const moveX = gsap.quickTo(cursorNode, "x", { duration: .32, ease: "power3" });
      const moveY = gsap.quickTo(cursorNode, "y", { duration: .32, ease: "power3" });
      const onPointerMove = (event: PointerEvent) => { moveX(event.clientX); moveY(event.clientY); cursorNode.classList.add("is-visible"); };
      const onPointerLeave = () => cursorNode.classList.remove("is-visible");
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onPointerLeave);
      cleanups.push(() => { document.documentElement.classList.remove("motion-ready"); window.removeEventListener("pointermove", onPointerMove); document.documentElement.removeEventListener("mouseleave", onPointerLeave); });

      document.querySelectorAll<HTMLElement>("[data-cursor-label], a, button").forEach((node) => {
        const enter = () => {
          cursorNode.classList.add("is-active");
          const label = node.dataset.cursorLabel || node.closest<HTMLElement>("[data-cursor-label]")?.dataset.cursorLabel;
          if (cursorText.current) cursorText.current.textContent = label || "";
          cursorNode.classList.toggle("has-label", Boolean(label));
        };
        const leave = () => { cursorNode.classList.remove("is-active", "has-label"); if (cursorText.current) cursorText.current.textContent = ""; };
        node.addEventListener("pointerenter", enter); node.addEventListener("pointerleave", leave);
        cleanups.push(() => { node.removeEventListener("pointerenter", enter); node.removeEventListener("pointerleave", leave); });
      });

      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((node) => {
        const move = (event: PointerEvent) => { const box = node.getBoundingClientRect(); gsap.to(node, { x: (event.clientX - box.left - box.width / 2) * .18, y: (event.clientY - box.top - box.height / 2) * .18, duration: .35, ease: "power2.out" }); };
        const leave = () => gsap.to(node, { x: 0, y: 0, duration: .55, ease: "elastic.out(1,.45)" });
        node.addEventListener("pointermove", move); node.addEventListener("pointerleave", leave);
        cleanups.push(() => { node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", leave); });
      });

      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((node) => {
        const media = node.querySelector<HTMLElement>(".project-media");
        const move = (event: PointerEvent) => { const box = node.getBoundingClientRect(); const x = (event.clientX - box.left) / box.width - .5; const y = (event.clientY - box.top) / box.height - .5; gsap.to(media, { rotateY: x * 4, rotateX: y * -4, scale: 1.012, transformPerspective: 900, duration: .45, ease: "power2.out" }); };
        const leave = () => gsap.to(media, { rotateX: 0, rotateY: 0, scale: 1, duration: .65, ease: "power3.out" });
        node.addEventListener("pointermove", move); node.addEventListener("pointerleave", leave);
        cleanups.push(() => { node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", leave); });
      });

      const hero = document.querySelector<HTMLElement>(".home-hero");
      const heroImage = hero?.querySelector<HTMLElement>(".hero-media img");
      if (hero && heroImage) {
        const move = (event: PointerEvent) => { const x = event.clientX / window.innerWidth - .5; const y = event.clientY / window.innerHeight - .5; gsap.to(heroImage, { xPercent: x * 1.8, yPercent: y * 1.2, duration: 1.4, ease: "power2.out" }); };
        hero.addEventListener("pointermove", move);
        cleanups.push(() => hero.removeEventListener("pointermove", move));
      }
    }

    return () => { cancelAnimationFrame(frame); lenis.destroy(); ctx.revert(); cleanups.forEach((cleanup) => cleanup()); ScrollTrigger.getAll().forEach((item) => item.kill()); };
  }, []);

  return <>
    <div ref={cursor} className="motion-cursor" aria-hidden="true"><span ref={cursorText} /></div>
    <div className="scroll-progress" aria-hidden="true"><span ref={progress} /></div>
  </>;
}
