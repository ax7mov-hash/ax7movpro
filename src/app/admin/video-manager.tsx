"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminVideo, VideoInput } from "@/lib/admin/video-schema";
import { getVideoProvider } from "@/lib/video-links";
import { LoadingScreen } from "@/components/loading-screen";
import { ImageUploadEditor } from "./image-upload-editor";
import styles from "./admin.module.css";

const emptyVideo: VideoInput = {
  titleEn: "",
  titleFr: "",
  descriptionEn: "",
  descriptionFr: "",
  altEn: "",
  altFr: "",
  linkUrl: "",
  thumbnailSrc: "",
  thumbnailWidth: 0,
  thumbnailHeight: 0,
  format: "reel",
  showOnHome: true,
  showInGallery: true,
  autoplay: false,
  loop: false,
  published: false,
  displayOrder: 0,
};

function toInput(video: AdminVideo): VideoInput {
  return {
    titleEn: video.titleEn,
    titleFr: video.titleFr,
    descriptionEn: video.descriptionEn,
    descriptionFr: video.descriptionFr,
    altEn: video.altEn,
    altFr: video.altFr,
    linkUrl: video.linkUrl,
    thumbnailSrc: video.thumbnailSrc,
    thumbnailWidth: video.thumbnailWidth,
    thumbnailHeight: video.thumbnailHeight,
    format: video.format,
    showOnHome: video.showOnHome,
    showInGallery: video.showInGallery,
    autoplay: video.provider === "youtube" ? video.autoplay : false,
    loop: video.provider === "youtube" ? video.loop : false,
    published: video.published,
    displayOrder: video.displayOrder,
  };
}

