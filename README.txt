Copy src into your existing React + Vite + TypeScript project, replacing App.tsx and index.css. Keep your existing main.tsx (it should import index.css). No additional packages needed. Run yarn dev.

Edit event details in src/birthday-hologram/event.ts. Calendar activates when all details are valid. Dates use ISO timestamps with an explicit timezone offset; set timeZone to your local IANA timezone.

Includes portal opening, holographic invitation, appearance controls and opt-in phone motion. TypeScript and production build passed; calendar and permission behavior checked. Phone motion still needs testing on a real device over HTTPS.
