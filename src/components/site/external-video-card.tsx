"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import type { PublicVideo } from "@/lib/admin/video-schema";
import { getYouTubeVideoId } from "@/lib/video-links";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

export function ExternalVideoCard({
  video,
  locale,
  surface,
}: {
  video: PublicVideo;
  locale: "en" | "fr";
  surface: "home" | "gallery";
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => true,
  );
  const youtubeId = getYouTubeVideoId(video.linkUrl);
  const isYouTube = video.provider === "youtube" && Boolean(youtubeId);
  const shouldAutoplay = video.autoplay && !reducedMotion;
  const embedUrl = isYouTube
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?playsinline=1&controls=1&rel=0&modestbranding=1${
        shouldAutoplay ? "&autoplay=1&mute=1" : ""
      }${video.loop ? `&loop=1&playlist=${youtubeId}` : ""}`
    : "";
  const providerName = video.provider === "youtube" ? "YouTube" : "Instagram";
  const title = locale === "fr" ? video.titleFr : video.titleEn;
  const description =
    locale === "fr" ? video.descriptionFr : video.descriptionEn;
  const alt = locale === "fr" ? video.altFr : video.altEn;
  const copy = (
    <>
      <div>
        <small>
          {video.format === "reel" ? "REEL / 9:16" : "VIDEO / 16:9"}
        </small>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <strong>
        {isYouTube
          ? locale === "fr"
            ? "Lire ici"
            : "Play here"
          : `${providerName} ↗`}
      </strong>
    </>
  );

  return (
    <article
      className={`external-video-card external-video-${video.format} ${
        surface === "gallery" ? "gallery-managed-video" : ""
      }`}
      data-reveal
    >
      <div className="external-video-media">
        <Image
          src={video.thumbnailSrc}
          alt={alt}
          fill
          sizes={
            video.format === "reel"
              ? "(max-width: 700px) 100vw, 34vw"
              : "(max-width: 700px) 100vw, 66vw"
          }
        />
        {embedUrl && (
          <iframe
            src={embedUrl}
            title={`${title} — YouTube player`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
          />
        )}
        {!isYouTube && (
          <a
            className="external-video-cover-link"
            href={video.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${title} — ${
              locale === "fr"
                ? `Voir sur ${providerName}`
                : `View on ${providerName}`
            }`}
          >
            <span className="external-video-provider">{providerName}</span>
            <span className="external-video-play" aria-hidden="true">
              ▶
            </span>
            <span className="external-video-open" aria-hidden="true">
              ↗
            </span>
          </a>
        )}
      </div>
      {isYouTube ? (
        <div className="external-video-copy">{copy}</div>
      ) : (
        <a
          className="external-video-copy"
          href={video.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy}
        </a>
      )}
    </article>
  );
}
