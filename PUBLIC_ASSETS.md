# Your photographs, music and optional 3D models

The invitation looks complete without external assets. All illustrations, patterns, geometry, card textures and fallback music are original procedural work. Add only files you own or are permitted to publish.

## Images — `public/images/`

| Filename | Purpose | Recommended size | Starter fallback |
| --- | --- | --- | --- |
| `groom.jpg` | Groom portrait | 800 × 1100, under 180 KB | Ornamental K initial |
| `bride.jpg` | Bride portrait | 800 × 1100, under 180 KB | Ornamental B initial |
| `venue.jpg` | Venue photograph | 1000 × 1200, under 250 KB | Original temple illustration |
| `og-wedding.jpg` | Social preview | 1200 × 630, under 250 KB | Included original generated artwork |
| `gallery-01.jpg` … `gallery-05.jpg` | Gallery photographs | 1200 px longest side, under 220 KB each | Individually designed floral/arch/kolam artwork |
| `temple-day.jpg` / `temple-night.jpg` | Optimized scene posters | Included original 3D renders | Original vector temple illustration |
| `mandapam-scene.jpg` | Mandapam poster | Included original 3D render | Original vector temple illustration |

The portrait/gallery JPGs are **intentionally not empty fake image files**. Their exact paths are ready in `wedding.ts`. Until real files exist, the asset manifest selects elegant placeholders without issuing a failing network request. `ImageWithFallback` also handles corrupt files and failed remote HTTPS images.

**The photo editor (`/#admin`) bypasses these folders** for bride/groom/gallery photos. Uploaded photos are cropped in the browser, uploaded to Supabase Storage (cloud mode), and served from their public HTTPS URLs — so no rebuild is needed when you change them. `ImageWithFallback` accepts remote HTTPS images. The local asset manifest only ever lists files that truly exist, so unsupported-editor visitors keep the elegant placeholders until real photos publish.

Keep faces close to the upper center of portrait crops. You may instead use WebP or AVIF: change the corresponding path in `wedding.ts`. Supply meaningful English and Tamil gallery captions. Add or remove gallery entries from the array; each entry needs a unique `id`. Empty optional story image paths are valid.

`og-wedding.jpg` is an original generated social preview; `og-wedding.svg` is the last-resort fallback. Social platforms generally prefer JPG/PNG. After changing names/dates, run `npm run preview:image` locally with Chrome installed to regenerate the JPG from `wedding.ts`, or replace it with your own artwork. Rebuild and redeploy after replacement. The preview generator is optional and is not run on Vercel, so deployment does not require a browser installation.

The temple and mandapam JPGs are rendered from this project's own procedural scenes. They improve reduced-motion and unsupported-device presentation without loading WebGL. Regenerate them after scene changes with `npm run preview:temples`; the script starts a temporary local Vite server if needed and closes it afterward. Their paths are editable in `wedding.artwork`. These are architectural illustrations, not photographs of the actual wedding venue.

## Audio — `public/audio/`

Optional file: `wedding-instrumental.mp3`.

- Prefer a clean, low-volume instrumental with no abrupt opening. Aim for 1–3 MB, approximately 96–128 kbps.
- Use your own recording, a commissioned score or audio with a license permitting website redistribution.
- No music is fetched or played until a user gesture. The app remembers the session's mute choice, offers volume/stop, and pauses background tabs.
- Without the file, the application synthesizes a gentle original ambient score and bell-inspired tone using Web Audio. A missing/corrupt file does not crash the invitation.

## Models — `public/models/`

Optional files: `temple.glb` and `mandapam.glb`.

Both are automatically discovered; no component edits are needed. The procedural equivalent is the loading/error fallback. Match these conventions:

- Y is up, +Z is the front, the base rests at Y=0 and the model is centered on X/Z.
- Suggested temple dimensions: approximately 35 units wide, 19 units tall. Preserve an open central entrance around X=-1.8…1.8 and Y=0…5 for the camera to pass through.
- The mandapam is approximately 8 units wide, 6 units tall, centered on its stage. The journey places it at Z=-15.
- `templeModelScale` and `mandapamModelScale` in `wedding.ts` can adjust scale.
- Target under 1.5 MB per model, fewer than 35,000 triangles and fewer than 20 materials. Export only required meshes and textures.
- Use resized, compressed embedded textures (ideally 512–1024 px, JPEG/WebP). Avoid giant 4K maps, opaque baked lights and unnecessary animations.
- The starter intentionally has **no Draco decoder/network dependency**. Export standard GLB. If you choose Draco/Meshopt/KTX2 later, add a properly hosted decoder/loader before using that format.

Do not add a paid or copyrighted model without permission. No particular model is required for the cinematic camera path or the wedding content to work.

## Textures — `public/textures/`

The stock card generates its 768 × 1024 paper/foil textures locally. No image textures are required. This folder is available for an extension using optimized textures. Merely placing a texture here does not replace a material; scene/material changes would be needed for custom texture mapping.

## Adding and verifying files

1. Copy the real asset into its expected folder, preserving filename case.
2. Change any nonstandard filename/format in `src/data/wedding.ts`.
3. Vite reloads when public assets are added/removed. If your file-copy tool uses unusual temporary renames, restart `npm run dev`.
4. Check the image framing, dark/light readability and both languages.
5. Run `npm run build` and deploy the new `dist` output.

The manifest is generated from real local files during build. A missing model is never requested, preventing Vercel missing-file responses from being interpreted as GLB data. All public assets are publicly downloadable; place no keys, private guest records or confidential documents in these folders.
