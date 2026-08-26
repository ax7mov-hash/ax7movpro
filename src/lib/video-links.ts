export type VideoProvider = "youtube" | "instagram";

function parseHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function getYouTubeVideoId(value: string) {
  const url = parseHttpsUrl(value);
  if (!url) return null;
  const hostname = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id: string | null = null;
  if (hostname === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0];
  if (hostname === "youtube.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    if (/^\/(shorts|embed)\//.test(url.pathname)) {
      id = url.pathname.split("/").filter(Boolean)[1] || null;
    }
  }
  return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}

export function getVideoProvider(value: string): VideoProvider | null {
  if (getYouTubeVideoId(value)) return "youtube";
  const url = parseHttpsUrl(value);
  if (!url) return null;
  const hostname = url.hostname.replace(/^www\./, "");
  if (
    hostname === "instagram.com" &&
    /^\/(reel|p|tv)\/[A-Za-z0-9_-]+/.test(url.pathname)
  ) {
    return "instagram";
  }
  return null;
}
