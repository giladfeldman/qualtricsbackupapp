"use client";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { QualtricsSurvey } from "@/lib/qualtrics/types";

interface SurveySelectStepProps {
  surveys: QualtricsSurvey[];
  selectedIds: Set<string>;
  onToggle: (surveyId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onContinue: () => void;
}

export function SurveySelectStep({
  surveys,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  onContinue,
}: SurveySelectStepProps) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Select surveys to back up</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSelectAll}>
            Select all
          </Button>
          <Button variant="outline" onClick={onClearAll}>
            Clear
          </Button>
        </div>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {selectedIds.size} of {surveys.length} surveys selected.
      </p>

      <div className="max-h-[420px] overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Include</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Survey ID</th>
              <th className="px-3 py-2">Last modified</th>
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((survey) => (
              <tr
                key={survey.id}
                className="border-t border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(survey.id)}
                    onChange={() => onToggle(survey.id)}
                  />
                </td>
                <td className="px-3 py-2">{survey.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{survey.id}</td>
                <td className="px-3 py-2">
                  {new Date(survey.lastModified).toLocaleString()}
                </td>
                <td className="px-3 py-2">{survey.isActive ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button disabled={selectedIds.size === 0} onClick={onContinue}>
        Start backup
      </Button>
    </Card>
  );
}
