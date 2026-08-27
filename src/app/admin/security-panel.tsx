"use client";

import { useState } from "react";
import { createPasswordProof } from "@/lib/admin-password";
import styles from "./admin.module.css";

export function SecurityPanel({
  adminEmail,
  forced = false,
  getCsrf,
  onPasswordChanged,
}: {
  adminEmail: string;
  forced?: boolean;
  getCsrf: () => Promise<string>;
  onPasswordChanged?: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (
      newPassword.length < 12 ||
      !/[a-z]/.test(newPassword) ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      setError(
        "Use at least 12 characters with uppercase, lowercase, a number, and a symbol.",
      );
      return;
    }
    if (currentPassword === newPassword) {
      setError("Choose a password you have not just used.");
      return;
    }
    setBusy(true);
    try {
      const token = await getCsrf();
      const [currentPasswordProof, newPasswordProof] = await Promise.all([
        createPasswordProof(adminEmail, currentPassword),
        createPasswordProof(adminEmail, newPassword),
      ]);
      const response = await fetch("/api/admin/password", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ currentPasswordProof, newPasswordProof }),
      });
      const data = (await response.json()) as {
        error?: string;
        revokedSessions?: number;
      };
      if (!response.ok)
        throw new Error(data.error || "Unable to change password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(
        `Password changed. ${data.revokedSessions || 0} other active session${
          data.revokedSessions === 1 ? " was" : "s were"
        } signed out.`,
      );
      onPasswordChanged?.();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to change password.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.securityPage}>
      <div className={styles.securityCard}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>ACCOUNT SECURITY</p>
            <h1>{forced ? "Replace temporary password" : "Change password"}</h1>
          </div>
        </div>
        <p className={styles.securityIntro}>
          {forced
            ? "Before using the console, replace the temporary password with a unique password that only you know."
            : "Confirm the current password, then choose a unique replacement. Other admin sessions will be signed out automatically."}
        </p>
        {(error || message) && (
          <div className={error ? styles.error : styles.success} role="status">
            {error || message}
          </div>
        )}
        <form onSubmit={changePassword} className={styles.editorForm}>
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              minLength={12}
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={12}
              maxLength={128}
              required
            />
            <span className={styles.fieldHint}>
              At least 12 characters with uppercase, lowercase, a number, and a
              symbol.
            </span>
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <div className={styles.formActions}>
            <button type="submit" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
