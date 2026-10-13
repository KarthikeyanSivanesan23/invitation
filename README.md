# A Lifetime of Us

A complete English/Tamil wedding invitation for **Karthikeyan & [Bride Name]**. Designed as a quiet, ivory-and-burgundy editorial invitation that unfolds into a procedural 3D South Indian temple journey.

## Run locally

Use **Node.js 22.18+ or 24 LTS** and npm. Node's built-in TypeScript stripping is used by the production metadata generator.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

```sh
npm run typecheck   # Strict TypeScript
npm test           # Calendar, IST countdown, translations and RSVP tests
npm run build      # TypeScript + optimized Vite build + generated SEO
npm run preview    # Serve the production build
npm run check      # Typecheck, unit tests, production build
npm run preview:image # Regenerate the social-preview JPG (requires Chrome)
npm run preview:temples # Render detailed temple/mandapam fallback posters (requires Chrome)
npm run admin:setup   # One-time Supabase setup for the photo editor (requires .env)
```

### Browser validation

```sh
npx playwright install chrome
npx playwright test
```

The suite uses installed Google Chrome, starts Vite on port 4173, and covers the card opening, reverse scrolling, every major section, five viewport widths (320, 390, 768, 1024, 1920), reduced motion, Tamil navigation, form validation, local persistence, lightbox keyboard navigation, downloads, placeholder actions and WCAG A/AA checks with axe-core. Screenshots and traces are test artifacts. To use Playwright's bundled Chromium instead, remove `channel: 'chrome'` from `playwright.config.ts` and run `npx playwright install chromium`.

Validated locally: **strict TypeScript, 31 unit tests, the production build, and 12 browser tests passed**. The axe-core WCAG A/AA scan reported zero violations. Browser tests also verified the admin editor's upload-and-crop flow in browser-only mode, the detailed temple's aerial/approach/entrance/night views and phone rendering, unavailable-WebGL fallbacks, mute/stop behavior, native Back/Forward, the album wall navigation flow, and that reduced-motion visits do not request Three.js chunks. Set `TEST_PRODUCTION=1` when running Playwright to test the built `dist` output instead of the development server; build first.

## Make it your invitation

**All personal content is in `src/data/wedding.ts`.** Interface translations are in `src/data/translations.ts`. Components do not need to be edited.

1. Replace the bracketed placeholders for the couple, parents, date, address, venue, hosts and contact information.
2. Update both `en` and `ta` strings. Names, introductions, story milestones, gallery captions and event details all support both languages.
3. Set `dateISO` with the explicit IST offset, for example:

   ```ts
   date: text('14 February 2027', '14 பிப்ரவரி 2027'),
   dateISO: '2027-02-14T09:00:00+05:30',
   endISO: '2027-02-14T11:00:00+05:30',
   ```

   This is an example, not an assigned wedding date. The starter deliberately leaves the machine-readable date blank. It shows an elegant “date coming soon” state instead of inventing a countdown.

4. Give each enabled event its own `startISO` and `endISO`. The Muhurtham event inherits the main date when its dates are blank. A missing/invalid end time defaults to two hours after the start.
5. Turn event cards on or off with `enabled`. Edit their displayed dates/times, dress code, descriptions, venues and Maps links independently.
6. Set `venue.mapsUrl` and each event's `mapsUrl` to a complete HTTPS Google Maps link. The venue QR code is generated locally only when a valid URL exists.
7. Set `whatsappNumber` to your receiving number in international format, such as `919876543210`. Until a valid number is configured, RSVP saves locally and explains that the contact is coming soon.
8. Set `siteUrl` to your actual deployment origin, e.g. `https://your-name.vercel.app`. The production build generates the canonical URL, absolute Open Graph URLs, sitemap, robots file and structured data from this value.
9. Optionally fill `instagram` and `liveStreamUrl`; empty optional links are not rendered.
10. Add your photographs, soundtrack or 3D models as described in [PUBLIC_ASSETS.md](./PUBLIC_ASSETS.md). **Rebuild and redeploy after editing content or assets.**
11. Instead of rebuilding for photo changes, use the built-in **photo editor** at `/#admin` to upload/crop/reorder couple portraits and the gallery. Without cloud setup it previews in your browser; with a free Supabase project (below) a single **Save & publish** updates the site for every visitor.

