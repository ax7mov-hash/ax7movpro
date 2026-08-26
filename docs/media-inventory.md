# Supplied media inventory

Inventory recorded before implementation. All original files remain unchanged in the repository-level `photos` folder. Public delivery copies are resized and stripped of EXIF metadata.

| Source file             |  Dimensions | Orientation    | Aspect ratio | Source size | Visual content                                                     | Classification / use                                                 |
| ----------------------- | ----------: | -------------- | -----------: | ----------: | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `IMG_4511.JPG`          | 2733 × 3644 | Portrait       |        0.750 | 4,246,152 B | Front view of a black Mercedes with illuminated headlights         | Automotive; featured work and gallery                                |
| `IMG_4007.JPG`          | 1701 × 3024 | Portrait       |        0.563 | 2,056,051 B | Tight black Audi front/headlight detail with warm background light | Automotive; featured work and Instagram showcase                     |
| `IMG_3964.JPG`          | 1686 × 2997 | Portrait       |        0.563 | 2,055,458 B | Symmetrical front portrait of a black Audi over fallen leaves      | Automotive; featured work and gallery                                |
| `IMG_1541.JPG`          | 2268 × 4032 | Portrait       |        0.563 | 1,581,099 B | Bright green modified sedan in three-quarter profile               | Automotive; featured work and Instagram showcase                     |
| `IMG_1754.JPG`          | 3213 × 5712 | Portrait       |        0.563 | 9,279,513 B | Bright green sedan beneath a dense tree canopy in a tilted frame   | Automotive; gallery. Unusually large source file                     |
| `IMG_3403.JPG`          | 2268 × 4032 | Portrait       |        0.563 | 6,925,108 B | Turquoise older sedan in rain beneath leafy trees                  | Automotive; gallery and Instagram showcase. Large source file        |
| `midnight-velocity.png` |  1829 × 860 | Wide landscape |        2.127 | 1,842,830 B | Dark sports car on a rain-lit city boulevard at night              | Automotive / cinematic editorial; strongest wide image and home hero |

## Findings

- Supported and readable: 7 of 7 files.
- Corrupted files: none.
- Exact duplicate files: none (verified by SHA-256).
- Unsupported formats: none.
- Categories reasonably represented: Automotive; general cinematic/editorial through the wide hero image.
- Categories not represented: Personalised ads, portraits, small events, and behind-the-scenes.
- Because no portrait or behind-the-scenes image exists, the About page uses code-native brand artwork and clearly avoids inventing or misclassifying content.
- Because no videos exist, video projects render as labeled motion placeholders rather than pretending a still image is playable footage.

## Optimized delivery files

`scripts/prepare-media.mjs` creates the following non-destructive public copies: `mercedes-front.jpg`, `audi-detail.jpg`, `audi-front.jpg`, `skoda-profile.jpg`, `skoda-angle.jpg`, and `honda-rain.jpg`. JPEG copies are capped at 2400 px on the longest edge, keep their source aspect ratios, and omit EXIF/camera/GPS metadata. The supplied PNG hero is copied without modification and delivered responsively through `next/image`.
