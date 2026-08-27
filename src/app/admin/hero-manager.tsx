"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminHeroSettings, HeroInput } from "@/lib/admin/hero-schema";
import { mediaItems } from "@/lib/media";
import { ImageUploadEditor } from "./image-upload-editor";
import styles from "./admin.module.css";

const fallbackItem = mediaItems[0];
const fallbackHero: HeroInput = {
  src: fallbackItem.src!,
  width: fallbackItem.width!,
  height: fallbackItem.height!,
  altEn: fallbackItem.alt.en,
  altFr: fallbackItem.alt.fr,
  focusX: 50,
  focusY: 54,
};

function toInput(settings: AdminHeroSettings): HeroInput {
  return {
    src: settings.src,
    width: settings.width,
    height: settings.height,
    altEn: settings.altEn,
    altFr: settings.altFr,
    focusX: settings.focusX,
    focusY: settings.focusY,
  };
}

export function HeroManager({ getCsrf }: { getCsrf: () => Promise<string> }) {
  const [draft, setDraft] = useState<HeroInput>(fallbackHero);
  const [managed, setManaged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadHero = useCallback(async () => {
    const response = await fetch("/api/admin/hero", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await response.json()) as {
      hero?: AdminHeroSettings | null;
      error?: string;
    };
    if (!response.ok)
      throw new Error(data.error || "Unable to load the hero image.");
    if (data.hero) {
      setDraft(toInput(data.hero));
      setManaged(true);
    } else {
      setDraft(fallbackHero);
      setManaged(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadHero().catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load the hero image.",
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadHero]);

  function clearNotices() {
    setError("");
    setMessage("");
  }

  function updateDraft<Key extends keyof HeroInput>(
    key: Key,
    value: HeroInput[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function uploadHero(file?: File) {
    if (!file) return;
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "hero");
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
        throw new Error(data.error || "Unable to upload the hero image.");
      }
      setDraft((current) => ({
        ...current,
        src: data.url!,
        width: data.width!,
        height: data.height!,
      }));
      setMessage("Image uploaded. Review the preview, then save the hero.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Hero upload failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveHero(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch("/api/admin/hero", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as {
        hero?: AdminHeroSettings;
        error?: string;
      };
      if (!response.ok || !data.hero) {
        throw new Error(data.error || "Unable to save the hero image.");
      }
      setDraft(toInput(data.hero));
      setManaged(true);
      setMessage("Hero image published on the homepage.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save the hero.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function restoreFallback() {
    if (!managed) {
      setDraft(fallbackHero);
      clearNotices();
      setMessage("The fallback image is selected.");
      return;
    }
    if (!window.confirm("Restore the original Midnight Velocity hero image?"))
      return;
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch("/api/admin/hero", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": token },
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to restore the fallback image.");
      }
      setDraft(fallbackHero);
      setManaged(false);
      setMessage("Original fallback image restored.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to restore the fallback.",
      );
    } finally {
      setBusy(false);
    }
  }

  const showingFallback = draft.src === fallbackHero.src;

  return (
    <section className={styles.heroEditorPage}>
      <div className={styles.heroEditorHeading}>
        <div>
          <p className={styles.eyebrow}>HOMEPAGE HERO</p>
          <h1>Change the opening frame.</h1>
          <p>
            Upload a wide image, adjust its focal point, and add accessible
            English and French descriptions.
          </p>
        </div>
        <span
          className={showingFallback ? styles.fallbackBadge : styles.liveBadge}
        >
          {showingFallback
            ? "ORIGINAL FALLBACK"
            : managed
              ? "LIVE"
              : "NOT SAVED"}
        </span>
      </div>

      {(error || message) && (
        <div className={error ? styles.error : styles.success} role="status">
          {error || message}
        </div>
      )}

      <div className={styles.heroEditorGrid}>
        <div className={styles.heroLargePreview}>
          {/* A user-selected Blob URL or the trusted local fallback. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={draft.src}
            alt="Hero preview"
            style={{ objectPosition: `${draft.focusX}% ${draft.focusY}%` }}
          />
          <span>Homepage preview</span>
        </div>

        <form onSubmit={saveHero} className={styles.editorForm}>
          <ImageUploadEditor
            label="New hero image"
            help="Wide JPG, PNG, WebP, or AVIF · maximum 10 MB · 1,200 × 600px minimum"
            minimumWidth={1200}
            minimumHeight={600}
            defaultAspect="16:9"
            currentImage={{ src: draft.src, name: "homepage-hero" }}
            disabled={busy}
            onUpload={uploadHero}
          />
          <div className={styles.twoColumns}>
            <label className={styles.rangeField}>
              Horizontal focus <output>{draft.focusX}%</output>
              <input
                type="range"
                min="0"
                max="100"
                value={draft.focusX}
                onChange={(event) =>
                  updateDraft("focusX", Number(event.target.value))
                }
              />
            </label>
            <label className={styles.rangeField}>
              Vertical focus <output>{draft.focusY}%</output>
              <input
                type="range"
                min="0"
                max="100"
                value={draft.focusY}
                onChange={(event) =>
                  updateDraft("focusY", Number(event.target.value))
                }
              />
            </label>
          </div>
          <label>
            English image description
            <input
              value={draft.altEn}
              onChange={(event) => updateDraft("altEn", event.target.value)}
              maxLength={240}
              required
            />
          </label>
          <label>
            French image description
            <input
              value={draft.altFr}
              onChange={(event) => updateDraft("altFr", event.target.value)}
              maxLength={240}
              required
            />
          </label>
          <small className={styles.imageDetails}>
            {draft.width} × {draft.height}px
          </small>
          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={busy || (showingFallback && !managed)}
            >
              {busy ? "Saving…" : "Save hero"}
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={restoreFallback}
              disabled={busy || (showingFallback && !managed)}
            >
              Use original fallback
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