## Photo editor (`/#admin`)

Open `https://your-site/#admin` (add `/#admin` to the local URL too). Click **Enter editor**, then choose **Couple photos** or **Gallery**.

- Add a photo with the **+** button, position it by dragging, zoom with the slider/scroll, rotate and flip, then **Apply edits**.
- Edit English and Tamil captions, reorder photos with the arrows, and delete any photo.
- Couple portraits default to the elegant initials placeholders until you upload real ones.
- **Save & publish** stores your changes. Every edit previews within the same browser immediately; refresh never loses your work (drafts are autosaved locally).

The editor works in **two modes**, chosen automatically:

- **Browser-only preview** — no configuration. Photos are stored on the device; only that browser sees them. A banner explains this. In a cloud build, the login screen offers **"Continue in this-browser preview instead"** for the same experience (uploads then embed as data URLs instead of touching storage).
- **Cloud (Supabase)** — photos + overrides are stored online, so every visitor sees the published invitation. Recommended.

### Connect Supabase (once, ~5 minutes)

1. Create a free project at <https://supabase.com>. Open **Project Settings → API** and copy the URL and the **anon** key.
2. Copy `.env.example` to `.env` and fill in those two values, plus the `service_role` key and an admin `ADMIN_EMAIL`/`ADMIN_PASSWORD` you'd like for unlocking the editor.
3. In the Supabase Dashboard, open **SQL Editor**, paste the contents of `supabase/schema.sql` and press Run (creates the `content_overrides` table + storage buckets + permissions).
4. Run `npm install` then `npm run admin:setup`. It verifies the connection, creates the `couple`/`gallery` buckets and your admin login, and prints the state of each step.
5. Unlock the editor at `/#admin` with that email and password.
6. Before deploying, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting environment (Vercel → Project Settings → Environment Variables). These two are public-style keys safe for the bundle; the service role key stays in `.env` only.

Security: visitors can read published overrides and photos, but **writing is protected by Supabase Row Level Security** — only your authenticated admin account can publish. `ADMIN_EMAIL`/`ADMIN_PASSWORD` are stored in Supabase Auth, never in the website bundle. This protects the content editor; it is not a general user system, so rate limiting/moderating submissions is out of scope.

## Wedding albums (`/albums`)

A full album section sits beside the invitation: an album wall at `/albums`, one cinematic story page per album at `/albums/:slug`, and an editor in the admin panel (sidebar → **Wedding Albums**).

- **Album wall** — every *published* album as a card (cover photo, occasion, photo count, date). Cards open the story page in-app.
- **Story pages** — a 3D cover you open, then a scroll-choreographed story: lead/full/split/duo/film-strip/quote blocks built from the album's layout (cinematic story, 3D photo book, editorial grid, masonry, horizontal film strip, double-exposure), plus five colour themes. Each photo supports a non-destructive CSS effect: cinematic, black-and-white, sepia, gold glow, soft bloom, film grain, parallax depth, polaroid, vintage film and structured double exposure (overlay photo, blend, offsets, opacity, gradient, grain).
- **Lightbox** — zoom (1–3×), pan, swipe, keyboard arrows/Esc, thumbnail strip, share/copy link and optional download per album.
- **Editor** (`/#admin` → Wedding Albums) — create albums (bilingual titles, slug, occasion, date, theme, layout, draft/published, download permission), then upload photographs which are resized to three WebP sizes (2400/1400/480) and stored in the `albums` bucket. Drag the tiles to reorder, multi-select for bulk publish/hide/delete, set a cover, and edit each photo's caption/story/effect in a live inspector that renders the same effect layers the visitors see. Drafts are never shown publicly.
- **Storage** — albums live only in Supabase (tables `albums` + `album_photos`, RLS: anonymous visitors read *published* albums and their photos; the authenticated admin manages everything). The **preview mode** escape hatch still applies: in a browser-only session the album section shows a note asking you to lock and sign in rather than falling back to fake data.

Setup for albums: run `supabase/migrations/0001_albums.sql` in the Supabase SQL Editor (once), then `npm run admin:setup` which also verifies the `albums` bucket and table. The photo upload pipeline authenticates with your admin session over XHR so you get real byte-progress and cancellation.

