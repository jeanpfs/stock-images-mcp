import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PixabayProvider } from "../pixabay.js";

describe("PixabayProvider", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should report not configured when no API key", () => {
    vi.stubEnv("PIXABAY_API_KEY", "");
    const provider = new PixabayProvider();
    expect(provider.isConfigured()).toBe(false);
  });

  it("should report configured when API key exists", () => {
    vi.stubEnv("PIXABAY_API_KEY", "test-key");
    const provider = new PixabayProvider();
    expect(provider.isConfigured()).toBe(true);
  });

  it("should have correct name", () => {
    const provider = new PixabayProvider();
    expect(provider.name).toBe("pixabay");
  });

  it("should enforce minimum per_page of 3 for Pixabay API", async () => {
    vi.stubEnv("PIXABAY_API_KEY", "test-key");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hits: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = new PixabayProvider();
    await provider.search("test", 1);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("per_page=3");
  });

  it("should map orientation landscape to horizontal", async () => {
    vi.stubEnv("PIXABAY_API_KEY", "test-key");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hits: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const provider = new PixabayProvider();
    await provider.search("test", 5, "landscape");

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("orientation=horizontal");
  });
});
