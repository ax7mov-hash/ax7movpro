# AX7MOV portfolio

A bilingual, cinematic photography and filmmaking portfolio for Athulkrishna / AX7MOV. The site is built with Next.js App Router, TypeScript, Tailwind CSS, next-intl, GSAP, Lenis, and Sanity, and is ready for Vercel.

## Routes

Public pages are available in English and French:

- `/en` and `/fr` — home
- `/en/about` and `/fr/about` — biography, approach, and process
- `/en/gallery` and `/fr/gallery` — combined photo/video gallery with accessible lightbox
- `/en/contact` and `/fr/contact` — direct WhatsApp, email, phone, and Instagram actions
- `/studio` — setup guidance for the linked standalone Sanity Studio

The site redirects `/` to `/en`. Language switching preserves the current page.

## Local development

Requires a current LTS-compatible Node.js runtime and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. Other useful commands:

```bash
npm run format
npm run lint
npm run typecheck
npm run build
npm run start
```

## Secure admin and MongoDB Atlas

The `/ax7-vault-9k4m2` page manages portfolio projects, every bundled portfolio/showcase image, the homepage hero, external video cards, and client reviews stored in MongoDB Atlas. The old `/admin` route does not exist. The uncommon path reduces casual discovery but is not treated as an authorization control; every protected API still verifies the database-backed session. The console uploads public images and video thumbnails to Vercel Blob and lets the signed-in administrator change the account password. Each default-image replacement can be restored to its bundled fallback. Published reviews appear on the localized homepage. The built-in `/media/midnight-velocity.png` hero remains the automatic fallback whenever no managed hero is saved or Atlas is unavailable. MongoDB content is the first public-site source; if Atlas is unconfigured, unavailable, or empty, the existing Sanity/local content remains visible.

Admin image uploads accept JPG, PNG, WebP, and AVIF files up to 4 MB. Images are decoded server-side and limited to 40 megapixels and 8,000 px on either side. Portfolio/default images must be at least 640 × 400 px; hero images must be at least 1,200 × 600 px.

Selecting a new image in **Projects**, **Images**, or **Hero**, or choosing **Edit current image**, opens the shared editor. It supports original, square, portrait, and wide crops; crop-aware output width and height; image-based, 1280px, and 1920px resolution presets; 90° rotation; zoom and crop positioning; brightness, contrast, and saturation adjustments; reset; and an unedited-upload option. Edited files are exported at the selected resolution as compressed WebP images before the same server-side limits are applied. Project and bundled-photo editors also save bilingual card names and descriptions with the image.

The **Videos** section creates homepage and gallery cards from validated YouTube or Instagram links and an uploaded thumbnail. Administrators can choose 9:16 reel or 16:9 widescreen presentation, ordering and placement, published state, autoplay, and loop. YouTube cards use an inline privacy-enhanced player with native play, pause, volume, timeline, and fullscreen controls; muted autoplay honors reduced-motion preferences and can loop. Instagram cards retain the uploaded thumbnail and open the original Instagram link because Instagram controls embed playback.

1. Copy `.env.example` to `.env.local`.
2. Create an Atlas database user with read/write access only to the configured database. Keep Atlas TLS enabled and restrict network access to the deployment environment.
3. Connect a public Vercel Blob store to the project. For the recommended OIDC
   connection, run `vercel env pull` locally and provide both
   `VERCEL_OIDC_TOKEN` and `BLOB_STORE_ID`. A legacy
   `BLOB_READ_WRITE_TOKEN` remains supported as an alternative.
4. Set `ADMIN_EMAIL` and the bootstrap-only `ADMIN_TEMP_PASSWORD`. The provided temporary value is `Admin@123456`. On the first successful login, the app creates the primary admin user in MongoDB and requires an immediate password change before any content API can be used.
5. Generate the JWT secret with `openssl rand -base64 64`, set the exact `SITE_ORIGIN`, restart the app, and visit `/ax7-vault-9k4m2`.

Before login or password change, the browser derives a 256-bit password proof with PBKDF2-SHA-256 (600,000 iterations) and sends only that proof. The server protects the proof again with bcrypt cost 12 before storing it in the `adminUsers` collection. The proof is still a password-equivalent credential, so production must use HTTPS.

