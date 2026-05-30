import { normalizeDatacenter } from "@/lib/utils";

const ALLOWED_METHODS = new Set(["GET", "POST"]);

interface ProxyBody {
  datacenter?: string;
  method?: string;
  path?: string;
  body?: unknown;
  accept?: string;
}

function safeResponseHeaders(source: Headers): Headers {
  const headers = new Headers();
  const contentType = source.get("content-type");
  const contentDisposition = source.get("content-disposition");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (contentDisposition) {
    headers.set("content-disposition", contentDisposition);
  }

  return headers;
}

export async function POST(req: Request) {
  const token = req.headers.get("X-Qualtrics-Token");

  if (!token?.trim()) {
    return Response.json(
      { error: "Missing X-Qualtrics-Token header." },
      { status: 400 },
    );
  }

  let payload: ProxyBody;

  try {
    payload = (await req.json()) as ProxyBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const datacenter = payload.datacenter
    ? normalizeDatacenter(payload.datacenter)
    : "";
  const method = payload.method?.toUpperCase() ?? "GET";
  const path = payload.path?.replace(/^\/+/, "") ?? "";

  if (!datacenter || !path) {
    return Response.json(
      { error: "datacenter and path are required." },
      { status: 400 },
    );
  }

  if (!ALLOWED_METHODS.has(method)) {
    return Response.json({ error: "Unsupported HTTP method." }, { status: 405 });
  }

  const url = `https://${datacenter}.qualtrics.com/API/v3/${path}`;
  const headers: Record<string, string> = {
    "X-API-TOKEN": token.trim(),
  };

  if (payload.accept) {
    headers.Accept = payload.accept;
  } else if (method === "POST") {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body:
      method === "POST" && payload.body !== undefined
        ? JSON.stringify(payload.body)
        : undefined,
    cache: "no-store",
  });

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: safeResponseHeaders(response.headers),
  });
}
