# After hours · Sean’s birthday

A React + TypeScript + Vite invitation for **Saturday, September 26, 2026**, at Barcade Los Angeles. Warm projected light, a procedural sand sculpture, and optional phone parallax. No 3D engine, generated avatar, or animation library.

## Run

Use Node 24 and Yarn 4.18 (pinned in `package.json`). Yarn uses `node_modules`, not PnP.

```sh
yarn install --immutable
yarn dev
```

```sh
yarn test
yarn lint
yarn build
```

The build includes TypeScript checking. The tests exercise motion permission/lifecycle, cancellation refresh, and the LA calendar dates. They do not replace testing on a physical phone or checking layouts in a browser.

## Finish the event setup

Edit `src/birthday-hologram/event.ts`:

- The event runs **September 26, 9:30 p.m. → September 27, 1 a.m. in Los Angeles**. `startsAt` is `2026-09-26T21:30:00-07:00`; calendar creation is enabled. Guests can drop in whenever.
- **`publishedUrl`** can hold the final public website address. Leave it empty during development to use the current page address.
- **`communityEndpoint`** enables the shared guest Instagram form after connecting the adapter below. Empty means no guest submission form; Sean’s links still work.
- **`additionalLink`** is a spare event link, hidden until filled.

Add your existing **`public/qr.svg`**. It was not in the repository when this redesign began. Missing QR art falls back to a copyable link and the Let’s Hang event. Regenerate the QR after the repository/site URL is final: a previously encoded QR cannot update itself. Keep a black/white code with a clear quiet zone.

The Drive link is clearly labelled **PUBLIC FOLDER**. Confirm the folder’s upload permissions in your Google account; some guests may need to sign in. The site links to Drive rather than uploading files itself. No Drive credentials are stored here.

## Design and behaviour

- The landing waits for **Decrypt invitation**. Its brief expansion/dissolve leads to the event. Reduced motion skips that transition.
- The canvas projects depth-layered grains with curved lighting, falling dust and mild signal scattering. Pointer movement works on desktop. Phone sensors are attached only after **Enable phone motion**. Missing readings, denied permission and insecure contexts have explicit states. Test the published HTTPS page on Android; opening a local network HTTP address does not provide a secure sensor context.
- The background, title, text, particles, glow, borders, buttons and level number each have a color control. Settings stay on that device. High contrast temporarily uses a legible palette; it preserves custom choices.
- English and Spanish copy are in `i18n.ts`. The existing broader language reference remains in the repo; those additional translations are not implemented in this pass.
- All live styles are in **`src/index.css`**. The old overlapping stylesheets and unused black-hole frame have been retired. No `!important` rules.
- The landing uses the viewport height and the artwork scales through 4K. The event’s longer explanations live in accessible dialogs. Small landscape screens or enlarged text can scroll naturally rather than losing information.
- Text uses the supplied Vector family, Pixel Operator for small metadata, and F-Zero for the decorative level. Existing source and font licences remain in the repository.

## Updates and reminders

Change `public/event-status.json` to show a cancellation:

```json
{
  "state": "cancelled",
  "message": "Plans changed—this hang is cancelled. Thanks for understanding.",
  "updatedAt": "2026-09-24"
}
```

Commit and publish that change. The open invitation checks this file on entry, return to the tab and once a minute while visible. A cancellation remains visible if a later refresh fails, and calendar creation is disabled. An optional message is displayed verbatim, so use bilingual text if appropriate.

This is **not background push**. [GitHub Pages serves static files](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages); closed-tab cancellation notifications need a notification service, subscription storage and a service worker. There is no pretend notification permission prompt.

Google and Outlook links prefill the event for the guest to save. The optional `.ics` download includes a reminder three days before; the calendar application decides whether to deliver it. Calendar copies are not live subscriptions and cannot be remotely cancelled by changing the website. The event description asks guests to check the page before leaving.

## Optional shared Instagram list

`integrations/guest-instagram.gs` is a small, separately deployed [Google Apps Script Content Service](https://developers.google.com/apps-script/guides/content) adapter. It is not deployed or connected by this PR.

1. Create a private Google Sheet with a sheet named `Guests` and row-one headings `name`, `handle`, `consentAt`, `visible`.
2. Create an Apps Script project and paste the adapter. In Script Properties, set `SHEET_ID` to that spreadsheet’s ID. Set `OPEN` to `true` when ready to accept submissions.
3. Deploy as a web app, running as you, accessible to anyone. The deployment account must be allowed to publish an anonymous web app. Keep the spreadsheet itself private.
4. Put the deployment’s `/exec` URL in `event.communityEndpoint`. Test GET and POST from the published invitation, including anonymous access and redirect/CORS behaviour, before opening submissions.
5. Guests explicitly agree to publish their name and handle. The endpoint returns only those public fields. Set a row’s `visible` value to `FALSE` to remove it from the public list, or set `OPEN` to `false` to close submissions.

The adapter validates input, escapes spreadsheet formulas, rejects edits to existing handles, serializes writes and caps the list at 500 entries. It has a short global submission cooldown, not an identity/anti-abuse service. No secret belongs in `event.ts`. If using a different backend, support:

```text
GET  -> { "guests": [{ "name": "Example", "handle": "example" }] }
POST <- { "name": "Example", "handle": "example", "consent": true }
POST -> { "ok": true }
```

The form only reports success after receiving that acknowledgement. It never presents browser-local data as a shared list.

## GitHub Pages

The workflow checks pull requests and publishes **main only**. For production, set **Settings → Pages → Source → GitHub Actions**, then merge the approved branch. This private repository needs a GitHub plan that supports Pages for private repositories. The site URL and the repository’s visibility are separate settings; verify guests can open the published site.

`base: './'` keeps assets portable if you rename the repository. Update `publishedUrl`, regenerate `public/qr.svg` and confirm the backup event’s date after deciding the final address. A review branch does not deploy production.
