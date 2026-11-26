# SHIFT MEDIA — Video & Photography Portfolio

Static website (HTML, CSS, JavaScript — no build step), deployed on Vercel.

## Pages
- `/` — Home (`index.html`)
- `/videography` — films (`videography.html`)
- `/photography` — photo albums (`photography.html`)

One responsive layout adapts automatically: desktop (≥1024px), tablet (640–1023px) and phone (<640px).

## Edit content
- **Texts, links, contact details:** edit the HTML files directly.
- **Video links / covers:** in `videography.html`; cover images live in `assets/img/`.
- **Colours, sizes, spacing:** `assets/css/style.css` (variables at the top).

## Add a photo album
1. Put the photos in `assets/albums/<album-slug>/` (e.g. `01.jpg`, `02.jpg` …, ideally max 1600px on the long side).
2. Add an entry in `assets/js/albums-data.js` with the title, year, cover and each photo's `src`, `w` (width) and `h` (height).
3. Set `"featured": true` on the album that should appear in the big block (only one).

Album popups use a justified mosaic (rows always fill the full width), close only with the ✕ button,
and every photo opens in a viewer with arrows, keyboard (← → Esc) and swipe.

## Local preview
```bash
npx serve .
```
