import { unzipSync } from "fflate";
import { qualtricsProxy } from "./proxy";
import type {
  QualtricsCredentials,
  QualtricsSurvey,
  QuestionMapEntry,
} from "./types";
import { sleep } from "@/lib/utils";

interface SurveyElementRaw {
  id: string;
  name: string;
  ownerId: string;
  lastModified: string;
  isActive: boolean;
}

interface SurveysListResponse {
  result?: {
    elements?: SurveyElementRaw[];
    nextPage?: string | null;
  };
}

interface ExportStartResponse {
  result?: {
    progressId?: string;
    id?: string;
  };
}

interface ExportProgressResponse {
  result?: {
    status?: string;
    percentComplete?: number;
    fileId?: string;
  };
}

interface SurveyDefinitionResponse {
  result?: Record<string, unknown>;
}

function mapSurvey(raw: SurveyElementRaw): QualtricsSurvey {
  return {
    id: raw.id,
    name: raw.name,
    ownerId: raw.ownerId,
    lastModified: raw.lastModified,
    isActive: raw.isActive,
  };
}

export async function testConnection(
  credentials: QualtricsCredentials,
): Promise<{ ok: true; surveyCount: number }> {
  const surveys = await listSurveys(credentials);
  return { ok: true, surveyCount: surveys.length };
}

export async function listSurveys(
  credentials: QualtricsCredentials,
): Promise<QualtricsSurvey[]> {
  const surveys: QualtricsSurvey[] = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const data = await qualtricsProxy<SurveysListResponse>(
      credentials.apiToken,
      {
        datacenter: credentials.datacenter,
        method: "GET",
        path: `surveys?offset=${offset}`,
      },
    );

    const elements = data.result?.elements ?? [];
    surveys.push(...elements.map(mapSurvey));

    if (!data.result?.nextPage || elements.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return surveys;
}

export async function fetchQsf(
  credentials: QualtricsCredentials,
  surveyId: string,
): Promise<string> {
  return qualtricsProxy<string>(credentials.apiToken, {
    datacenter: credentials.datacenter,
    method: "GET",
    path: `survey-definitions/${surveyId}`,
    accept: "application/vnd.qualtrics.survey.qsf",
    responseType: "text",
  });
}

export async function fetchSurveyMetadata(
  credentials: QualtricsCredentials,
  surveyId: string,
): Promise<Record<string, unknown>> {
  const data = await qualtricsProxy<SurveyDefinitionResponse>(
    credentials.apiToken,
    {
      datacenter: credentials.datacenter,
      method: "GET",
      path: `survey-definitions/${surveyId}`,
    },
  );

  return {
    metadata: {
      surveyID: surveyId,
      ...(data.result ?? {}),
    },
  };
}

export function extractQuestionMap(
  surveyId: string,
  definition: Record<string, unknown>,
): QuestionMapEntry[] {
  const metadataBlock =
    (definition.metadata as Record<string, unknown> | undefined) ?? definition;

  const surveyElements =
    (metadataBlock.SurveyElements as Array<Record<string, unknown>> | undefined) ??
    [];

  const questions: QuestionMapEntry[] = [];

  for (const element of surveyElements) {
    if (element.Element !== "SQ") {
      continue;
    }

    const payload = element.Payload as Record<string, unknown> | undefined;
    const primaryAttribute = String(element.PrimaryAttribute ?? "");
    const questionText =
      (payload?.QuestionText as string | undefined) ??
      (payload?.QuestionDescription as string | undefined) ??
      null;

    questions.push({
      SurveyID: surveyId,
      Question: primaryAttribute,
      QID: String(element.PrimaryAttribute ?? payload?.QuestionID ?? ""),
      QuestionText: questionText,
    });
  }

  return questions;
}

export async function fetchQuestionMap(
  credentials: QualtricsCredentials,
  surveyId: string,
  metadata?: Record<string, unknown>,
): Promise<QuestionMapEntry[]> {
  const definition =
    metadata ?? (await fetchSurveyMetadata(credentials, surveyId));
  return extractQuestionMap(surveyId, definition);
}

async function startResponseExport(
  credentials: QualtricsCredentials,
  surveyId: string,
): Promise<string> {
  const data = await qualtricsProxy<ExportStartResponse>(
    credentials.apiToken,
    {
      datacenter: credentials.datacenter,
      method: "POST",
      path: `surveys/${surveyId}/export-responses`,
      body: {
        format: "csv",
        compress: true,
        includeDisplayOrder: true,
      },
    },
  );

  const progressId = data.result?.progressId ?? data.result?.id;
  if (!progressId) {
    throw new Error("Qualtrics did not return an export progress ID.");
  }

  return progressId;
}

async function waitForExport(
  credentials: QualtricsCredentials,
  surveyId: string,
  progressId: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const maxAttempts = 120;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const data = await qualtricsProxy<ExportProgressResponse>(
      credentials.apiToken,
      {
        datacenter: credentials.datacenter,
        method: "GET",
        path: `surveys/${surveyId}/export-responses/${progressId}`,
      },
    );

    const status = data.result?.status;
    const percent = data.result?.percentComplete ?? 0;
    onProgress?.(percent);

    if (status === "complete") {
      return;
    }

    if (status === "failed") {
      throw new Error("Qualtrics response export failed.");
    }

    await sleep(3000);
  }

  throw new Error("Timed out waiting for Qualtrics response export.");
}

async function downloadExportFile(
  credentials: QualtricsCredentials,
  surveyId: string,
  progressId: string,
): Promise<Uint8Array> {
  const buffer = await qualtricsProxy<ArrayBuffer>(
    credentials.apiToken,
    {
      datacenter: credentials.datacenter,
      method: "GET",
      path: `surveys/${surveyId}/export-responses/${progressId}/file`,
      responseType: "arrayBuffer",
    },
  );

  return new Uint8Array(buffer);
}

function extractCsvFromZip(zipBytes: Uint8Array): string {
  const entries = unzipSync(zipBytes);
  const csvEntry = Object.entries(entries).find(([name]) =>
    name.toLowerCase().endsWith(".csv"),
  );

  if (!csvEntry) {
    throw new Error("Export ZIP did not contain a CSV file.");
  }

  const [, csvBytes] = csvEntry;
  return new TextDecoder("utf-8").decode(csvBytes);
}

export async function fetchSurveyResponsesCsv(
  credentials: QualtricsCredentials,
  surveyId: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const progressId = await startResponseExport(credentials, surveyId);
  await waitForExport(credentials, surveyId, progressId, onProgress);
  const zipBytes = await downloadExportFile(credentials, surveyId, progressId);
  return extractCsvFromZip(zipBytes);
}

export const QSF_RATE_LIMIT_MS = 5000;
export const MAX_SURVEY_ATTEMPTS = 5;
