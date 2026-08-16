import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/HomePage";
import { isLocale } from "@/lib/config";
import { pageMetadata } from "@/lib/metadata";
import { getProjects } from "@/lib/sanity";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; return isLocale(locale) ? pageMetadata(locale, "home") : {}; }
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <HomePage locale={locale} projects={await getProjects()} />; }
