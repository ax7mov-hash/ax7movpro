"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminReview, ReviewInput } from "@/lib/admin/review-schema";
import styles from "./admin.module.css";

const emptyReview: ReviewInput = {
  author: "",
  roleEn: "",
  roleFr: "",
  quoteEn: "",
  quoteFr: "",
  rating: 5,
  published: false,
  displayOrder: 0,
};

export function ReviewManager({ getCsrf }: { getCsrf: () => Promise<string> }) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReviewInput>(emptyReview);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => reviews.find((review) => review.id === selectedId),
    [reviews, selectedId],
  );

  const loadReviews = useCallback(async () => {
    const response = await fetch("/api/admin/reviews", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await response.json()) as {
      reviews?: AdminReview[];
      error?: string;
    };
    if (!response.ok) throw new Error(data.error || "Unable to load reviews.");
    setReviews(data.reviews || []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadReviews().catch((reason: unknown) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load reviews.",
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  function clearNotices() {
    setError("");
    setMessage("");
  }

  function newReview() {
    clearNotices();
    setSelectedId(null);
    setDraft({ ...emptyReview, displayOrder: reviews.length });
  }

  function editReview(review: AdminReview) {
    clearNotices();
    setSelectedId(review.id);
    setDraft({
      author: review.author,
      roleEn: review.roleEn,
      roleFr: review.roleFr,
      quoteEn: review.quoteEn,
      quoteFr: review.quoteFr,
      rating: review.rating,
      published: review.published,
      displayOrder: review.displayOrder,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateDraft<Key extends keyof ReviewInput>(
    key: Key,
    value: ReviewInput[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch(
        selectedId ? `/api/admin/reviews/${selectedId}` : "/api/admin/reviews",
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
        review?: AdminReview;
        error?: string;
      };
      if (!response.ok || !data.review) {
        throw new Error(data.error || "Unable to save review.");
      }
      setReviews((current) => {
        const remaining = current.filter(
          (review) => review.id !== data.review!.id,
        );
        return [...remaining, data.review!].sort(
          (left, right) => left.displayOrder - right.displayOrder,
        );
      });
      editReview(data.review);
      setMessage(selectedId ? "Review updated." : "Review created.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save review.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeReview() {
    if (!selectedId || !selected) return;
    if (!window.confirm(`Delete the review from “${selected.author}”?`)) return;
    clearNotices();
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch(`/api/admin/reviews/${selectedId}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": token },
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(data.error || "Unable to delete review.");
      setReviews((current) =>
        current.filter((review) => review.id !== selectedId),
      );
      newReview();
      setMessage("Review deleted.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to delete review.",
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
            <p className={styles.eyebrow}>REVIEW EDITOR</p>
            <h1>{selectedId ? "Edit review" : "New review"}</h1>
          </div>
          <button
            type="button"
            onClick={newReview}
            className={styles.secondary}
          >
            New
          </button>
        </div>
        {(error || message) && (
          <div className={error ? styles.error : styles.success} role="status">
            {error || message}
          </div>
        )}
        <form onSubmit={saveReview} className={styles.editorForm}>
          <div className={styles.threeColumns}>
            <label>
              Client name
              <input
                value={draft.author}
                onChange={(event) => updateDraft("author", event.target.value)}
                maxLength={100}
                required
              />
            </label>
            <label>
              Rating
              <select
                value={draft.rating}
                onChange={(event) =>
                  updateDraft("rating", Number(event.target.value))
                }
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} star{rating === 1 ? "" : "s"}
                  </option>
                ))}
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
          <div className={styles.twoColumns}>
            <label>
              English role or project
              <input
                value={draft.roleEn}
                onChange={(event) => updateDraft("roleEn", event.target.value)}
                maxLength={120}
                placeholder="Portrait client"
              />
            </label>
            <label>
              French role or project
              <input
                value={draft.roleFr}
                onChange={(event) => updateDraft("roleFr", event.target.value)}
                maxLength={120}
                placeholder="Client portrait"
              />
            </label>
          </div>
          <div className={styles.twoColumns}>
            <label>
              English review
              <textarea
                value={draft.quoteEn}
                onChange={(event) => updateDraft("quoteEn", event.target.value)}
                minLength={10}
                maxLength={1000}
                required
              />
            </label>
            <label>
              French review
              <textarea
                value={draft.quoteFr}
                onChange={(event) => updateDraft("quoteFr", event.target.value)}
                minLength={10}
                maxLength={1000}
                required
              />
            </label>
          </div>
          <div className={styles.toggleRow}>
            <label>
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(event) =>
                  updateDraft("published", event.target.checked)
                }
              />
              Published on homepage
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : selectedId ? "Save changes" : "Create review"}
            </button>
            {selectedId && (
              <button
                type="button"
                className={styles.danger}
                onClick={removeReview}
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
            <p className={styles.eyebrow}>CLIENT FEEDBACK</p>
            <h2>{reviews.length} reviews</h2>
          </div>
          <button type="button" onClick={() => loadReviews()} disabled={busy}>
            Refresh
          </button>
        </div>
        <div className={styles.reviewList}>
          {reviews.map((review) => (
            <button
              type="button"
              key={review.id}
              className={`${styles.reviewCard} ${
                review.id === selectedId ? styles.selectedCard : ""
              }`}
              onClick={() => editReview(review)}
            >
              <span className={styles.reviewMeta}>
                <i>{review.published ? "LIVE" : "DRAFT"}</i>
                <span aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </span>
              <q>{review.quoteEn}</q>
              <strong>{review.author}</strong>
              <small>{review.roleEn || "Client"}</small>
            </button>
          ))}
          {!reviews.length && (
            <div className={styles.emptyState}>
              <strong>No reviews yet.</strong>
              <p>Add the first client review and publish it when ready.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
