# AX7MOV

AX7MOV is a multilingual portfolio and film showcase built with Next.js. Public content is served in English and French, while projects, homepage media, and videos can be managed from a protected admin console.

## Stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- MongoDB for admin accounts, sessions, projects, and managed media
- Vercel Blob for uploaded images and videos
- Tailwind CSS 4

## Routes

| Route                        | Purpose                 |
| ---------------------------- | ----------------------- |
| `/`                          | Redirects to `/en`      |
| `/en`, `/fr`                 | Localized homepage      |
| `/en/about`, `/fr/about`     | About page              |
| `/en/gallery`, `/fr/gallery` | Project gallery         |
| `/en/contact`, `/fr/contact` | Contact page            |
| `/ax7-vault-9k4m2`           | Protected admin console |

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Configure MongoDB, Vercel Blob, and the admin secrets described below.

4. Start the app:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) for the public site or [http://localhost:3000/ax7-vault-9k4m2](http://localhost:3000/ax7-vault-9k4m2) for the admin console.

## Environment variables

| Variable                | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `MONGODB_URI`           | MongoDB connection string                                                 |
| `MONGODB_DB_NAME`       | Database name; defaults to `ax7mov`                                       |
| `ADMIN_EMAIL`           | Email address for the primary admin                                       |
| `ADMIN_TEMP_PASSWORD`   | Plain-text bootstrap and recovery password; the default is `Admin@123456` |
| `JWT_SECRET`            | Long random secret used to sign admin session tokens                      |
| `ADMIN_SESSION_HOURS`   | Session lifetime; defaults to `8` hours                                   |
| `SITE_ORIGIN`           | Canonical site origin used for security checks and metadata               |
| `VERCEL_OIDC_TOKEN`     | Recommended Vercel authentication for Blob uploads                        |
| `BLOB_STORE_ID`         | Optional explicit Vercel Blob store identifier                            |
| `BLOB_READ_WRITE_TOKEN` | Optional Blob token when OIDC is not used                                 |

Do not commit `.env.local`. In production, replace the example `JWT_SECRET`, keep the bootstrap password private, and complete the required first-login password change immediately.

## Admin authentication

The admin account is stored in MongoDB rather than in environment variables. The environment only contains the temporary bootstrap password used to create or recover the primary account.

The sign-in flow works as follows:

1. The browser converts the entered password into a PBKDF2-SHA-256 proof using 600,000 iterations before sending it over HTTPS.
2. On the first successful sign-in, the server validates the proof of `ADMIN_TEMP_PASSWORD`, creates the primary admin in the `adminUsers` collection, and starts a restricted session.
3. The admin must set a new password before any protected content API can be used.
4. The server stores the new credential as a bcrypt hash with cost 12. The plain-text password is never stored in MongoDB.
5. Normal sign-ins create a signed JWT backed by a MongoDB session. Sessions are protected with CSRF validation, expiry, IP and user-agent checks, rate limiting, and audit logging.
6. Changing the password revokes other active sessions.

Client-side password derivation does not replace HTTPS; production deployments must still use TLS.

### Account recovery

If the primary admin password is lost, delete that admin record from the `adminUsers` collection. The next valid sign-in with `ADMIN_EMAIL` and `ADMIN_TEMP_PASSWORD` recreates the primary account and requires another password change.

The uncommon admin URL reduces casual discovery, but the application relies on authentication and server-side authorization for security.

## Admin features

The admin console manages:

- Portfolio projects, descriptions, credits, status, year, and cover images
- Homepage hero images
- Homepage Instagram-style showcase images and videos
- Video URLs and uploaded video files
- Account password changes and session security

### Image uploads

- Accepted formats: JPEG, PNG, WebP, and AVIF
- Maximum file size: **10 MB**
- Maximum source dimensions: 40 megapixels and 8,000 pixels on either side
- Minimum portfolio image size: 640 × 400 pixels
- Minimum homepage hero size: 1,200 × 600 pixels

The built-in image editor supports crop, rotate, flip, zoom, and quality adjustment. Upload validation is enforced on both the client and server.

### Loading experience

A branded full-screen loading screen appears during route transitions and initial page loads. The admin console also shows it while fetching, saving, deleting, uploading, or processing media. Loading status is announced accessibly and respects reduced-motion preferences.

## Content sources

Public pages use published MongoDB records when MongoDB is configured and available. Typed local content keeps the portfolio available when the database is unavailable or has no managed content.

## Useful commands

| Command                | Purpose                      |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start the development server |
| `npm run build`        | Create a production build    |
| `npm run start`        | Start the production server  |
| `npm run lint`         | Run ESLint                   |
| `npm run typecheck`    | Run TypeScript checks        |
| `npm run format`       | Format supported files       |
| `npm run format:check` | Check formatting             |

## Deployment

For a Vercel deployment:

1. Add every required environment variable to the project.
2. Allow the deployment to access MongoDB.
3. Connect a Vercel Blob store and configure OIDC or a Blob token.
4. Set `SITE_ORIGIN` to the production HTTPS origin.
5. Deploy, sign in with the temporary password, and immediately choose the permanent admin password.

Before release, run:

```bash
npm run typecheck
npm run lint
npm run build
```

## SEO and accessibility

The app includes localized metadata, canonical and alternate-language URLs, Open Graph and Twitter metadata, JSON-LD, `robots.txt`, and a generated sitemap. Interactive controls, forms, dialogs, and loading states include keyboard and screen-reader support.
