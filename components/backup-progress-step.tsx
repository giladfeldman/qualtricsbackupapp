"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { BackupProgressEvent } from "@/lib/qualtrics/types";

interface BackupProgressStepProps {
  running: boolean;
  events: BackupProgressEvent[];
  failedSurveyIds: string[];
  onCancel: () => void;
  onComplete: () => void;
}

function latestEvent(events: BackupProgressEvent[]): BackupProgressEvent | null {
  return events.length > 0 ? events[events.length - 1] : null;
}

export function BackupProgressStep({
  running,
  events,
  failedSurveyIds,
  onCancel,
  onComplete,
}: BackupProgressStepProps) {
  const current = latestEvent(events);
  const completedCount = events.filter((event) => event.status === "complete")
    .length;

  return (
    <Card className="space-y-5">
      <CardTitle>Running backup</CardTitle>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Keep this browser tab open. Large accounts can take a long time — the
        R script uses the same sequential approach with retries and rate limits.
      </p>

      {current ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium">
            Survey {current.surveyIndex} of {current.surveyTotal}:{" "}
            {current.surveyName || "Preparing catalog"}
          </p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Phase: {current.phase}
            {current.message ? ` — ${current.message}` : ""}
          </p>
          {current.attempt && current.maxAttempts ? (
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Attempt {current.attempt} / {current.maxAttempts}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full bg-zinc-900 transition-all dark:bg-zinc-100"
          style={{
            width: current
              ? `${Math.min(100, (current.surveyIndex / Math.max(current.surveyTotal, 1)) * 100)}%`
              : "0%",
          }}
        />
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Progress events recorded: {completedCount}
      </p>

      {failedSurveyIds.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">Some surveys failed:</p>
          <p className="mt-1 font-mono text-xs">{failedSurveyIds.join(", ")}</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        {running ? (
          <Button variant="destructive" onClick={onCancel}>
            Cancel backup
          </Button>
        ) : (
          <Button onClick={onComplete}>Continue to download</Button>
        )}
      </div>
    </Card>
  );
}
