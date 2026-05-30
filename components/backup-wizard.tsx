"use client";

import { useMemo, useRef, useState } from "react";
import { ConnectStep } from "@/components/connect-step";
import { SurveySelectStep } from "@/components/survey-select-step";
import { BackupProgressStep } from "@/components/backup-progress-step";
import { DownloadStep } from "@/components/download-step";
import { PrivacyBanner } from "@/components/privacy-banner";
import { runBackup } from "@/lib/backup/run-backup";
import { listSurveys } from "@/lib/qualtrics/client";
import type {
  BackupProgressEvent,
  QualtricsCredentials,
  QualtricsSurvey,
} from "@/lib/qualtrics/types";
import { buildBackupZip } from "@/lib/zip/build-backup-zip";

type WizardStep = "connect" | "select" | "backup" | "download";

const STEPS: WizardStep[] = ["connect", "select", "backup", "download"];

export function BackupWizard() {
  const [step, setStep] = useState<WizardStep>("connect");
  const [credentials, setCredentials] = useState<QualtricsCredentials>({
    datacenter: "",
    apiToken: "",
  });
  const [surveys, setSurveys] = useState<QualtricsSurvey[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<BackupProgressEvent[]>([]);
  const [failedSurveyIds, setFailedSurveyIds] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [folders, setFolders] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const selectedSurveys = useMemo(
    () => surveys.filter((survey) => selectedIds.has(survey.id)),
    [surveys, selectedIds],
  );

  async function handleConnected() {
    const allSurveys = await listSurveys(credentials);
    setSurveys(allSurveys);
    setSelectedIds(new Set(allSurveys.map((survey) => survey.id)));
    setStep("select");
  }

  function handleToggleSurvey(surveyId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(surveyId)) {
        next.delete(surveyId);
      } else {
        next.add(surveyId);
      }
      return next;
    });
  }

  async function handleStartBackup() {
    setStep("backup");
    setRunning(true);
    setEvents([]);
    setFailedSurveyIds([]);
    setZipBlob(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await runBackup({
        credentials,
        surveys: selectedSurveys,
        signal: controller.signal,
        onProgress: (event) => {
          setEvents((current) => [...current, event]);
        },
      });

      setFailedSurveyIds(result.failedSurveyIds);
      const blob = await buildBackupZip(result.files);
      setZipBlob(blob);
      setFileCount(result.files.length);

      const folderSet = new Set<string>();
      for (const file of result.files) {
        const [folder] = file.path.split("/");
        if (folder && !file.path.endsWith(".json")) {
          folderSet.add(folder);
        }
      }
      setFolders(Array.from(folderSet).sort());
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setEvents((current) => [
          ...current,
          {
            phase: "responses",
            surveyIndex: 0,
            surveyTotal: selectedSurveys.length,
            surveyId: "",
            surveyName: "",
            status: "failed",
            error: "Backup cancelled.",
          },
        ]);
      } else {
        const message =
          error instanceof Error ? error.message : "Backup failed unexpectedly.";
        setEvents((current) => [
          ...current,
          {
            phase: "responses",
            surveyIndex: 0,
            surveyTotal: selectedSurveys.length,
            surveyId: "",
            surveyName: "",
            status: "failed",
            error: message,
          },
        ]);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function handleCancelBackup() {
    abortRef.current?.abort();
  }

  function handleRestart() {
    setStep("connect");
    setEvents([]);
    setFailedSurveyIds([]);
    setZipBlob(null);
    setFileCount(0);
    setFolders([]);
  }

  function handleClearCredentials() {
    setCredentials({ datacenter: "", apiToken: "" });
    handleRestart();
  }

  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((item, index) => {
          const active = item === step;
          const completed = STEPS.indexOf(step) > index;

          return (
            <span
              key={item}
              className={`rounded-full px-3 py-1 ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : completed
                    ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500"
              }`}
            >
              {index + 1}. {item}
            </span>
          );
        })}
      </nav>

      {step === "connect" ? (
        <ConnectStep
          credentials={credentials}
          onChange={setCredentials}
          onConnected={handleConnected}
        />
      ) : null}

      {step === "select" ? (
        <SurveySelectStep
          surveys={surveys}
          selectedIds={selectedIds}
          onToggle={handleToggleSurvey}
          onSelectAll={() =>
            setSelectedIds(new Set(surveys.map((survey) => survey.id)))
          }
          onClearAll={() => setSelectedIds(new Set())}
          onContinue={handleStartBackup}
        />
      ) : null}

      {step === "backup" ? (
        <BackupProgressStep
          running={running}
          events={events}
          failedSurveyIds={failedSurveyIds}
          onCancel={handleCancelBackup}
          onComplete={() => setStep("download")}
        />
      ) : null}

      {step === "download" ? (
        <DownloadStep
          zipBlob={zipBlob}
          fileCount={fileCount}
          folders={folders}
          onRestart={handleRestart}
          onClearCredentials={handleClearCredentials}
        />
      ) : null}

      {step !== "connect" ? <PrivacyBanner /> : null}
    </div>
  );
}
