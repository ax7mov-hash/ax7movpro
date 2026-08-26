"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MediaItem } from "@/lib/media";
import { resetCardDepth, updateCardDepth } from "@/lib/depth-interaction";
import { ArrowIcon } from "./icons";
import { VideoPreview } from "./video-preview";

export function ProjectCard({
  item,
  className = "",
}: {
  item: MediaItem;
  className?: string;
}) {
  const locale = useLocale() as "en" | "fr";
  const galleryLabel = locale === "fr" ? "Voir la galerie" : "View gallery";
  return (
    <article className={`project-card ${className}`} data-reveal>
      <Link
        href="/gallery"
        className="project-depth-surface"
        aria-label={`${item.title[locale]} — ${galleryLabel}`}
        onPointerMove={updateCardDepth}
        onPointerLeave={resetCardDepth}
        onPointerCancel={resetCardDepth}
      >
        <div className="project-media">
          {item.mediaType === "photo" &&
          item.src &&
          item.width &&
          item.height ? (
            <Image
              src={item.src}
              alt={item.alt[locale]}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectPosition: item.objectPosition }}
            />
          ) : (
            <VideoPreview title={item.title[locale]} />
          )}
          <span className="project-area">
            {item.mediaType === "video" ? "MOTION / 00:00" : "PHOTOGRAPHY"}
          </span>
          <span className="project-depth-mark" aria-hidden="true">
            ↗
          </span>
        </div>
        <div className="project-copy">
          <div>
            <h3>{item.title[locale]}</h3>
            <p>{item.description[locale]}</p>
          </div>
          <ArrowIcon />
        </div>
      </Link>
    </article>
  );
}
