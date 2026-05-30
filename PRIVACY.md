# Privacy

Qualtrics Backup is designed so you do not have to trust us blindly.

## Data we do not collect

- Qualtrics API tokens
- Survey definitions (QSF)
- Response data (CSV)
- Metadata or question maps
- Account identifiers beyond what is needed for a single in-flight API request

There is no user account system, no signup form, and no backup upload step.

## Data flow

| Step | Where data lives |
|---|---|
| You enter credentials | Browser memory (current tab) |
| App lists/downloads surveys | Browser → Vercel proxy → Qualtrics → browser |
| ZIP is built | Browser memory |
| ZIP is saved | Your computer (via browser download) |

The deployed app does not send your backup to a server-side bucket or database.

## Why the API token is required

Qualtrics requires an API token on every v3 API request. There is no supported way to export an entire account without it. This is the same requirement as the companion [R backup script](https://github.com/giladfeldman/qualtrics_backup).

## Why the source code is public

Because you must share a sensitive credential, the full application source is on GitHub. You can inspect:

- [`app/api/qualtrics/proxy/route.ts`](app/api/qualtrics/proxy/route.ts) — the only server-side Qualtrics integration
- [`lib/backup/run-backup.ts`](lib/backup/run-backup.ts) — backup orchestration
- [`lib/zip/build-backup-zip.ts`](lib/zip/build-backup-zip.ts) — client-side ZIP assembly

## Recommendations

- Use a token you can rotate after the backup if desired
- Do not share your token with anyone
- Close the tab when finished, or click **Clear credentials**

## Contact

Questions about privacy can be raised via GitHub Issues on this repository.
