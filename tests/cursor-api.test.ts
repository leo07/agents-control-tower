import { describe, it, expect, vi, beforeEach } from "vitest";
import { CursorApiError } from "../src/lib/cursor-api.js";

describe("CursorApiError", () => {
  it("captures status code and message", () => {
    const err = new CursorApiError(401, "Unauthorized");
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("Unauthorized");
    expect(err.name).toBe("CursorApiError");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("cursor-api module", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("listAgents calls correct endpoint", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          agents: [
            {
              id: "bc-1",
              name: "Test agent",
              status: "RUNNING",
              source: { repository: "github.com/user/repo" },
              target: { url: "https://cursor.com/agents/bc-1" },
              createdAt: "2026-03-04T10:00:00Z",
            },
          ],
          nextCursor: "bc-1",
        }),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

    const { listAgents } = await import("../src/lib/cursor-api.js");
    const agents = await listAgents("test-key");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.cursor.com/v0/agents?limit=100",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      }),
    );
    expect(agents).toHaveLength(1);
    expect(agents[0]!.id).toBe("bc-1");
    expect(agents[0]!.name).toBe("Test agent");
    expect(agents[0]!.status).toBe("RUNNING");
  });

  it("throws CursorApiError on non-ok response", async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve("Invalid token"),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

    const { listAgents } = await import("../src/lib/cursor-api.js");

    await expect(listAgents("bad-key")).rejects.toThrow(CursorApiError);
    await expect(listAgents("bad-key")).rejects.toThrow("401");
  });

  it("validateApiKey uses /v0/me endpoint", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          apiKeyName: "Test Key",
          createdAt: "2026-01-01T00:00:00Z",
        }),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

    const { validateApiKey } = await import("../src/lib/cursor-api.js");
    expect(await validateApiKey("good-key")).toBe(true);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.cursor.com/v0/me",
      expect.anything(),
    );
  });

  it("validateApiKey returns false on failure", async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve(""),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

    const { validateApiKey } = await import("../src/lib/cursor-api.js");
    expect(await validateApiKey("bad-key")).toBe(false);
  });

  it("createAgent sends correct request body", async () => {
    const mockResponse = {
      ok: true,
      status: 201,
      json: () =>
        Promise.resolve({
          id: "bc-new",
          name: "New Agent",
          status: "CREATING",
          source: { repository: "https://github.com/user/repo" },
          target: { url: "https://cursor.com/agents/bc-new" },
          createdAt: "2026-03-04T10:00:00Z",
        }),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

    const { createAgent } = await import("../src/lib/cursor-api.js");
    const agent = await createAgent("key", {
      prompt: { text: "Add tests" },
      source: { repository: "https://github.com/user/repo" },
      model: "claude-4-sonnet",
    });

    expect(agent.id).toBe("bc-new");
    expect(agent.status).toBe("CREATING");

    const call = vi.mocked(fetch).mock.calls[0]!;
    const body = JSON.parse(call[1]!.body as string);
    expect(body.prompt.text).toBe("Add tests");
    expect(body.source.repository).toBe("https://github.com/user/repo");
    expect(body.model).toBe("claude-4-sonnet");
  });
});
