"use client";

import { useLocale, useTranslations } from "next-intl";
import { contact } from "@/lib/media";
import { WhatsAppIcon } from "./icons";

export function WhatsAppButton() {
  const locale = useLocale() as "en" | "fr";
  const t = useTranslations("Footer");
  return (
    <a
      className="floating-whatsapp"
      href={contact.whatsapp[locale]}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsappLabel")}
    >
      <WhatsAppIcon />
      <span>{t("whatsappTooltip")}</span>
    </a>
  );
}
