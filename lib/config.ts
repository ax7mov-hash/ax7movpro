export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ax7mov.com";
export const EMAIL = "athulkrishnans@gmail.com";
export const PHONE_DISPLAY = "+91 73564 48023";
export const PHONE_TEL = "+917356448023";
export const INSTAGRAM = "https://www.instagram.com/ax7.mov?igsh=ZDRja3FhOGd4NTQ3";
export const WHATSAPP_MESSAGE = "Hello, I found your portfolio and would like to discuss a photography or videography project.";
export const WHATSAPP_URL = `https://wa.me/917356448023?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export const isLocale = (value: string): value is "en" | "fr" => value === "en" || value === "fr";

