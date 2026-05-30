"use client";

import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

interface DownloadStepProps {
  zipBlob: Blob | null;
  fileCount: number;
  folders: string[];
  onRestart: () => void;
  onClearCredentials: () => void;
}

export function DownloadStep({
  zipBlob,
  fileCount,
  folders,
  onRestart,
  onClearCredentials,
}: DownloadStepProps) {
  function handleDownload() {
    if (!zipBlob) {
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    saveAs(zipBlob, `qualtrics-backup-${timestamp}.zip`);
  }

  const summaryFolders =
    folders.length > 0 ? folders : ["qsf", "data", "metadata", "question_data"];

  return (
    <Card className="space-y-5">
      <CardTitle>Download your backup</CardTitle>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Your ZIP was assembled entirely in this browser. No backup files were
        uploaded to our servers.
      </p>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium">{fileCount} files ready</p>
        <ul className="mt-2 list-disc pl-5 text-zinc-600 dark:text-zinc-400">
          {summaryFolders.map((folder) => (
            <li key={folder}>
              <code>{folder}/</code>
            </li>
          ))}
          <li>
            <code>survey_catalog.json</code>
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={!zipBlob} onClick={handleDownload}>
          Download backup.zip
        </Button>
        <Button variant="outline" onClick={onRestart}>
          Run another backup
        </Button>
        <Button variant="ghost" onClick={onClearCredentials}>
          Clear credentials
        </Button>
      </div>
    </Card>
  );
}
