import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const destination = path.resolve(process.cwd(), "public/media");

const files = [
  ["IMG_4511.JPG", "mercedes-front.jpg"],
  ["IMG_4007.JPG", "audi-detail.jpg"],
  ["IMG_3964.JPG", "audi-front.jpg"],
  ["IMG_1541.JPG", "skoda-profile.jpg"],
  ["IMG_1754.JPG", "skoda-angle.jpg"],
  ["IMG_3403.JPG", "honda-rain.jpg"],
];

await mkdir(destination, { recursive: true });

for (const [source, output] of files) {
  await sharp(path.join(root, "photos", source))
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(destination, output));
}

console.log(
  `Prepared ${files.length} optimized, metadata-free portfolio images.`,
);
