export interface QualtricsCredentials {
  datacenter: string;
  apiToken: string;
}

export interface QualtricsSurvey {
  id: string;
  name: string;
  ownerId: string;
  lastModified: string;
  isActive: boolean;
}

export interface ProxyRequest {
  datacenter: string;
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  accept?: string;
  responseType?: "json" | "text" | "arrayBuffer";
}

export interface QuestionMapEntry {
  SurveyID: string;
  Question: string;
  QID: string;
  QuestionText: string | null;
}

export type BackupPhase =
  | "qsf"
  | "responses"
  | "metadata"
  | "question_data"
  | "catalog";

export type BackupItemStatus = "pending" | "running" | "complete" | "failed";

export interface BackupProgressEvent {
  phase: BackupPhase;
  surveyIndex: number;
  surveyTotal: number;
  surveyId: string;
  surveyName: string;
  status: BackupItemStatus;
  attempt?: number;
  maxAttempts?: number;
  message?: string;
  error?: string;
}

export interface BackupFile {
  path: string;
  content: string | Uint8Array;
}

export interface SurveyBackupResult {
  surveyId: string;
  surveyName: string;
  qsfStatus: BackupItemStatus;
  dataStatus: BackupItemStatus;
  errors: string[];
}