## The experience

- **Opening:** a bounded, font/scene-aware loading screen; a floating, textured 3D invitation with gold ornaments and hinged cover; inner-page reveal; a warm portal transition. The simple mode uses an equivalent CSS-depth card.
- **Journey:** GSAP ScrollTrigger updates a progress ref. A Catmull–Rom camera path and frame-rate-independent smoothing bring the visitor down the lamp-lined approach, through the gopuram and toward the mandapam. Reverse scrolling follows the same path in reverse. Native scrolling is never hijacked.
- **Detailed temple:** eight tapered gopuram tiers with sculpted niches, layered stone cornices, copper roof detail and brass kalasams; weathered sandstone/granite bump textures; a red-and-ivory pillared colonnade with individually instanced roof tiles; jasmine/rose garlands and hanging bells. Curved palm fronds, banana leaves, lotus ponds, marigold beds, stone paving and kolam patterns complete the approach. Shared materials, instancing and a one-frame procedural reflection environment retain the lightweight asset footprint.
- **Story:** real portrait slots with initials fallbacks, the couple's introductions, a five-chapter alternating timeline, and six configurable event cards.
- **Celebration:** flower canopy, instanced garlands and lamps, decorative layered fire geometry and animated firelight, a live IST-safe countdown, venue illustration/photo, directions, address copying and local QR generation.
- **Guest features:** a lazy-image gallery (admin-editable photos) with modal focus management, arrow-key navigation and touch swipes; RSVP with validation and WhatsApp handoff; a personal blessing wall; native share/WhatsApp/copy link, downloadable PNG invitation and Google Calendar links.
- **Closing:** a slow, scroll-driven aerial retreat from the lamp-lit temple beneath a starry sky.
- **Navigation:** real hash anchors preserve browser Back/Forward behavior. Mobile has a keyboard-accessible menu dialog. A gold thread indicates document scroll progress.

## RSVP and blessings: first-version storage

`src/services/invitationRepository.ts` implements the typed `InvitationRepository` interface:

```ts
saveRSVP(input): Promise<RSVPResponse>
getRSVP(): Promise<RSVPResponse | null>
listBlessings(): Promise<Blessing[]>
addBlessing(input): Promise<Blessing>
```

The supplied adapter uses `localStorage`. **These are device-local records, not shared submissions.** The page explains this next to both forms. A valid RSVP is saved and opens WhatsApp with the configured recipient and a fully encoded confirmation; the visitor still taps Send in WhatsApp. An explicit WhatsApp link remains available if popups are blocked. Storage failures are reported without losing the ability to send a valid RSVP.

To add Supabase, implement the same interface and pass the repository to `RSVPForm` and `BlessingWall` (or replace the exported adapter). Add server-side validation, table policies, moderation and rate limiting appropriate to your deployment. Keep service-role/secret keys on a server; do not put them in client code or `VITE_*` variables. No backend or fake API is included.

Blessings are rendered as React text, never injected HTML. The local wall retains at most 100 messages. Corrupted local records are ignored safely. Storage keys: `wedding-rsvp-v1`, `wedding-blessings-v1`, `wedding-language`; mute preference uses session key `wedding-muted`.

## Sound

There is no audio before a visitor gesture. Opening the card starts the optional `/audio/wedding-instrumental.mp3` and a single bell-inspired tone, respecting the stored mute setting. Without the MP3, a gentle **original Web Audio pentatonic ambient score** provides a functional fallback without downloading a track. This is synthesized atmosphere, not a recording of traditional wedding music. Controls provide play/mute, volume and stop; background tabs pause audio. Unsupported audio APIs leave the invitation fully usable.

## Deploy on Vercel

