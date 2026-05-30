import { BackupWizard } from "@/components/backup-wizard";
import { PrivacyBanner } from "@/components/privacy-banner";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          Open source · No storage
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Qualtrics Backup
        </h1>
        <p className="max-w-3xl text-lg text-zinc-600 dark:text-zinc-400">
          Back up every survey in your Qualtrics account — QSF definitions,
          response CSV files, YAML metadata, and question maps — without using
          R. This web app is a port of the{" "}
          <a
            href="https://github.com/giladfeldman/qualtrics_backup"
            className="underline underline-offset-2"
          >
            qualtrics_backup
          </a>{" "}
          script.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-base font-semibold">What gets downloaded</h2>
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
{`backup.zip
├── survey_catalog.json
├── qsf/
├── data/response_data-SV_xxx.csv
├── metadata/metadata-SV_xxx.yaml
└── question_data/question_data-SV_xxx.json`}
          </pre>
        </div>
        <div className="space-y-4">
          <PrivacyBanner />
          <div className="rounded-xl border border-zinc-200 p-5 text-sm dark:border-zinc-800">
            <h2 className="text-base font-semibold">Why we need your API token</h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Qualtrics does not offer a password-based export for third-party
              tools. Every request must include your personal API token in the
              <code className="mx-1 rounded bg-zinc-100 px-1 dark:bg-zinc-900">
                X-API-TOKEN
              </code>{" "}
              header. Because that is sensitive, the entire app is public on
              GitHub so you can verify we never store it.
            </p>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              After a backup, consider rotating your token in Qualtrics if you
              want extra caution.
            </p>
          </div>
        </div>
      </section>

      <BackupWizard />
    </main>
  );
}
