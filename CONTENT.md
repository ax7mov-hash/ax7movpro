# Content replacement guide

The images in `public/media` are original development placeholders generated for AX7MOV. Replace each file with Athulkrishna's own work while keeping the same filename, or update `coverImage` in `lib/content.ts`.

- `midnight-velocity.png` — automotive hero and project covers
- `quiet-character.png` — portrait and About imagery
- `atelier-no-7.png` — personalised advertisement imagery
- `a-day-to-remember.png` — small event imagery

The hero currently uses a gently animated poster because no showreel file was supplied. When a WebM or MP4 showreel is ready, add it to `public/media` and replace the hero image layer in `components/HomePage.tsx` with a muted, looping `VideoPreview`.

Instagram cards intentionally contain no invented post links. Add real post URLs in Sanity's **Instagram selection** documents. Only published records with valid Instagram post URLs should load the Instagram embed script; always keep a fallback image and alternative text.

