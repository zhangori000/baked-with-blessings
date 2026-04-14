# Typography preferences - 2026-04-12

Current requested direction:

1. Default website text should prefer:
   - `ABC Diatype Rounded Plus`
   - weight target: `500`
2. Secondary rounded display option to keep available for later placement:
   - `Robuck Rounded`
   - weight target: `400`
   - possible future use: nav links or other rounded accent text

Implementation note:

- The app now stores these as CSS variables in `src/app/(app)/globals.css`:
  - `--font-rounded-body`
  - `--font-rounded-display`
- Only `--font-rounded-body` is actively applied right now.
- If the actual font files are not bundled or loaded by the browser/OS, the stack will fall back to Geist Sans.
