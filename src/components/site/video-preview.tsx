"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type VideoPreviewProps = { title: string; src?: string; poster?: string };

export function VideoPreview({ title, src, poster }: VideoPreviewProps) {
  const t = useTranslations("Gallery");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (
      !video ||
      !src ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.65)
          video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: [0, 0.65] },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  if (!src) {
    return (
      <div
        className="video-placeholder"
        role="img"
        aria-label={t("videoPending")}
      >
        <div className="aperture-art" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>VIDEO PREVIEW</span>
        <strong>{title}</strong>
        <small>{t("videoPending")}</small>
      </div>
    );
  }

  return (
    <div className="video-live">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label={title}
      />
      <button
        type="button"
        onClick={() =>
          playing ? videoRef.current?.pause() : videoRef.current?.play()
        }
        aria-label={playing ? t("pause") : t("play")}
      >
        {playing ? "Ⅱ" : "▶"}
      </button>
    </div>
  );
}
