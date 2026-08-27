import type { Metadata } from "next";
import { AdminApp } from "../admin/admin-app";
import { getAdminSession } from "@/lib/server/admin-auth";
import { isAdminConfigured } from "@/lib/server/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Content Console — AX7MOV",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPage() {
  const session = await getAdminSession();
  return (
    <AdminApp
      initialAdminEmail={session?.email || ""}
      initialAuthenticated={Boolean(session)}
      initialConfigured={isAdminConfigured()}
      initialPasswordChangeRequired={session?.mustChangePassword ?? false}
    />
  );
}
