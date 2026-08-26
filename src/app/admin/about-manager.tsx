"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AboutImageInput,
  AboutInput,
  AdminAboutSettings,
  LocalizedAboutText,
} from "@/lib/admin/about-schema";
import { ImageUploadEditor } from "./image-upload-editor";
import styles from "./admin.module.css";

type ImageKey = keyof AboutInput["images"];

function LocalizedPair({
  label,
  value,
  maximum,
  multiline = false,
  onChange,
}: {
  label: string;
  value: LocalizedAboutText;
  maximum: number;
  multiline?: boolean;
  onChange: (locale: "en" | "fr", value: string) => void;
}) {
  const Control = multiline ? "textarea" : "input";
  return (
    <div className={styles.twoColumns}>
      <label>
        {label} · English
        <Control
          value={value.en}
          onChange={(event) => onChange("en", event.target.value)}
          maxLength={maximum}
          required
        />
      </label>
      <label>
        {label} · French
        <Control
          value={value.fr}
          onChange={(event) => onChange("fr", event.target.value)}
          maxLength={maximum}
          required
        />
      </label>
    </div>
  );
}

function AboutImageCard({
  title,
  description,
  image,
  busy,
  onUpload,
  onChange,
  onRemove,
}: {
  title: string;
  description: string;
  image: AboutImageInput;
  busy: boolean;
  onUpload: (file: File) => Promise<void>;
  onChange: (update: (image: AboutImageInput) => void) => void;
  onRemove: () => void;
}) {
  return (
    <article className={styles.aboutImageCard}>
      <div>
        <p className={styles.eyebrow}>AX7 VISUAL CARD</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {image.src ? (
        <div className={styles.aboutImagePreview}>
          {/* User-selected Vercel Blob URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt=""
            style={{ objectPosition: `${image.focusX}% ${image.focusY}%` }}
          />
          <span>
            {image.width} × {image.height}px
          </span>
        </div>
      ) : (
        <div className={styles.aboutFallbackPreview}>
          <span>AX7</span>
          <small>CODE ART FALLBACK</small>
        </div>
      )}
      <ImageUploadEditor
        label={image.src ? "Replace or edit image" : "Upload image"}
        help="JPG, PNG, WebP, or AVIF · maximum 4 MB · 640 × 400px minimum"
        minimumWidth={640}
        minimumHeight={400}
        defaultAspect={title.includes("Portrait") ? "4:5" : "16:9"}
        currentImage={
          image.src ? { src: image.src, name: title.toLowerCase() } : undefined
        }
        disabled={busy}
        onUpload={onUpload}
      />
      {image.src && (
        <>
          <div className={styles.twoColumns}>
            <label>
              English image description
              <input
                value={image.alt.en}
                onChange={(event) =>
                  onChange((next) => {
                    next.alt.en = event.target.value;
                  })
                }
                maxLength={240}
                required
              />
            </label>
            <label>
              French image description
              <input
                value={image.alt.fr}
                onChange={(event) =>
                  onChange((next) => {
                    next.alt.fr = event.target.value;
                  })
                }
                maxLength={240}
                required
              />
            </label>
          </div>
          <div className={styles.twoColumns}>
            <label className={styles.rangeField}>
              Horizontal focus <output>{image.focusX}%</output>
              <input
                type="range"
                min="0"
                max="100"
                value={image.focusX}
                onChange={(event) =>
                  onChange((next) => {
                    next.focusX = Number(event.target.value);
                  })
                }
              />
            </label>
            <label className={styles.rangeField}>
              Vertical focus <output>{image.focusY}%</output>
              <input
                type="range"
                min="0"
                max="100"
                value={image.focusY}
                onChange={(event) =>
                  onChange((next) => {
                    next.focusY = Number(event.target.value);
                  })
                }
              />
            </label>
          </div>
          <button
            type="button"
            className={styles.secondary}
            onClick={onRemove}
            disabled={busy}
          >
            Use artwork fallback
          </button>
        </>
      )}
    </article>
  );
}

function toInput(settings: AdminAboutSettings): AboutInput {
  return {
    home: settings.home,
    hero: settings.hero,
    stats: settings.stats,
    approach: settings.approach,
    process: settings.process,
    images: settings.images,
  };
}

export function AboutManager({ getCsrf }: { getCsrf: () => Promise<string> }) {
  const [draft, setDraft] = useState<AboutInput | null>(null);
  const [fallback, setFallback] = useState<AboutInput | null>(null);
  const [managed, setManaged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAbout = useCallback(async () => {
    const response = await fetch("/api/admin/about", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await response.json()) as {
      about?: AdminAboutSettings | null;
      fallback?: AboutInput;
      error?: string;
    };
    if (!response.ok || !data.fallback) {
      throw new Error(data.error || "Unable to load the About editor.");
    }
    setFallback(data.fallback);
    setDraft(data.about ? toInput(data.about) : data.fallback);
    setManaged(Boolean(data.about));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAbout().catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load the About editor.",
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAbout]);

  function clearNotices() {
    setError("");
    setMessage("");
  }

  function changeDraft(update: (next: AboutInput) => void) {
    setDraft((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      update(next);
      return next;
    });
  }

  function changeImage(
    key: ImageKey,
    update: (image: AboutImageInput) => void,
  ) {
    changeDraft((next) => update(next.images[key]));
  }

  async function uploadImage(key: ImageKey, file: File) {
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "about");
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
        throw new Error(data.error || "Unable to upload the About image.");
      }
      changeImage(key, (image) => {
        image.src = data.url!;
        image.width = data.width!;
        image.height = data.height!;
        if (!image.alt.en) image.alt.en = "AX7MOV About image";
        if (!image.alt.fr) image.alt.fr = "Image À propos d’AX7MOV";
      });
      setMessage("Image uploaded. Save all changes to publish it.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAbout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch("/api/admin/about", {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as {
        about?: AdminAboutSettings;
        error?: string;
      };
      if (!response.ok || !data.about) {
        throw new Error(data.error || "Unable to save the About content.");
      }
      setDraft(toInput(data.about));
      setManaged(true);
      setMessage("About page and homepage section published.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }

  async function restoreDefaults() {
    if (!fallback) return;
    if (!managed) {
      setDraft(structuredClone(fallback));
      setMessage("Default content and artwork are selected.");
      return;
    }
    if (
      !window.confirm(
        "Restore all original About text and AX7 artwork? Uploaded files will no longer be used.",
      )
    )
      return;
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch("/api/admin/about", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": token },
      });
      const data = (await response.json()) as {
        fallback?: AboutInput;
        error?: string;
      };
      if (!response.ok || !data.fallback) {
        throw new Error(data.error || "Unable to restore the defaults.");
      }
      setFallback(data.fallback);
      setDraft(data.fallback);
      setManaged(false);
      setMessage("Original About content and artwork restored.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to restore.");
    } finally {
      setBusy(false);
    }
  }

  if (!draft) {
    return (
      <section className={styles.heroEditorPage}>
        <p className={error ? styles.error : styles.securityIntro}>
          {error || "Loading About content…"}
        </p>
      </section>
    );
  }

  return (
    <section className={styles.aboutEditorPage}>
      <div className={styles.heroEditorHeading}>
        <div>
          <p className={styles.eyebrow}>ABOUT CONTENT</p>
          <h1>Edit the story behind AX7.</h1>
          <p>
            Manage the homepage About section, full About page, process, and
            both AX7 visual-card images in English and French.
          </p>
        </div>
        <span className={managed ? styles.liveBadge : styles.fallbackBadge}>
          {managed ? "MANAGED CONTENT · LIVE" : "ORIGINAL FALLBACKS"}
        </span>
      </div>

      {(error || message) && (
        <div className={error ? styles.error : styles.success} role="status">
          {error || message}
        </div>
      )}

      <form
        onSubmit={saveAbout}
        className={`${styles.editorForm} ${styles.aboutEditorForm}`}
      >
        <section className={styles.aboutFormSection}>
          <div className={styles.aboutSectionHeading}>
            <span>01</span>
            <div>
              <h2>Homepage About section</h2>
              <p>The short introduction displayed on the homepage.</p>
            </div>
          </div>
          <LocalizedPair
            label="Eyebrow"
            value={draft.home.eyebrow}
            maximum={100}
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.home.eyebrow[locale] = value;
              })
            }
          />
          <LocalizedPair
            label="Title"
            value={draft.home.title}
            maximum={180}
            multiline
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.home.title[locale] = value;
              })
            }
          />
          <LocalizedPair
            label="Introduction"
            value={draft.home.body}
            maximum={1200}
            multiline
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.home.body[locale] = value;
              })
            }
          />
          <LocalizedPair
            label="Link label"
            value={draft.home.linkLabel}
            maximum={100}
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.home.linkLabel[locale] = value;
              })
            }
          />
        </section>

        <section className={styles.aboutFormSection}>
          <div className={styles.aboutSectionHeading}>
            <span>02</span>
            <div>
              <h2>About page hero</h2>
              <p>The opening heading, biography, and portrait card.</p>
            </div>
          </div>
          <LocalizedPair
            label="Eyebrow"
            value={draft.hero.eyebrow}
            maximum={100}
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.hero.eyebrow[locale] = value;
              })
            }
          />
          <LocalizedPair
            label="Title"
            value={draft.hero.title}
            maximum={220}
            multiline
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.hero.title[locale] = value;
              })
            }
          />
          <LocalizedPair
            label="Biography"
            value={draft.hero.bio}
            maximum={1500}
            multiline
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.hero.bio[locale] = value;
              })
            }
          />
        </section>

        <section className={styles.aboutFormSection}>
          <div className={styles.aboutSectionHeading}>
            <span>03</span>
            <div>
              <h2>AX7 card images</h2>
              <p>
                Crop, rotate, resize, and adjust each upload. Removing an image
                automatically restores the original AX7 artwork.
              </p>
            </div>
          </div>
          <div className={styles.aboutImagesGrid}>
            <AboutImageCard
              title="Portrait AX7 card"
              description="Shown in the About-page hero and the homepage About preview."
              image={draft.images.portrait}
              busy={busy}
              onUpload={(file) => uploadImage("portrait", file)}
              onChange={(update) => changeImage("portrait", update)}
              onRemove={() =>
                changeDraft((next) => {
                  next.images.portrait = structuredClone(
                    fallback?.images.portrait || next.images.portrait,
                  );
                })
              }
            />
            <AboutImageCard
              title="Approach AX7 card"
              description="Shown beside the creative-approach section on the full About page."
              image={draft.images.approach}
              busy={busy}
              onUpload={(file) => uploadImage("approach", file)}
              onChange={(update) => changeImage("approach", update)}
              onRemove={() =>
                changeDraft((next) => {
                  next.images.approach = structuredClone(
                    fallback?.images.approach || next.images.approach,
                  );
                })
              }
            />
          </div>
        </section>

        <section className={styles.aboutFormSection}>
          <div className={styles.aboutSectionHeading}>
            <span>04</span>
            <div>
              <h2>Stats cards</h2>
              <p>The three facts directly below the About hero.</p>
            </div>
          </div>
          {draft.stats.map((stat, index) => (
            <div className={styles.aboutNestedSection} key={index}>
              <h3>Stat card {index + 1}</h3>
              <LocalizedPair
                label="Value"
                value={stat.value}
                maximum={80}
                onChange={(locale, value) =>
                  changeDraft((next) => {
                    next.stats[index].value[locale] = value;
                  })
                }
              />
              <LocalizedPair
                label="Label"
                value={stat.label}
                maximum={120}
                onChange={(locale, value) =>
                  changeDraft((next) => {
                    next.stats[index].label[locale] = value;
                  })
                }
              />
            </div>
          ))}
        </section>

        <section className={styles.aboutFormSection}>
          <div className={styles.aboutSectionHeading}>
            <span>05</span>
            <div>
              <h2>Creative approach</h2>
              <p>The main body section and portfolio note.</p>
            </div>
          </div>
          {(
            [
              ["eyebrow", "Eyebrow", 100, false],
              ["title", "Title", 220, true],
              ["body", "Body", 1200, true],
              ["note", "Portfolio note", 1200, true],
            ] as const
          ).map(([key, label, maximum, multiline]) => (
            <LocalizedPair
              key={key}
              label={label}
              value={draft.approach[key]}
              maximum={maximum}
              multiline={multiline}
              onChange={(locale, value) =>
                changeDraft((next) => {
                  next.approach[key][locale] = value;
                })
              }
            />
          ))}
        </section>

        <section className={styles.aboutFormSection}>
          <div className={styles.aboutSectionHeading}>
            <span>06</span>
            <div>
              <h2>Process and contact</h2>
              <p>
                The process heading, four steps, estimate, and final button.
              </p>
            </div>
          </div>
          <LocalizedPair
            label="Eyebrow"
            value={draft.process.eyebrow}
            maximum={100}
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.process.eyebrow[locale] = value;
              })
            }
          />
          <LocalizedPair
            label="Title"
            value={draft.process.title}
            maximum={240}
            multiline
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.process.title[locale] = value;
              })
            }
          />
          <LocalizedPair
            label="Estimate note"
            value={draft.process.estimate}
            maximum={500}
            multiline
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.process.estimate[locale] = value;
              })
            }
          />
          {draft.process.steps.map((step, index) => (
            <div className={styles.aboutNestedSection} key={index}>
              <h3>Process step {index + 1}</h3>
              <LocalizedPair
                label="Title"
                value={step.title}
                maximum={100}
                onChange={(locale, value) =>
                  changeDraft((next) => {
                    next.process.steps[index].title[locale] = value;
                  })
                }
              />
              <LocalizedPair
                label="Description"
                value={step.body}
                maximum={600}
                multiline
                onChange={(locale, value) =>
                  changeDraft((next) => {
                    next.process.steps[index].body[locale] = value;
                  })
                }
              />
            </div>
          ))}
          <LocalizedPair
            label="Contact button"
            value={draft.process.contactLabel}
            maximum={100}
            onChange={(locale, value) =>
              changeDraft((next) => {
                next.process.contactLabel[locale] = value;
              })
            }
          />
        </section>

        <div className={styles.aboutStickyActions}>
          <span>
            {managed
              ? "Saving updates both public languages."
              : "The site is currently using the original content."}
          </span>
          <div className={styles.formActions}>
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save and publish About"}
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={restoreDefaults}
              disabled={busy}
            >
              Restore all defaults
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
