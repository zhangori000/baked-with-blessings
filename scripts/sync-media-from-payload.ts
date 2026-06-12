import { loadScriptEnv } from './lib/load-script-env'

loadScriptEnv()

import {
  formatMediaSyncResult,
  parseMediaSyncOptions,
  syncMediaFromPayload,
} from '../src/utilities/syncMediaFromPayload'

/*
 * Reconcile Payload Media documents from a source Payload API into the
 * database configured for this local process. The source files already live in
 * Vercel Blob; this script syncs the database rows that make those files
 * appear in the Admin Media collection.
 *
 * Typical local usage:
 *   pnpm sync:media:prod-to-local
 *
 * Safety:
 * - Reads from the public production Media API by default.
 * - Writes to the current Payload database from `.env` / `.env.local`.
 * - Refuses remote targets unless `--allow-remote-target` is passed.
 * - Deletes local-only Media database rows by default so local matches prod.
 * - Does not upload, download, or delete Blob files.
 */

void syncMediaFromPayload(parseMediaSyncOptions())
  .then((result) => {
    console.log(formatMediaSyncResult(result))
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
