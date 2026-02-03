import { describe, it, expect, vi, beforeEach } from "vitest";
import { PexelsProvider } from "../pexels.js";

describe("PexelsProvider", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("should report not configured when no API key", () => {
    vi.stubEnv("PEXELS_API_KEY", "");
    const provider = new PexelsProvider();
    expect(provider.isConfigured()).toBe(false);
  });

  it("should report configured when API key exists", () => {
    vi.stubEnv("PEXELS_API_KEY", "test-key");
    const provider = new PexelsProvider();
    expect(provider.isConfigured()).toBe(true);
  });

  it("should have correct name", () => {
    const provider = new PexelsProvider();
    expect(provider.name).toBe("pexels");
  });
});
