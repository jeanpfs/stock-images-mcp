import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnsplashProvider } from "../unsplash.js";

describe("UnsplashProvider", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("should report not configured when no API key", () => {
    vi.stubEnv("UNSPLASH_API_KEY", "");
    const provider = new UnsplashProvider();
    expect(provider.isConfigured()).toBe(false);
  });

  it("should report configured when API key exists", () => {
    vi.stubEnv("UNSPLASH_API_KEY", "test-key");
    const provider = new UnsplashProvider();
    expect(provider.isConfigured()).toBe(true);
  });

  it("should have correct name", () => {
    const provider = new UnsplashProvider();
    expect(provider.name).toBe("unsplash");
  });
});