Admin sessions are short-lived signed JWTs in HttpOnly, Secure, SameSite=Strict cookies and are backed by revocable MongoDB session records. Mutations also require same-origin and CSRF checks. Login attempts are rate-limited, uploads are size/type/signature checked, and admin actions are recorded in a 90-day audit log. Never commit `.env.local`, Atlas credentials, Blob or OIDC credentials, temporary passwords, stored hashes, or JWT secrets.

MongoDB stores the primary admin's email, role, bcrypt-protected password proof, active status, forced-change state, and account timestamps. Changing the password revokes every other active admin session while keeping the current session open. For account recovery, remove the `primary` record from the `adminUsers` collection; the next successful login with `ADMIN_EMAIL` and `ADMIN_TEMP_PASSWORD` recreates it and forces another password change.

## Sanity setup

The public site always has typed local fallback content, so it works without credentials. To connect a real Sanity dataset:

1. Create a Sanity project at [sanity.io/manage](https://www.sanity.io/manage).
2. Create a `production` dataset (or choose another dataset name).
3. Copy `.env.example` to `.env.local`.
4. Add the project ID and dataset:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

`SANITY_API_READ_TOKEN` is reserved for a future private dataset workflow. It is not needed for a public read-only dataset and is never exposed in browser code.

Restart the development server, then run `npm run studio` and open the local URL printed by Sanity (normally port 3333). The `/studio` route provides the same setup reminder without bundling authoring tools into the public Vercel runtime. Add the Studio URL, `http://localhost:3000`, and the production domain as CORS origins in Sanity project settings if prompted. Authentication and write access remain managed by Sanity.

### Add a portfolio project

1. Run `npm run studio`, open the printed Studio URL, and select **Project**.
2. Add the English and French titles, descriptions, and alt text.
3. Select photo or video, upload a cover image, and optionally add gallery images, a preview video, and a poster.
4. Choose the creative area, set the display order, and enable **Featured** when appropriate.
5. Publish the document.

When the CMS is configured, published projects replace local fallback cards. If the dataset is unavailable or empty, the supplied local portfolio remains visible.

### Update the Instagram showcase

1. Open the standalone Studio and select **Instagram showcase entry**.
2. Upload an image, add natural English and French captions, and paste the post URL.
3. Set the display order, enable **Published**, and publish.

This is a manually maintained showcase. It does not scrape Instagram, embed a full feed, or require an Instagram token.

### Site settings

The **Site settings** schema supports biography, contact details, social links, localized WhatsApp messages, a default SEO image, and availability. Local contact constants live in `src/lib/media.ts`; connect those settings to the frontend when real owner-managed settings should override the verified defaults.

## Content and media

Typed fallback media is centralized in `src/lib/media.ts`. MongoDB/Sanity-backed fetching and graceful fallback behavior live in `src/lib/content.ts`.

Source photographs remain unchanged in the repository-level `photos` folder. The script below creates resized, metadata-free delivery copies in `public/media`:

```bash
node scripts/prepare-media.mjs
```

The full source inventory and classification are in `docs/media-inventory.md`.

Current limitations:

- No video footage is bundled with the repository. Add real YouTube or Instagram content and thumbnails through **Admin → Videos**; the public site does not display empty demo cards.
- No portrait or behind-the-scenes image was supplied. The About page uses original code-native aperture/viewfinder artwork rather than misclassifying an automotive image.
- The supplied photographs represent automotive work only. Portrait, personalised-ad, and small-event photography should be added through Sanity as those assets become available.

## SEO

The site includes localized metadata, canonical URLs, language alternates, Open Graph and X cards, JSON-LD, `sitemap.xml`, `robots.txt`, a web manifest, and the AX7 favicon. `public/og.png` is the dedicated 1200 × 630 social card.

## Deploy to Vercel

1. Push the repository to your Git provider.
2. Import the project into Vercel.
3. Set the Vercel **Root Directory** to `web` if deploying from the repository root.
4. Add the MongoDB, Blob, admin-auth, and optional Sanity environment variables for Production, Preview, and Development. Use separate preview credentials when possible.
5. Keep the standard Next.js build command (`npm run build`) and output settings.
6. Deploy, then add `https://ax7mov.com` as a Sanity CORS origin.
7. Connect `ax7mov.com` only after the Vercel project has been reviewed and approved.

No deployment, domain purchase, external account connection, or paid service creation is performed by this repository.
