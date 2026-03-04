import type {
  CloudAgent,
  AgentConversation,
  Repository,
  Artifact,
  CreateAgentRequest,
  FollowUpRequest,
} from "./types.js";

const BASE_URL = "https://api.cursor.com";

export class CursorApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "CursorApiError";
  }
}

async function request<T>(
  path: string,
  apiKey: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CursorApiError(
      res.status,
      `Cursor API ${res.status}: ${body || res.statusText}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function listAgents(
  apiKey: string,
  limit = 100,
): Promise<CloudAgent[]> {
  const data = await request<{ agents: CloudAgent[]; nextCursor?: string }>(
    `/v0/agents?limit=${limit}`,
    apiKey,
  );
  return data.agents ?? [];
}

export async function getAgent(
  apiKey: string,
  agentId: string,
): Promise<CloudAgent> {
  return request<CloudAgent>(`/v0/agents/${agentId}`, apiKey);
}

export async function getConversation(
  apiKey: string,
  agentId: string,
): Promise<AgentConversation> {
  return request<AgentConversation>(
    `/v0/agents/${agentId}/conversation`,
    apiKey,
  );
}

export async function listArtifacts(
  apiKey: string,
  agentId: string,
): Promise<Artifact[]> {
  const data = await request<{ artifacts: Artifact[] }>(
    `/v0/agents/${agentId}/artifacts`,
    apiKey,
  );
  return data.artifacts ?? [];
}

export async function createAgent(
  apiKey: string,
  params: CreateAgentRequest,
): Promise<CloudAgent> {
  return request<CloudAgent>("/v0/agents", apiKey, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function followUpAgent(
  apiKey: string,
  agentId: string,
  params: FollowUpRequest,
): Promise<void> {
  await request(`/v0/agents/${agentId}/followup`, apiKey, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function stopAgent(
  apiKey: string,
  agentId: string,
): Promise<void> {
  await request(`/v0/agents/${agentId}/stop`, apiKey, { method: "POST" });
}

export async function deleteAgent(
  apiKey: string,
  agentId: string,
): Promise<void> {
  await request(`/v0/agents/${agentId}`, apiKey, { method: "DELETE" });
}

export async function listRepositories(
  apiKey: string,
): Promise<Repository[]> {
  const data = await request<{ repositories: Repository[] }>(
    "/v0/repositories",
    apiKey,
  );
  return data.repositories ?? [];
}

export async function listModels(apiKey: string): Promise<string[]> {
  const data = await request<{ models: string[] }>("/v0/models", apiKey);
  return data.models ?? [];
}

export async function getMe(
  apiKey: string,
): Promise<{ apiKeyName: string; createdAt: string; userEmail?: string }> {
  return request("/v0/me", apiKey);
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await getMe(apiKey);
    return true;
  } catch {
    return false;
  }
}
