const GITHUB_URL = "https://github.com/giladfeldman/qualtricsbackupapp";

export function PrivacyBanner() {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
      <p className="font-medium">Your API token is never stored.</p>
      <p className="mt-1 text-sky-900/90 dark:text-sky-100/90">
        The token stays in your browser memory and is sent only through a
        stateless proxy to Qualtrics. We do not write it to a database, cookie,
        or server environment variable.{" "}
        <a
          href={`${GITHUB_URL}/blob/main/SECURITY.md`}
          className="underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          Read SECURITY.md
        </a>{" "}
        or{" "}
        <a
          href={GITHUB_URL}
          className="underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          audit the source code
        </a>
        .
      </p>
    </div>
  );
}
