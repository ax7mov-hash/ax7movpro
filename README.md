# AX7MOV portfolio

A bilingual, cinematic photography and videography portfolio for Athulkrishna. The public routes are `/en`, `/en/about`, `/en/gallery`, `/en/contact` and matching `/fr` routes. `/` redirects to English. `/en/studio` and `/fr/studio` explain and link to the protected Sanity administration area.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use `npm run lint` for code checks and `npm run build` for a production build.

## Environment

Copy `.env.example` to `.env.local`. The site runs without any CMS credentials by using strongly typed fallback content from `lib/content.ts`.

- `NEXT_PUBLIC_SITE_URL` — canonical production origin; defaults to `https://ax7mov.com`
- `NEXT_PUBLIC_SANITY_PROJECT_ID` — Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` — normally `production`
- `NEXT_PUBLIC_SANITY_API_VERSION` — pinned query API version
- `NEXT_PUBLIC_SANITY_STUDIO_URL` — the URL of the authenticated hosted Sanity Studio
- `SANITY_API_READ_TOKEN` — optional server-only token for private draft preview; never expose this in browser code

## Connect Sanity

1. Create a project at Sanity and deploy or host Sanity Studio.
2. Import `schemaTypes` from `sanity/schemaTypes.ts` into the Studio configuration's `schema.types` array.
3. Add the public project ID, dataset, API version and Studio URL to `.env.local` and to the deployment environment.
4. Add `https://ax7mov.com` and local development origins to Sanity CORS settings.

Sanity authentication protects the administration area. This website does not implement a custom password screen.

### Add or edit a project

Open the configured Sanity Studio, select **Project**, fill both English and French fields, upload a cover, set media type and order, then enable **Published**. If Sanity is not connected, edit `projects` in `lib/content.ts` instead.

### Add selected Instagram posts

Create an **Instagram selection** document and paste the real public post URL. Add a fallback image, caption, alternative text and display order, then publish it. Do not add a profile URL as a post. The page deliberately shows curated image placeholders until valid individual post URLs exist; it never embeds the full profile in an iframe.

## Replace images and video

See `CONTENT.md` for the asset checklist. Keep image dimensions generous and compressed, preserve the existing filenames where convenient, and add meaningful alternative text. The hero uses an animated poster until an AX7MOV showreel is supplied.

## Edit translations and contact details

English and French copy lives together in `lib/content.ts`, which makes page parity easy to review. Email, phone, WhatsApp message, production URL and Instagram link are centralised in `lib/config.ts`. Empty future social links are intentionally not rendered.

## Deploy to Vercel

1. Push the repository to GitHub, GitLab or Bitbucket.
2. Import it in Vercel and use the detected framework settings.
3. Add the variables from `.env.example` in Vercel project settings.
4. Deploy, test both locale trees, then assign `ax7mov.com` under **Settings → Domains**.
5. At the domain registrar, add the DNS records Vercel displays. Set `NEXT_PUBLIC_SITE_URL=https://ax7mov.com`, redeploy, and verify the canonical links and sitemap.

The supplied Sites/Vite preview configuration is used for the local Codex preview. If deploying strictly with standard Next.js on Vercel, migrate the app surface into a standard Next.js App Router project while preserving `app`, `components`, `lib`, `public` and `sanity`.

## SEO and accessibility

Every public page has language-specific metadata, canonical links, hreflang alternates, Open Graph/X data, semantic headings, keyboard focus states and reduced-motion handling. `app/sitemap.ts` and `app/robots.ts` generate discovery files. The gallery lightbox supports Escape, arrow keys, focus restoration and swipe gestures.
