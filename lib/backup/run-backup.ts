import { stringify as stringifyYaml } from "yaml";
import {
  fetchQsf,
  fetchQuestionMap,
  fetchSurveyMetadata,
  fetchSurveyResponsesCsv,
  MAX_SURVEY_ATTEMPTS,
  QSF_RATE_LIMIT_MS,
} from "@/lib/qualtrics/client";
import { sanitizeSurveyFileName } from "@/lib/qualtrics/names";
import type {
  BackupFile,
  BackupProgressEvent,
  QualtricsCredentials,
  QualtricsSurvey,
  SurveyBackupResult,
} from "@/lib/qualtrics/types";
import { sleep } from "@/lib/utils";

export interface RunBackupOptions {
  credentials: QualtricsCredentials;
  surveys: QualtricsSurvey[];
  onProgress: (event: BackupProgressEvent) => void;
  signal?: AbortSignal;
}

export interface RunBackupResult {
  files: BackupFile[];
  results: SurveyBackupResult[];
  failedSurveyIds: string[];
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Backup cancelled.", "AbortError");
  }
}

export async function runBackup(
  options: RunBackupOptions,
): Promise<RunBackupResult> {
  const { credentials, surveys, onProgress, signal } = options;
  const files: BackupFile[] = [];
  const results = new Map<string, SurveyBackupResult>();

  for (const survey of surveys) {
    results.set(survey.id, {
      surveyId: survey.id,
      surveyName: survey.name,
      qsfStatus: "pending",
      dataStatus: "pending",
      errors: [],
    });
  }

  const catalog = {
    exportedAt: new Date().toISOString(),
    surveyCount: surveys.length,
    surveys: surveys.map((survey) => ({
      id: survey.id,
      name: survey.name,
      ownerId: survey.ownerId,
      lastModified: survey.lastModified,
      isActive: survey.isActive,
    })),
  };

  files.push({
    path: "survey_catalog.json",
    content: JSON.stringify(catalog, null, 2),
  });

  onProgress({
    phase: "catalog",
    surveyIndex: 0,
    surveyTotal: surveys.length,
    surveyId: "",
    surveyName: "",
    status: "complete",
    message: "Survey catalog prepared.",
  });

  for (let index = 0; index < surveys.length; index += 1) {
    assertNotAborted(signal);
    const survey = surveys[index];
    const result = results.get(survey.id)!;

    onProgress({
      phase: "qsf",
      surveyIndex: index + 1,
      surveyTotal: surveys.length,
      surveyId: survey.id,
      surveyName: survey.name,
      status: "running",
      message: "Downloading QSF…",
    });

    try {
      const qsf = await fetchQsf(credentials, survey.id);
      files.push({
        path: `qsf/${sanitizeSurveyFileName(survey.name)}.qsf`,
        content: qsf,
      });
      result.qsfStatus = "complete";
      onProgress({
        phase: "qsf",
        surveyIndex: index + 1,
        surveyTotal: surveys.length,
        surveyId: survey.id,
        surveyName: survey.name,
        status: "complete",
      });
    } catch (error) {
      result.qsfStatus = "failed";
      const message = error instanceof Error ? error.message : "QSF download failed.";
      result.errors.push(message);
      onProgress({
        phase: "qsf",
        surveyIndex: index + 1,
        surveyTotal: surveys.length,
        surveyId: survey.id,
        surveyName: survey.name,
        status: "failed",
        error: message,
      });
    }

    if (index < surveys.length - 1) {
      await sleep(QSF_RATE_LIMIT_MS);
    }
  }

  for (let index = 0; index < surveys.length; index += 1) {
    assertNotAborted(signal);
    const survey = surveys[index];
    const result = results.get(survey.id)!;
    let success = false;

    for (let attempt = 1; attempt <= MAX_SURVEY_ATTEMPTS && !success; attempt += 1) {
      assertNotAborted(signal);

      onProgress({
        phase: "responses",
        surveyIndex: index + 1,
        surveyTotal: surveys.length,
        surveyId: survey.id,
        surveyName: survey.name,
        status: "running",
        attempt,
        maxAttempts: MAX_SURVEY_ATTEMPTS,
        message: `Exporting responses (attempt ${attempt}/${MAX_SURVEY_ATTEMPTS})…`,
      });

      try {
        const csv = await fetchSurveyResponsesCsv(credentials, survey.id, (percent) => {
          onProgress({
            phase: "responses",
            surveyIndex: index + 1,
            surveyTotal: surveys.length,
            surveyId: survey.id,
            surveyName: survey.name,
            status: "running",
            attempt,
            maxAttempts: MAX_SURVEY_ATTEMPTS,
            message: `Exporting responses… ${percent}%`,
          });
        });

        files.push({
          path: `data/response_data-${survey.id}.csv`,
          content: csv,
        });

        onProgress({
          phase: "metadata",
          surveyIndex: index + 1,
          surveyTotal: surveys.length,
          surveyId: survey.id,
          surveyName: survey.name,
          status: "running",
          message: "Downloading metadata…",
        });

        const metadata = await fetchSurveyMetadata(credentials, survey.id);
        files.push({
          path: `metadata/metadata-${survey.id}.yaml`,
          content: stringifyYaml(metadata),
        });

        onProgress({
          phase: "question_data",
          surveyIndex: index + 1,
          surveyTotal: surveys.length,
          surveyId: survey.id,
          surveyName: survey.name,
          status: "running",
          message: "Building question map…",
        });

        const questionMap = await fetchQuestionMap(
          credentials,
          survey.id,
          metadata,
        );
        files.push({
          path: `question_data/question_data-${survey.id}.json`,
          content: JSON.stringify(questionMap, null, 2),
        });

        result.dataStatus = "complete";
        success = true;

        onProgress({
          phase: "question_data",
          surveyIndex: index + 1,
          surveyTotal: surveys.length,
          surveyId: survey.id,
          surveyName: survey.name,
          status: "complete",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Survey export failed.";

        if (attempt < MAX_SURVEY_ATTEMPTS) {
          onProgress({
            phase: "responses",
            surveyIndex: index + 1,
            surveyTotal: surveys.length,
            surveyId: survey.id,
            surveyName: survey.name,
            status: "running",
            attempt,
            maxAttempts: MAX_SURVEY_ATTEMPTS,
            message: `Retrying after error: ${message}`,
          });
          await sleep(2000);
        } else {
          result.dataStatus = "failed";
          result.errors.push(message);
          onProgress({
            phase: "responses",
            surveyIndex: index + 1,
            surveyTotal: surveys.length,
            surveyId: survey.id,
            surveyName: survey.name,
            status: "failed",
            attempt,
            maxAttempts: MAX_SURVEY_ATTEMPTS,
            error: message,
          });
        }
      }
    }
  }

  const resultList = Array.from(results.values());
  const failedSurveyIds = resultList
    .filter((entry) => entry.qsfStatus === "failed" || entry.dataStatus === "failed")
    .map((entry) => entry.surveyId);

  return { files, results: resultList, failedSurveyIds };
}