export function VideoManager({ getCsrf }: { getCsrf: () => Promise<string> }) {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VideoInput>(emptyVideo);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => videos.find((video) => video.id === selectedId),
    [videos, selectedId],
  );
  const provider = getVideoProvider(draft.linkUrl);

  const loadVideos = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/videos", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await response.json()) as {
        videos?: AdminVideo[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Unable to load videos.");
      setVideos(data.videos || []);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadVideos().catch((reason: unknown) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load videos.",
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadVideos]);

  function clearNotices() {
    setError("");
    setMessage("");
  }

  function newVideo() {
    clearNotices();
    setSelectedId(null);
    setDraft({ ...emptyVideo, displayOrder: videos.length });
  }

  function editVideo(video: AdminVideo) {
    clearNotices();
    setSelectedId(video.id);
    setDraft(toInput(video));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateDraft<Key extends keyof VideoInput>(
    key: Key,
    value: VideoInput[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateVideoLink(linkUrl: string) {
    const nextProvider = getVideoProvider(linkUrl);
    setDraft((current) => ({
      ...current,
      linkUrl,
      autoplay: nextProvider === "youtube" ? current.autoplay : false,
      loop: nextProvider === "youtube" ? current.loop : false,
    }));
  }

  function updateAutoplay(autoplay: boolean) {
    setDraft((current) => ({
      ...current,
      autoplay,
      loop: autoplay ? current.loop : false,
    }));
  }

  async function uploadThumbnail(file: File) {
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "video-thumbnail");
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": token },
        body: formData,
      });
      const data = (await response.json()) as {
        url?: string;
        width?: number;
        height?: number;
        error?: string;
      };
      if (!response.ok || !data.url || !data.width || !data.height) {
        throw new Error(data.error || "Unable to upload the thumbnail.");
      }
      setDraft((current) => ({
        ...current,
        thumbnailSrc: data.url!,
        thumbnailWidth: data.width!,
        thumbnailHeight: data.height!,
      }));
      setMessage("Thumbnail uploaded. Save the video card to publish changes.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Thumbnail upload failed.",
      );
      throw reason;
    } finally {
      setBusy(false);
    }
  }

  async function saveVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch(
        selectedId ? `/api/admin/videos/${selectedId}` : "/api/admin/videos",
        {
          method: selectedId ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
          },
          body: JSON.stringify(draft),
        },
      );
      const data = (await response.json()) as {
        video?: AdminVideo;
        error?: string;
      };
      if (!response.ok || !data.video) {
        throw new Error(data.error || "Unable to save the video.");
      }
      setVideos((current) => {
        const remaining = current.filter(
          (video) => video.id !== data.video!.id,
        );
        return [...remaining, data.video!].sort(
          (left, right) => left.displayOrder - right.displayOrder,
        );
      });
      editVideo(data.video);
      setMessage(selectedId ? "Video updated." : "Video created.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save the video.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeVideo() {
    if (!selectedId || !selected) return;
    if (!window.confirm(`Delete “${selected.titleEn}”?`)) return;
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch(`/api/admin/videos/${selectedId}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": token },
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(data.error || "Unable to delete video.");
      setVideos((current) =>
        current.filter((video) => video.id !== selectedId),
      );
      newVideo();
      setMessage("Video deleted.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to delete video.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.dashboard}>
      {busy && <LoadingScreen label="Loading video library" />}
      <aside className={styles.editorPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>VIDEO CONTENT EDITOR</p>
            <h1>{selectedId ? "Edit video" : "New video"}</h1>
          </div>
          <button type="button" onClick={newVideo} className={styles.secondary}>
            New
          </button>
        </div>
        {(error || message) && (
          <div className={error ? styles.error : styles.success} role="status">
            {error || message}
          </div>
        )}
        <form onSubmit={saveVideo} className={styles.editorForm}>
          <div className={styles.twoColumns}>
            <label>
              English card name
              <input
                value={draft.titleEn}
                onChange={(event) => updateDraft("titleEn", event.target.value)}
                maxLength={120}
                required
              />
            </label>
            <label>
              French card name
              <input
                value={draft.titleFr}
                onChange={(event) => updateDraft("titleFr", event.target.value)}
                maxLength={120}
                required
              />
            </label>
          </div>
          <div className={styles.twoColumns}>
            <label>
              English description
              <textarea
                value={draft.descriptionEn}
                onChange={(event) =>
                  updateDraft("descriptionEn", event.target.value)
                }
                maxLength={600}
                required
              />
            </label>
            <label>
              French description
              <textarea
                value={draft.descriptionFr}
                onChange={(event) =>
                  updateDraft("descriptionFr", event.target.value)
                }
                maxLength={600}
                required
              />
            </label>
          </div>
          <label>
            YouTube or Instagram link
            <input
              type="url"
              value={draft.linkUrl}
              onChange={(event) => updateVideoLink(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              maxLength={2048}
              required
            />
            <span className={styles.fieldHint}>
              {provider
                ? `${provider === "youtube" ? "YouTube" : "Instagram"} link detected.`
                : "Use a YouTube video/Shorts or Instagram post/reel URL."}
            </span>
          </label>
          <div className={styles.threeColumns}>
            <label>
              Card format
              <select
                value={draft.format}
                onChange={(event) =>
                  updateDraft(
                    "format",
                    event.target.value as VideoInput["format"],
                  )
                }
              >
                <option value="reel">Reel · 9:16</option>
                <option value="widescreen">Widescreen · 16:9</option>
              </select>
            </label>
            <label>
              Display order
              <input
                type="number"
                min="0"
                max="9999"
                value={draft.displayOrder}
                onChange={(event) =>
                  updateDraft("displayOrder", Number(event.target.value))
                }
                required
              />
            </label>
          </div>
          <ImageUploadEditor
            label="Video thumbnail"
            help="Maximum 10 MB · 640 × 400px minimum · crop to 9:16 for reels or 16:9 for widescreen"
            minimumWidth={640}
            minimumHeight={400}
            defaultAspect={draft.format === "reel" ? "9:16" : "16:9"}
            currentImage={
              draft.thumbnailSrc
                ? { src: draft.thumbnailSrc, name: draft.titleEn || "video" }
                : undefined
            }
            disabled={busy}
            onUpload={uploadThumbnail}
          />
          {draft.thumbnailSrc && (
            <div
              className={styles.videoThumbnailPreview}
              data-format={draft.format}
            >
              {/* An authenticated Blob upload. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.thumbnailSrc} alt="Video thumbnail preview" />
              <span>
                {draft.thumbnailWidth} × {draft.thumbnailHeight}px
              </span>
            </div>
          )}
          <div className={styles.twoColumns}>
            <label>
              English thumbnail alt text
              <input
                value={draft.altEn}
                onChange={(event) => updateDraft("altEn", event.target.value)}
                maxLength={240}
                required
              />
            </label>
            <label>
              French thumbnail alt text
              <input
                value={draft.altFr}
                onChange={(event) => updateDraft("altFr", event.target.value)}
                maxLength={240}
                required
              />
            </label>
          </div>
          <div className={styles.toggleRow}>
            <label>
              <input
                type="checkbox"
                checked={draft.showOnHome}
                onChange={(event) =>
                  updateDraft("showOnHome", event.target.checked)
                }
              />
              Homepage
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.showInGallery}
                onChange={(event) =>
                  updateDraft("showInGallery", event.target.checked)
                }
              />
              Gallery
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.autoplay}
                onChange={(event) => updateAutoplay(event.target.checked)}
                disabled={provider !== "youtube"}
              />
              Autoplay muted YouTube preview
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.loop}
                onChange={(event) => updateDraft("loop", event.target.checked)}
                disabled={provider !== "youtube" || !draft.autoplay}
              />
              Loop YouTube preview
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(event) =>
                  updateDraft("published", event.target.checked)
                }
              />
              Published
            </label>
          </div>
          <p className={styles.fieldHint}>
            YouTube cards play inline with native play, pause, volume, timeline,
            and fullscreen controls. Autoplay starts muted. Instagram cards use
            the uploaded thumbnail and open the original Instagram link.
          </p>
          <div className={styles.formActions}>
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : selectedId ? "Save changes" : "Create video"}
            </button>
            {selectedId && (
              <button
                type="button"
                className={styles.danger}
                onClick={removeVideo}
                disabled={busy}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </aside>

      <section className={styles.libraryPanel}>
        <div className={styles.libraryHeading}>
          <div>
            <p className={styles.eyebrow}>VIDEO LIBRARY</p>
            <h2>{videos.length} videos</h2>
          </div>
          <button type="button" onClick={() => loadVideos()} disabled={busy}>
            Refresh
          </button>
        </div>
        <div className={styles.projectGrid}>
          {videos.map((video) => (
            <button
              type="button"
              key={video.id}
              className={`${styles.projectCard} ${
                video.id === selectedId ? styles.selectedCard : ""
              }`}
              onClick={() => editVideo(video)}
            >
              <span
                className={styles.cardImage}
                style={{
                  aspectRatio: video.format === "reel" ? "9 / 16" : "16 / 9",
                }}
              >
                {/* An authenticated Blob upload. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnailSrc} alt="" />
                <i>{video.published ? "LIVE" : "DRAFT"}</i>
              </span>
              <span className={styles.cardCopy}>
                <strong>{video.titleEn}</strong>
                <small>{video.descriptionEn}</small>
                <em>
                  {video.provider} · {video.format === "reel" ? "9:16" : "16:9"}
                </em>
              </span>
            </button>
          ))}
          {!videos.length && (
            <div className={styles.emptyState}>
              <strong>No video cards yet.</strong>
              <p>Add a thumbnail and a YouTube or Instagram link.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
