# Memoria Judaica website

Static website (React + Tailwind, built with esbuild), German / English / Hebrew. EVERY text comes from a Google Sheet. Free hosting on GitHub Pages (public code) or Cloudflare Pages (private code).

## Files

* `Memoria-Judaica-Content.xlsx` - the content workbook (8 tabs). Upload to Google Drive and open as a Google Sheet.
* `apps-script/Code.gs` - paste into the sheet (Extensions > Apps Script): menu, checks, publish button, the web link the build reads, and the contact-form receiver (`CONTACT_TO`).
* `site.config.json` - the web link of the sheet script (`contentUrl`). The contact form uses the same link.
* `data/content.fallback.json` - built-in copy of all content, used until a sheet link is set.
* `public/images/` - logo, photos, portraits, the Bad Kissingen carousel pictures, the cookbook background (replace a file, keep the name).
* `src/app.jsx` - the whole site. `scripts/` - build scripts. `.github/workflows/deploy.yml` - the publish robot (GitHub Pages).

## Documents (folder `docs/`)

* `ADMIN-SETUP-GUIDE.pdf` - one-time setup for the administrator.
* `EDITOR-GUIDE.pdf` - for the editors, large print.
* `DOMAIN-AND-EMAIL-GUIDE.pdf` - domain, Cloudflare, e-mail forwarding to Gmail, contact form, private code option.
* `PROJECT-STATUS-AND-NEXT-STEPS.pdf` - handover sheet: state of the site, open items, how to continue.
* `Hebrew-Proofreading-List-Round2.xlsx` - the Hebrew drafts for the couple to proofread.
* `deploy.yml.txt` - copy of the publish robot. `deploy-cloudflare.yml.txt` - optional variant for private code on Cloudflare Pages (not tested).

Build locally: `npm install && npm run build` (output in `dist/`).
