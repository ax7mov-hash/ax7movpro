"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale, Project } from "@/lib/content";
import { copy } from "@/lib/content";

export function ProjectGrid({ projects, locale, limit, interactive = false }: { projects: Project[]; locale: Locale; limit?: number; interactive?: boolean }) {
  const items = projects.filter((item) => item.published).slice(0, limit);
  const t = copy[locale];
  const [active, setActive] = useState<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef(0);
  const close = useCallback(() => { setActive(null); opener.current?.focus(); }, []);
  const move = useCallback((direction: number) => setActive((current) => current === null ? null : (current + direction + items.length) % items.length), [items.length]);

  useEffect(() => {
    if (active === null) return;
    document.body.style.overflow = "hidden"; closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [active, close, move]);

  return <>
    <div className={`project-grid ${interactive ? "gallery-grid" : ""}`}>
      {items.map((project, index) => {
        const media = <><Image src={project.coverImage} alt={project.alt[locale]} fill sizes="(max-width: 760px) 100vw, 55vw" style={{ objectPosition: project.position }} priority={index < 2} /><span className="project-shade" />{project.mediaType === "video" && <span className="media-badge"><i aria-hidden="true">▶</i> Film</span>}</>;
        return <article className={`project-card aspect-${project.aspect}`} key={project.slug} data-reveal>
          {interactive ? <button className="project-media" onClick={(event) => { opener.current = event.currentTarget; setActive(index); }} aria-label={`${t.openProject}: ${project.title[locale]}`}>{media}</button> : <div className="project-media" data-parallax>{media}</div>}
          <div className="project-meta"><div><p>{project.category[locale]} · {project.year}</p><h3>{project.title[locale]}</h3></div><span>{String(index + 1).padStart(2, "0")}</span></div>
        </article>;
      })}
    </div>
    {active !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label={items[active].title[locale]} onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }} onTouchEnd={(e) => { const delta = e.changedTouches[0].clientX - touchStart.current; if (Math.abs(delta) > 50) move(delta > 0 ? -1 : 1); }}>
      <button ref={closeButton} className="lightbox-close" onClick={close} aria-label={t.closeViewer}>× <span>{t.closeViewer}</span></button>
      <button className="lightbox-arrow lightbox-prev" onClick={() => move(-1)} aria-label={t.previous}>←</button>
      <figure><div className="lightbox-image"><Image src={items[active].coverImage} alt={items[active].alt[locale]} fill sizes="100vw" priority style={{ objectPosition: items[active].position }} /></div><figcaption><span>{items[active].category[locale]} · {items[active].year}</span><h2>{items[active].title[locale]}</h2><p>{items[active].description[locale]}</p></figcaption></figure>
      <button className="lightbox-arrow lightbox-next" onClick={() => move(1)} aria-label={t.next}>→</button>
    </div>}
  </>;
}
