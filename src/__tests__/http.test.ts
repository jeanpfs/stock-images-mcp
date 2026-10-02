import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchProviderJson } from "../http.js";

const fast = { baseDelayMs: 1 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchProviderJson", () => {
  it("retries 429 and 5xx gateway errors, then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429 }))
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchProviderJson("X", "https://x", {}, fast)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("gives up after the retry budget with the last status", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response("", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchProviderJson("X", "https://x", {}, fast)).rejects.toThrow("X API error: 503");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([400, 401, 403, 404, 500])("does not retry %i", async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchProviderJson("X", "https://x", {}, fast)).rejects.toThrow(
      `X API error: ${status}`
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries network errors and surfaces the last one with its cause", async () => {
    const boom = new TypeError("fetch failed");
    const fetchMock = vi.fn().mockRejectedValue(boom);
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchProviderJson("X", "https://x", {}, fast)).rejects.toMatchObject({
      message: "X request failed: fetch failed",
      cause: boom,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("passes an abort signal so hung requests time out", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
    await fetchProviderJson("X", "https://x", {}, fast);
    expect(fetchMock.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal);
  });
});