1. Push this project to your own Git repository.
2. Import it into Vercel and select **Vite**.
3. Choose **Node.js 24.x** (or Node 22.18+).
4. Build command: `npm run build`. Output directory: `dist`.
5. **Optional:** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` so the photo editor publishes for every visitor (see the photo editor section). Without them the invitation is fully static and complete.
6. Set `wedding.siteUrl` to the deployment/custom domain and redeploy.

`vercel.json` supplies the build settings, immutable caching for fingerprinted bundles and lightweight response headers, plus a clean-path SPA rewrite so `/albums` (and any direct link to `/albums/<slug>`) serves `index.html`. Any static host that serves the `dist` directory also works; for directories on plain hosts add the equivalent rewrite. `/albums` is also listed in the generated `sitemap.xml`.

## Project tree

```text
Invitation/
├── index.html
├── package.json / package-lock.json
├── vite.config.ts                 # React, Tailwind, optional-asset manifest, lazy chunks
├── vercel.json
├── tsconfig*.json
├── vitest.config.ts / playwright.config.ts
├── .env.example                  # Copy to .env for Supabase publishing
├── supabase/
│   ├── schema.sql              # Table + storage policies for the photo editor
│   └── migrations/0001_albums.sql # Albums tables, RLS and storage bucket
├── README.md / PUBLIC_ASSETS.md
├── scripts/
│   ├── generate-seo.mjs
│   ├── generate-preview.mjs
│   ├── generate-temple-posters.mjs
│   └── setup-supabase.mjs        # One-time admin/bucket setup
├── public/
│   ├── favicon.svg / robots.txt / sitemap.xml
│   ├── images/                    # Original social preview; optional real photographs
│   ├── models/                    # Optional temple.glb / mandapam.glb
│   ├── audio/                     # Optional wedding-instrumental.mp3
│   └── textures/                  # Optional custom compressed textures
├── src/
│   ├── main.tsx / App.tsx
│   ├── data/
│   │   ├── wedding.ts             # All wedding-specific content
│   │   └── translations.ts        # Complete English/Tamil UI dictionaries
│   ├── context/InvitationContext.tsx / ContentContext.tsx
│   ├── components/
│   │   ├── LoadingScreen.tsx / OpeningCard3D.tsx
│   │   ├── Navigation.tsx / LanguageSwitcher.tsx / ScrollProgress.tsx
│   │   ├── JourneySection.tsx / CoupleSection.tsx / StoryTimeline.tsx
│   │   ├── EventSection.tsx / MandapamSection.tsx / Countdown.tsx
│   │   ├── VenueSection.tsx / Gallery.tsx / RSVPForm.tsx
│   │   ├── BlessingWall.tsx / ShareInvitation.tsx / ClosingScene.tsx
│   │   ├── MusicControl.tsx / SEO.tsx / SceneBoundary.tsx
│   │   └── Ornaments.tsx / TemplePoster.tsx / UI.tsx
│   ├── three/
│   │   ├── InvitationScene.tsx
│   │   ├── TempleJourney.tsx / ProceduralTemple.tsx
│   │   ├── DetailedTemple.tsx / TempleGeometry.tsx / TempleLandscape.tsx
│   │   ├── TempleMaterials.tsx / TempleLighting.tsx / TempleSky.tsx
│   │   ├── MandapamScene.tsx / CameraController.tsx / ParticleSystem.tsx
│   │   └── Atmosphere.tsx
│   ├── hooks/
│   │   ├── useReducedMotion.ts / useDevicePerformance.ts
│   │   └── useVisibility.ts / useWeddingAudio.ts
│   ├── lib/
│   │   ├── assets.ts / calendar.ts / rsvp.ts / content.ts
│   │   ├── invitationImage.ts / metadata.ts / *.test.ts
│   ├── services/
│   │   ├── invitationRepository.ts      # RSVP/blessings (localStorage)
│   │   └── contentRepository.ts         # Admin overrides (local/Supabase adapters)
│   ├── admin/
│   │   ├── AdminApp.tsx / AdminLogin.tsx / AdminShell.tsx / AdminHome.tsx
│   │   ├── AlbumListPage.tsx / AlbumFormPage.tsx / AlbumPhotoPage.tsx / AlbumPreviewPage.tsx
│   │   ├── albumUpload.ts (WebP derivatives + XHR progress) / ImageEditor.tsx / storage.ts / admin.css
│   ├── albums/
│   │   ├── AlbumsApp.tsx / AlbumsIndex.tsx / AlbumStory.tsx / AlbumLightbox.tsx
│   │   ├── PhotoEffects.tsx / storyBlocks.ts / useAlbumSeo.ts / albums.css / photoEffects.css
│   └── styles/globals.css
└── tests/invitation.spec.ts / tests/temple.spec.ts / tests/admin.spec.ts / tests/albums.spec.ts
```

## Performance and fallback design

- Scene modules are `React.lazy` imports behind Suspense. React has its own vendor chunk so a non-WebGL visit does not preload the Three.js engine inadvertently.
- The opening illustration is available before the renderer initializes. The loading screen has an upper bound; unavailable fonts cannot leave a blank page indefinitely.
- Temple/mandapam/closing scenes mount near the viewport and use `frameloop="never"` off screen or in a background tab.
- DPR is capped at 1.25 on phones and 1.5 on larger screens. Particle counts and anti-aliasing are reduced on phones; mobile shadow maps are disabled.
- Lamps, pillars, sculptures, dentils, roof tiles, flowers, foliage and petals use instanced meshes. Canvas paper/stone/foliage textures are generated locally at 256–512 px (the invitation is 768 × 1024) and disposed on replacement/unmount. A one-frame, 64/128 px procedural cubemap supplies metallic reflections without an external HDRI. There is no bloom, expensive post-processing, per-frame water reflection pass or physics simulation.
- No external HDRI, stock photos, remote model, Draco decoder or noise texture is fetched. Optional GLBs use the procedural geometry while suspended and fall back on load failure. Repeated uses clone the model graph while sharing its bounded cached resources.
- A build-time public asset manifest avoids 404 probes for missing optional photos/models/audio. Adding/removing assets triggers a development reload; production requires a new build.
- Reduced-motion, Save-Data, detected low-memory/low-core devices and unavailable WebGL2 use optimized JPG renders of the same detailed scenes and CSS depth. Original vector illustrations remain the final fallback. The full invitation and all forms remain available. An optional desktop sparkle/leaf control also enables gentle mode.
- The primary decorative camera, particle and tilt motions are removed in reduced-motion mode. Crossfades are brief, the gallery retains keyboard controls and the live timer does not announce every second.
- Fonts use `display=swap`, readable serif/sans fallbacks, a dedicated Tamil face, and size-reserved image/artwork frames. Supply self-hosted fonts if external Google Fonts is blocked in your target network.
- Gallery images are lazy-loaded; exports and QR generation are imported on demand. The Maps section is a direct link, not a live iframe.

Lighthouse results depend on hardware, throttling, hosting and replacement assets. The project does not claim an unmeasured score. The Three.js engine remains a larger lazy chunk (normal for this stack); gentle mode avoids it. Keep custom models and photos within the budgets in `PUBLIC_ASSETS.md`.

## Accessibility and browser compatibility

Semantic landmarks and headings, a skip link, native links, keyboard-visible focus, labeled controls, inline field errors with focus to the first invalid field, a live toast region, native `<dialog>` focus management/Escape, meaningful image alternatives, no pre-interaction audio and reduced-motion support are built in. The countdown uses an explicit time-zone offset, UTC calendar exports and IST date formatting. There is no server-rendered clock to cause hydration mismatches.

Target browsers: current Chrome/Edge, Firefox, Safari 16.4+, and current Android Chrome/iOS Safari. WebGL2 is required only for 3D. Native Share and Clipboard depend on HTTPS/browser support; WhatsApp and selectable/copyable content remain available. Local storage may be unavailable in restricted browsing, which is handled in the UI. Physical iOS/Android GPU behavior should still be spot-checked with your final assets before distributing the invitation.

## Intentional starter behavior

- Portrait filenames are configured but files are deliberately absent: initials are the placeholders. There are no invented portraits, fake uploaded pictures or licensed stock assets.
- Unconfirmed dates do not produce invalid calendar downloads; buttons explain that the date is coming soon. Unconfigured Maps links do not navigate to made-up locations. The venue QR appears once a real Maps URL is supplied.
- Event structured data is emitted only once a real date and venue are configured; until then the build emits truthful `WebSite` metadata.
- The temple is an original stylized interpretation, not a photogrammetric model of a particular temple. The portal is a lightweight CSS/3D transition, and mist/light shafts are visual approximations rather than volumetric simulation.
- Scene errors leave posters and the entire HTML invitation usable. The site does require JavaScript, as a Vite React application.
