"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminProject, ProjectInput } from "@/lib/admin/project-schema";
import { creativeAreas } from "@/lib/admin/project-schema";
import { createPasswordProof } from "@/lib/admin-password";
import { DefaultImagesManager } from "./default-images-manager";
import { AboutManager } from "./about-manager";
import { HeroManager } from "./hero-manager";
import { ImageUploadEditor } from "./image-upload-editor";
import { ReviewManager } from "./review-manager";
import { SecurityPanel } from "./security-panel";
import { VideoManager } from "./video-manager";
import styles from "./admin.module.css";

const emptyProject: ProjectInput = {
  slug: "",
  titleEn: "",
  titleFr: "",
  descriptionEn: "",
  descriptionFr: "",
  altEn: "",
  altFr: "",
  mediaType: "photo",
  area: "automotive",
  src: "",
  objectPosition: "center center",
  featured: false,
  published: false,
  displayOrder: 0,
};

export function AdminApp({
  initialAuthenticated,
  initialConfigured,
  initialAdminEmail,
  initialPasswordChangeRequired,
}: {
  initialAuthenticated: boolean;
  initialConfigured: boolean;
  initialAdminEmail: string;
  initialPasswordChangeRequired: boolean;
}) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [adminEmail, setAdminEmail] = useState(initialAdminEmail);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(
    initialPasswordChangeRequired,
  );
  const [activeSection, setActiveSection] = useState<
    "projects" | "images" | "hero" | "about" | "videos" | "reviews" | "security"
  >("projects");
  const [configured] = useState(initialConfigured);
  const [csrfToken, setCsrfToken] = useState("");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectInput>(emptyProject);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId),
    [projects, selectedId],
  );

  const getCsrf = useCallback(async () => {
    const response = await fetch("/api/admin/csrf", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await response.json()) as { csrfToken?: string };
    if (data.csrfToken) setCsrfToken(data.csrfToken);
    return data.csrfToken || "";
  }, []);

  const loadProjects = useCallback(async () => {
    const response = await fetch("/api/admin/projects", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const data = (await response.json()) as {
      projects?: AdminProject[];
      error?: string;
      code?: string;
    };
    if (data.code === "PASSWORD_CHANGE_REQUIRED") {
      setPasswordChangeRequired(true);
      return;
    }
    if (!response.ok) throw new Error(data.error || "Unable to load projects.");
    setProjects(data.projects || []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      getCsrf().catch(() => setError("Unable to initialize the secure form."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [getCsrf]);

  useEffect(() => {
    if (!authenticated || passwordChangeRequired) return;
    const timer = window.setTimeout(() => {
      loadProjects().catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Unable to load."),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, loadProjects, passwordChangeRequired]);

  function clearNotices() {
    setError("");
    setMessage("");
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearNotices();
    setBusy(true);
    try {
      const token = csrfToken || (await getCsrf());
      const passwordProof = await createPasswordProof(email, password);
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ email, passwordProof }),
      });
      const data = (await response.json()) as {
        email?: string;
        error?: string;
        passwordChangeRequired?: boolean;
      };
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      setPassword("");
      setAdminEmail(data.email || email.trim().toLowerCase());
      setPasswordChangeRequired(Boolean(data.passwordChangeRequired));
      setAuthenticated(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    clearNotices();
    setBusy(true);
    try {
      const token = csrfToken || (await getCsrf());
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": token },
      });
      setAuthenticated(false);
      setAdminEmail("");
      setPasswordChangeRequired(false);
      setProjects([]);
      setSelectedId(null);
      setDraft(emptyProject);
      await getCsrf();
    } finally {
      setBusy(false);
    }
  }

  function editProject(project: AdminProject) {
    clearNotices();
    setSelectedId(project.id);
    setDraft({
      slug: project.slug,
      titleEn: project.titleEn,
      titleFr: project.titleFr,
      descriptionEn: project.descriptionEn,
      descriptionFr: project.descriptionFr,
      altEn: project.altEn,
      altFr: project.altFr,
      mediaType: project.mediaType,
      area: project.area,
      src: project.src || "",
      width: project.width,
      height: project.height,
      objectPosition: project.objectPosition,
      featured: project.featured,
      published: project.published,
      displayOrder: project.displayOrder,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newProject() {
    clearNotices();
    setSelectedId(null);
    setDraft({ ...emptyProject, displayOrder: projects.length });
  }

  function updateDraft<Key extends keyof ProjectInput>(
    key: Key,
    value: ProjectInput[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    clearNotices();
    setBusy(true);
    try {
      const token = csrfToken || (await getCsrf());
      const formData = new FormData();
      formData.set("file", file);
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
      if (!response.ok || !data.url || !data.width || !data.height)
        throw new Error(data.error || "Unable to upload image.");
      setDraft((current) => ({
        ...current,
        src: data.url,
        width: data.width,
        height: data.height,
      }));
      setMessage("Image uploaded. Save the project to publish the change.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearNotices();
    setBusy(true);
    try {
      const token = csrfToken || (await getCsrf());
      const response = await fetch(
        selectedId
          ? `/api/admin/projects/${selectedId}`
          : "/api/admin/projects",
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
        project?: AdminProject;
        error?: string;
      };
      if (!response.ok || !data.project)
        throw new Error(data.error || "Unable to save project.");
      setProjects((current) => {
        const withoutSaved = current.filter(
          (project) => project.id !== data.project!.id,
        );
        return [...withoutSaved, data.project!].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        );
      });
      editProject(data.project);
      setMessage(selectedId ? "Project updated." : "Project created.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }

  async function removeProject() {
    if (!selectedId || !selected) return;
    if (!window.confirm(`Delete “${selected.titleEn}”? This cannot be undone.`))
      return;
    clearNotices();
    setBusy(true);
    try {
      const token = csrfToken || (await getCsrf());
      const response = await fetch(`/api/admin/projects/${selectedId}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": token },
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to delete.");
      setProjects((current) =>
        current.filter((project) => project.id !== selectedId),
      );
      newProject();
      setMessage("Project deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete.");
    } finally {
      setBusy(false);
    }
  }

  if (!authenticated) {
    return (
      <main className={styles.shell}>
        <section className={styles.loginCard}>
          <div className={styles.brandRow}>
            <span className={styles.brandMark}>AX7</span>
            <span>Content Studio</span>
          </div>
          <p className={styles.eyebrow}>SECURE ADMIN</p>
          <h1>Manage every frame.</h1>
          <p className={styles.intro}>
            Sign in to upload, organize, feature, and publish portfolio work.
          </p>
          {!configured && (
            <div className={styles.configNotice} role="status">
              Add the required values from <code>.env.example</code> before
              signing in.
            </div>
          )}
          <form onSubmit={login} className={styles.loginForm}>
            <label>
              Admin email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={12}
                required
              />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" disabled={busy || !configured}>
              {busy ? "Checking…" : "Sign in securely"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (passwordChangeRequired) {
    return (
      <main className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.brandMark}>AX7</span>
            <div>
              <strong>Account setup</strong>
              <small>Temporary password detected</small>
            </div>
          </div>
          <div className={styles.topActions}>
            <button type="button" onClick={logout} disabled={busy}>
              Sign out
            </button>
          </div>
        </header>
        <SecurityPanel
          adminEmail={adminEmail}
          forced
          getCsrf={getCsrf}
          onPasswordChanged={() => setPasswordChangeRequired(false)}
        />
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.brandMark}>AX7</span>
          <div>
            <strong>Portfolio console</strong>
            <small>MongoDB Atlas · Vercel Blob</small>
          </div>
        </div>
        <nav className={styles.adminNav} aria-label="Admin sections">
          <button
            type="button"
            className={activeSection === "projects" ? styles.activeNav : ""}
            onClick={() => setActiveSection("projects")}
          >
            Projects
          </button>
          <button
            type="button"
            className={activeSection === "images" ? styles.activeNav : ""}
            onClick={() => setActiveSection("images")}
          >
            Images
          </button>
          <button
            type="button"
            className={activeSection === "hero" ? styles.activeNav : ""}
            onClick={() => setActiveSection("hero")}
          >
            Hero
          </button>
          <button
            type="button"
            className={activeSection === "about" ? styles.activeNav : ""}
            onClick={() => setActiveSection("about")}
          >
            About
          </button>
          <button
            type="button"
            className={activeSection === "videos" ? styles.activeNav : ""}
            onClick={() => setActiveSection("videos")}
          >
            Videos
          </button>
          <button
            type="button"
            className={activeSection === "reviews" ? styles.activeNav : ""}
            onClick={() => setActiveSection("reviews")}
          >
            Reviews
          </button>
          <button
            type="button"
            className={activeSection === "security" ? styles.activeNav : ""}
            onClick={() => setActiveSection("security")}
          >
            Security
          </button>
        </nav>
        <div className={styles.topActions}>
          <a href="/en" target="_blank" rel="noopener noreferrer">
            View website ↗
          </a>
          <button type="button" onClick={logout} disabled={busy}>
            Sign out
          </button>
        </div>
      </header>

      {activeSection === "projects" && (
        <section className={styles.dashboard}>
          <aside className={styles.editorPanel}>
            <div className={styles.panelHeading}>
              <div>
                <p className={styles.eyebrow}>PROJECT EDITOR</p>
                <h1>{selectedId ? "Edit project" : "New project"}</h1>
              </div>
              <button
                type="button"
                onClick={newProject}
                className={styles.secondary}
              >
                New
              </button>
            </div>
            {(error || message) && (
              <div
                className={error ? styles.error : styles.success}
                role="status"
              >
                {error || message}
              </div>
            )}
            <form onSubmit={saveProject} className={styles.editorForm}>
              <div className={styles.twoColumns}>
                <label>
                  URL slug
                  <input
                    value={draft.slug}
                    onChange={(event) =>
                      updateDraft("slug", event.target.value)
                    }
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    placeholder="obsidian-geometry"
                    required
                  />
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
                  English title
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
                  French title
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
              <div className={styles.twoColumns}>
                <label>
                  English alt text
                  <input
                    value={draft.altEn}
                    onChange={(event) =>
                      updateDraft("altEn", event.target.value)
                    }
                    maxLength={240}
                    required
                  />
                </label>
                <label>
                  French alt text
                  <input
                    value={draft.altFr}
                    onChange={(event) =>
                      updateDraft("altFr", event.target.value)
                    }
                    maxLength={240}
                    required
                  />
                </label>
              </div>
              <div className={styles.threeColumns}>
                <label>
                  Media
                  <select
                    value={draft.mediaType}
                    onChange={(event) =>
                      updateDraft(
                        "mediaType",
                        event.target.value as ProjectInput["mediaType"],
                      )
                    }
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video placeholder</option>
                  </select>
                </label>
                <label>
                  Creative area
                  <select
                    value={draft.area}
                    onChange={(event) =>
                      updateDraft(
                        "area",
                        event.target.value as ProjectInput["area"],
                      )
                    }
                  >
                    {creativeAreas.map((area) => (
                      <option key={area} value={area}>
                        {area.replaceAll("-", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Image focus
                  <input
                    value={draft.objectPosition || ""}
                    onChange={(event) =>
                      updateDraft("objectPosition", event.target.value)
                    }
                    placeholder="center 72%"
                  />
                </label>
              </div>
              <ImageUploadEditor
                label="Portfolio image"
                help="JPG, PNG, WebP, or AVIF · maximum 10 MB · 640 × 400px minimum"
                minimumWidth={640}
                minimumHeight={400}
                currentImage={
                  draft.src
                    ? { src: draft.src, name: draft.slug || "project" }
                    : undefined
                }
                disabled={busy}
                onUpload={uploadImage}
              />
              {draft.src && (
                <div className={styles.imagePreview}>
                  {/* A user-selected Blob or trusted existing project URL. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.src} alt="Current project preview" />
                  <span>
                    {draft.width} × {draft.height}
                  </span>
                </div>
              )}
              <div className={styles.toggleRow}>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.featured}
                    onChange={(event) =>
                      updateDraft("featured", event.target.checked)
                    }
                  />
                  Feature on homepage
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
              <div className={styles.formActions}>
                <button type="submit" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : selectedId
                      ? "Save changes"
                      : "Create project"}
                </button>
                {selectedId && (
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={removeProject}
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
                <p className={styles.eyebrow}>CONTENT LIBRARY</p>
                <h2>{projects.length} projects</h2>
              </div>
              <button
                type="button"
                onClick={() => loadProjects()}
                disabled={busy}
              >
                Refresh
              </button>
            </div>
            <div className={styles.projectGrid}>
              {projects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  className={`${styles.projectCard} ${
                    project.id === selectedId ? styles.selectedCard : ""
                  }`}
                  onClick={() => editProject(project)}
                >
                  <span className={styles.cardImage}>
                    {project.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={project.src} alt="" />
                    ) : (
                      <span>VIDEO</span>
                    )}
                    <i>{project.published ? "LIVE" : "DRAFT"}</i>
                  </span>
                  <span className={styles.cardCopy}>
                    <strong>{project.titleEn}</strong>
                    <small>{project.descriptionEn}</small>
                    <em>
                      {project.area.replaceAll("-", " ")} ·{" "}
                      {project.displayOrder}
                    </em>
                  </span>
                </button>
              ))}
              {!projects.length && (
                <div className={styles.emptyState}>
                  <strong>No MongoDB projects yet.</strong>
                  <p>
                    Create the first one here. Existing site content remains
                    live.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      )}
      {activeSection === "images" && <DefaultImagesManager getCsrf={getCsrf} />}
      {activeSection === "hero" && <HeroManager getCsrf={getCsrf} />}
      {activeSection === "about" && <AboutManager getCsrf={getCsrf} />}
      {activeSection === "videos" && <VideoManager getCsrf={getCsrf} />}
      {activeSection === "reviews" && <ReviewManager getCsrf={getCsrf} />}
      {activeSection === "security" && (
        <SecurityPanel adminEmail={adminEmail} getCsrf={getCsrf} />
      )}
    </main>
  );
}
