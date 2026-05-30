import type { ProxyRequest } from "./types";
import { normalizeDatacenter } from "@/lib/utils";

export class QualtricsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string,
  ) {
    super(message);
    this.name = "QualtricsApiError";
  }
}

export async function qualtricsProxy<T = unknown>(
  token: string,
  request: ProxyRequest,
): Promise<T> {
  const response = await fetch("/api/qualtrics/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Qualtrics-Token": token,
    },
    body: JSON.stringify({
      ...request,
      datacenter: normalizeDatacenter(request.datacenter),
    }),
  });

  const responseType = request.responseType ?? "json";

  if (!response.ok) {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      bodyText = "";
    }
    throw new QualtricsApiError(
      `Qualtrics request failed (${response.status})`,
      response.status,
      bodyText,
    );
  }

  if (responseType === "arrayBuffer") {
    return (await response.arrayBuffer()) as T;
  }

  if (responseType === "text") {
    return (await response.text()) as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
