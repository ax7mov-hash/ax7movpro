import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const acceptLanguage = (await headers()).get("accept-language") || "";
  redirect(acceptLanguage.toLowerCase().split(",").some((language) => language.trim().startsWith("fr")) ? "/fr" : "/en");
}
