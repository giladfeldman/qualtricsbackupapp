# Qualtrics Backup App

Public web interface for backing up an entire Qualtrics account — no R required.

This app ports the workflow from [giladfeldman/qualtrics_backup](https://github.com/giladfeldman/qualtrics_backup):

- `.qsf` survey definition files
- Response data as CSV
- YAML metadata per survey
- JSON question maps
- A survey catalog JSON file

SPSS `.sav` export is not included in v1 (CSV opens in Excel and SPSS).

## Why this exists

The R script works well if you use RStudio, but many researchers do not. Qualtrics also blocks direct browser calls to its API (CORS), so this app uses a **small, stateless proxy** on Vercel while keeping your token and backup files out of storage.

**The entire codebase is public so you can verify we store nothing.** See [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md).

## Quick start (local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter your Qualtrics datacenter ID and API token, select surveys, and download a ZIP.

## Deploy

Deploy the `qualtricsbackupapp` folder to Vercel. No environment variables are required for user tokens.

**Production:** https://qualtricsbackupapp.vercel.app

```bash
npm run build
```

## Project layout

```
app/                  Next.js pages and API proxy
components/           Backup wizard UI
lib/qualtrics/        Qualtrics API client
lib/backup/           Backup orchestration (retries, rate limits)
lib/zip/              Client-side ZIP builder
```

## Output structure

```
backup.zip
├── survey_catalog.json
├── qsf/
├── data/response_data-SV_xxx.csv
├── metadata/metadata-SV_xxx.yaml
└── question_data/question_data-SV_xxx.json
```

## Development

```bash
npm run lint
npm test
```

## License

Same spirit as the original R script — use at your own risk, especially with large accounts. The app mirrors the R script's sequential export with 5-second QSF rate limiting and up to 5 retries per survey.
