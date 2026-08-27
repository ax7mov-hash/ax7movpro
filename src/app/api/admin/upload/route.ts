import { randomUUID } from "node:crypto";
import {
  BlobAccessError,
  BlobError,
  BlobStoreNotFoundError,
  put,
} from "@vercel/blob";
import sharp from "sharp";
import {
  guardAdminRequest,
  jsonNoStore,
  writeAuditEvent,
} from "@/lib/server/admin-security";
import { isBlobConfigured } from "@/lib/server/env";

const maximumUploadBytes = 10 * 1024 * 1024;
const maximumImagePixels = 40_000_000;
const maximumImageDimension = 8_000;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

function hasValidSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (type === "image/png")
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  if (type === "image/webp")
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  if (type === "image/avif")
    return (
      String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" &&
      /avi[fs]/.test(String.fromCharCode(...bytes.slice(8, 64)))
    );
  return false;
}

export async function POST(request: Request) {
  const guard = await guardAdminRequest(request, true);
  if ("response" in guard) return guard.response;
  if (!isBlobConfigured()) {
    return jsonNoStore(
      {
        error:
          "Image storage is not configured. Connect the Blob store and refresh the Vercel environment values.",
      },
      503,
    );
  }
  try {
    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > maximumUploadBytes + 200_000) {
      return jsonNoStore({ error: "Image must be 10 MB or smaller." }, 413);
    }
    const formData = await request.formData();
    const file = formData.get("file");
    const requestedPurpose = formData.get("purpose");
    const purpose =
      requestedPurpose === "hero"
        ? "hero"
        : requestedPurpose === "about"
          ? "about"
          : requestedPurpose === "video-thumbnail"
            ? "video-thumbnails"
            : requestedPurpose === "default"
              ? "defaults"
              : "portfolio";
    if (!(file instanceof File)) {
      return jsonNoStore({ error: "Choose an image to upload." }, 400);
    }
    const extension = allowedTypes.get(file.type);
    if (!extension || file.size > maximumUploadBytes || file.size < 64) {
      return jsonNoStore(
        { error: "Use a JPG, PNG, WebP, or AVIF image up to 10 MB." },
        400,
      );
    }
    const signature = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (!hasValidSignature(signature, file.type)) {
      return jsonNoStore(
        { error: "The file content is not a valid image." },
        400,
      );
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    let width: number;
    let height: number;
    try {
      const metadata = await sharp(bytes, {
        failOn: "error",
        limitInputPixels: maximumImagePixels,
      }).metadata();
      if (!metadata.width || !metadata.height) throw new Error("NO_DIMENSIONS");
      const expectedFormat =
        file.type === "image/avif"
          ? "heif"
          : file.type === "image/jpeg"
            ? "jpeg"
            : extension;
      if (metadata.format !== expectedFormat)
        throw new Error("FORMAT_MISMATCH");
      width = metadata.width;
      height = metadata.height;
    } catch {
      return jsonNoStore(
        { error: "The image is invalid or exceeds the 40-megapixel limit." },
        400,
      );
    }
    const minimumWidth = purpose === "hero" ? 1_200 : 640;
    const minimumHeight = purpose === "hero" ? 600 : 400;
    if (
      width < minimumWidth ||
      height < minimumHeight ||
      width > maximumImageDimension ||
      height > maximumImageDimension
    ) {
      return jsonNoStore(
        {
          error: `Use an image between ${minimumWidth} × ${minimumHeight}px and 8,000 × 8,000px.`,
        },
        400,
      );
    }
    const blob = await put(`${purpose}/${randomUUID()}.${extension}`, bytes, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });
    await writeAuditEvent(request, "image.upload", blob.pathname, {
      size: file.size,
      type: file.type,
      purpose,
      width,
      height,
    });
    return jsonNoStore(
      { url: blob.url, pathname: blob.pathname, width, height },
      201,
    );
  } catch (error) {
    if (
      error instanceof BlobError &&
      error.message.includes('not for the "development" environment')
    ) {
      return jsonNoStore(
        {
          error:
            "Vercel Blob is not enabled for the Development environment. Update the store connection in Vercel, then refresh the local environment values.",
        },
        503,
      );
    }
    if (
      error instanceof BlobAccessError ||
      error instanceof BlobStoreNotFoundError
    ) {
      return jsonNoStore(
        {
          error:
            "Vercel Blob authentication failed. Reconnect the Blob store and refresh the environment values.",
        },
        503,
      );
    }
    return jsonNoStore({ error: "Unable to upload image." }, 500);
  }
}
