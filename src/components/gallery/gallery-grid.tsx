"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { MediaItem } from "@/lib/media";
import type { PublicVideo } from "@/lib/admin/video-schema";
import { ExternalVideoCard } from "@/components/site/external-video-card";
import { CloseIcon } from "@/components/site/icons";
import { VideoPreview } from "@/components/site/video-preview";
import { resetCardDepth, updateCardDepth } from "@/lib/depth-interaction";

type Labels = {
  open: string;
  close: string;
  previous: string;
  next: string;
  counter: string;
};

type GalleryLayoutItem = {
  item: MediaItem;
  kind: "photo" | "video";
  sequence: number;
};

export function GalleryGrid({
  items,
  videos,
  locale,
  labels,
}: {
  items: MediaItem[];
  videos: PublicVideo[];
  locale: "en" | "fr";
  labels: Labels;
}) {
  const photos: MediaItem[] = [];
  const layoutItems: GalleryLayoutItem[] = [];
  let videoSequence = 0;
  for (const item of items) {
    if (item.mediaType === "video") {
      layoutItems.push({ item, kind: "video", sequence: videoSequence });
      videoSequence += 1;
    } else if (item.src && item.width && item.height) {
      layoutItems.push({ item, kind: "photo", sequence: photos.length });
      photos.push(item);
    }
  }
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef(0);
  const current = selected === null ? null : photos[selected];

  const previous = useCallback(
    () =>
      setSelected((value) =>
        value === null ? value : (value - 1 + photos.length) % photos.length,
      ),
    [photos.length],
  );
  const next = useCallback(
    () =>
      setSelected((value) =>
        value === null ? value : (value + 1) % photos.length,
      ),
    [photos.length],
  );

  useEffect(() => {
    if (selected === null) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
      if (event.key === "Tab") {
        const controls = Array.from(
          document.querySelectorAll<HTMLElement>(".lightbox button"),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected, previous, next]);

  return (
    <>
      <div className="gallery-grid">
        {layoutItems.map(({ item, kind, sequence }) => {
          if (kind === "video")
            return (
              <article
                className={`gallery-card gallery-video-card gallery-video-${(sequence % 2) + 1}`}
                key={item.id}
                data-reveal
              >
                <VideoPreview title={item.title[locale]} />
                <div className="gallery-card-copy">
                  <span>MOTION / PLACEHOLDER</span>
                  <h2>{item.title[locale]}</h2>
                  <p>{item.description[locale]}</p>
                </div>
              </article>
            );
          return item.src && item.width && item.height ? (
            <article
              className={`gallery-card gallery-photo-${(sequence % 7) + 1}`}
              key={item.id}
              data-reveal
            >
              <button
                type="button"
                className="gallery-depth-surface"
                onClick={() => setSelected(sequence)}
                onPointerMove={updateCardDepth}
                onPointerLeave={resetCardDepth}
                onPointerCancel={resetCardDepth}
                aria-label={`${labels.open}: ${item.title[locale]}`}
              >
                <span className="gallery-image">
                  <Image
                    src={item.src}
                    alt={item.alt[locale]}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 40vw"
                    style={{ objectPosition: item.objectPosition }}
                  />
                  <span className="gallery-open-cue" aria-hidden="true">
                    {labels.open} <i>↗</i>
                  </span>
                </span>
                <span className="gallery-card-copy">
                  <small>
                    {String(sequence + 1).padStart(2, "0")} / PHOTOGRAPHY
                  </small>
                  <strong>{item.title[locale]}</strong>
                  <em>↗</em>
                </span>
              </button>
            </article>
          ) : null;
        })}
        {videos.map((video) => (
          <ExternalVideoCard
            key={video.id}
            video={video}
            locale={locale}
            surface="gallery"
          />
        ))}
      </div>

      {current &&
      selected !== null &&
      current.src &&
      current.width &&
      current.height ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={current.title[locale]}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
          onTouchStart={(event) => {
            touchStart.current = event.changedTouches[0].clientX;
          }}
          onTouchEnd={(event) => {
            const distance =
              event.changedTouches[0].clientX - touchStart.current;
            if (Math.abs(distance) > 50) {
              if (distance > 0) previous();
              else next();
            }
          }}
        >
          <button
            ref={closeRef}
            type="button"
            className="lightbox-close"
            onClick={() => setSelected(null)}
            aria-label={labels.close}
          >
            <CloseIcon />
          </button>
          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={previous}
            aria-label={labels.previous}
          >
            ←
          </button>
          <div className="lightbox-stage">
            <Image
              src={current.src}
              alt={current.alt[locale]}
              fill
              sizes="100vw"
              priority
            />
            <div className="lightbox-caption">
              <div>
                <strong>{current.title[locale]}</strong>
                <span>{current.description[locale]}</span>
              </div>
              <small>
                {labels.counter
                  .replace("{current}", String(selected + 1))
                  .replace("{total}", String(photos.length))}
              </small>
            </div>
          </div>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={next}
            aria-label={labels.next}
          >
            →
          </button>
        </div>
      ) : null}
    </>
  );
}
