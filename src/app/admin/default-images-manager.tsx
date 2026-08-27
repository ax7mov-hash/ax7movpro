"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminDefaultImage,
  DefaultImageInput,
} from "@/lib/admin/default-image-schema";
import { ImageUploadEditor } from "./image-upload-editor";
import styles from "./admin.module.css";

function toInput(image: AdminDefaultImage): DefaultImageInput {
  return {
    src: image.src,
    width: image.width,
    height: image.height,
    titleEn: image.titleEn,
    titleFr: image.titleFr,
    descriptionEn: image.descriptionEn,
    descriptionFr: image.descriptionFr,
    altEn: image.altEn,
    altFr: image.altFr,
    focusX: image.focusX,
    focusY: image.focusY,
  };
}

export function DefaultImagesManager({
  getCsrf,
}: {
  getCsrf: () => Promise<string>;
}) {
  const [images, setImages] = useState<AdminDefaultImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DefaultImageInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => images.find((image) => image.id === selectedId),
    [images, selectedId],
  );

  const loadImages = useCallback(async () => {
    const response = await fetch("/api/admin/default-images", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await response.json()) as {
      images?: AdminDefaultImage[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error || "Unable to load the default images.");
    }
    const nextImages = data.images || [];
    setImages(nextImages);
    setSelectedId(nextImages[0]?.id || null);
    setDraft(nextImages[0] ? toInput(nextImages[0]) : null);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadImages().catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load the default images.",
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadImages]);

  function clearNotices() {
    setError("");
    setMessage("");
  }

  function selectImage(image: AdminDefaultImage) {
    clearNotices();
    setSelectedId(image.id);
    setDraft(toInput(image));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateDraft<Key extends keyof DefaultImageInput>(
    key: Key,
    value: DefaultImageInput[Key],
  ) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function uploadImage(file?: File) {
    if (!file || !draft) return;
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "default");
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
        throw new Error(data.error || "Unable to upload the image.");
      }
      setDraft((current) =>
        current
          ? {
              ...current,
              src: data.url!,
              width: data.width!,
              height: data.height!,
            }
          : current,
      );
      setMessage("Image uploaded. Check the crop, then save the replacement.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Image upload failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !draft) return;
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch(
        `/api/admin/default-images/${encodeURIComponent(selected.id)}`,
        {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
          },
          body: JSON.stringify(draft),
        },
      );
      const data = (await response.json()) as {
        image?: AdminDefaultImage;
        error?: string;
      };
      if (!response.ok || !data.image) {
        throw new Error(data.error || "Unable to save the image.");
      }
      setImages((current) =>
        current.map((image) =>
          image.id === data.image!.id ? data.image! : image,
        ),
      );
      setDraft(toInput(data.image));
      setMessage("Default image replacement published.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save the image.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function restoreFallback() {
    if (!selected?.overridden) return;
    if (!window.confirm(`Restore the bundled image for “${selected.titleEn}”?`))
      return;
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch(
        `/api/admin/default-images/${encodeURIComponent(selected.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
          headers: { "X-CSRF-Token": token },
        },
      );
      const data = (await response.json()) as {
        image?: AdminDefaultImage;
        error?: string;
      };
      if (!response.ok || !data.image) {
        throw new Error(data.error || "Unable to restore the bundled image.");
      }
      setImages((current) =>
        current.map((image) =>
          image.id === data.image!.id ? data.image! : image,
        ),
      );
      setDraft(toInput(data.image));
      setMessage("Bundled fallback image restored.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to restore the image.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.dashboard}>
      <aside className={styles.editorPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>DEFAULT IMAGE EDITOR</p>
            <h1>{selected?.titleEn || "Choose an image"}</h1>
          </div>
          {selected && (
            <span
              className={
                selected.overridden ? styles.liveBadge : styles.fallbackBadge
              }
            >
              {selected.overridden ? "CUSTOM" : "BUNDLED"}
            </span>
          )}
        </div>
        {(error || message) && (
          <div className={error ? styles.error : styles.success} role="status">
            {error || message}
          </div>
        )}
        {selected && draft ? (
          <form onSubmit={saveImage} className={styles.editorForm}>
            <div className={styles.defaultImagePreview}>
              {/* A trusted bundled image or an authenticated Blob upload. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.src}
                alt="Selected default image preview"
                style={{ objectPosition: `${draft.focusX}% ${draft.focusY}%` }}
              />
              <span>
                {draft.width} × {draft.height}px
              </span>
            </div>
            <ImageUploadEditor
              label="Replacement image"
              help="Maximum 10 MB · 640 × 400px minimum · 8,000px maximum side · 40 MP maximum"
              minimumWidth={640}
              minimumHeight={400}
              currentImage={{ src: draft.src, name: selected.id }}
              disabled={busy}
              onUpload={uploadImage}
            />
            <div className={styles.twoColumns}>
              <label>
                English card name
                <input
                  value={draft.titleEn}
                  onChange={(event) =>
                    updateDraft("titleEn", event.target.value)
                  }
                  maxLength={120}
                  required
                />
              </label>
              <label>
                French card name
                <input
                  value={draft.titleFr}
                  onChange={(event) =>
                    updateDraft("titleFr", event.target.value)
                  }
                  maxLength={120}
                  required
                />
              </label>
            </div>
            <div className={styles.twoColumns}>
              <label>
                English card description
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
                French card description
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
            <div className={styles.formActions}>
              <button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save replacement"}
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={restoreFallback}
                disabled={busy || !selected.overridden}
              >
                Restore bundled image
              </button>
            </div>
          </form>
        ) : (
          !error && (
            <div className={styles.emptyState}>Loading default images…</div>
          )
        )}
      </aside>

      <section className={styles.libraryPanel}>
        <div className={styles.libraryHeading}>
          <div>
            <p className={styles.eyebrow}>BUNDLED MEDIA</p>
            <h2>{images.length} images</h2>
          </div>
          <button type="button" onClick={() => loadImages()} disabled={busy}>
            Refresh
          </button>
        </div>
        <div className={styles.defaultImageGrid}>
          {images.map((image) => (
            <button
              type="button"
              key={image.id}
              className={`${styles.defaultImageCard} ${
                image.id === selectedId ? styles.selectedCard : ""
              }`}
              onClick={() => selectImage(image)}
            >
              <span className={styles.defaultImageThumb}>
                {/* A trusted bundled image or an authenticated Blob upload. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt="" />
                <i>{image.overridden ? "CUSTOM" : "BUNDLED"}</i>
              </span>
              <span className={styles.cardCopy}>
                <strong>{image.titleEn}</strong>
                <small>{image.descriptionEn}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
