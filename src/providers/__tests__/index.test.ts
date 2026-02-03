import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProviderRegistry } from "../index.js";

describe("ProviderRegistry", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return empty configured list when no keys set", () => {
    vi.stubEnv("PEXELS_API_KEY", "");
    vi.stubEnv("UNSPLASH_API_KEY", "");
    vi.stubEnv("PIXABAY_API_KEY", "");
    const registry = new ProviderRegistry();
    expect(registry.getConfiguredProviders()).toHaveLength(0);
  });

  it("should return configured providers when keys set", () => {
    vi.stubEnv("PEXELS_API_KEY", "test-key");
    vi.stubEnv("UNSPLASH_API_KEY", "");
    vi.stubEnv("PIXABAY_API_KEY", "test-key");
    const registry = new ProviderRegistry();
    const configured = registry.getConfiguredProviders();
    expect(configured.map(p => p.name)).toEqual(["pexels", "pixabay"]);
  });

  it("should report hasAnyConfigured correctly", () => {
    vi.stubEnv("PEXELS_API_KEY", "");
    vi.stubEnv("UNSPLASH_API_KEY", "test");
    vi.stubEnv("PIXABAY_API_KEY", "");
    const registry = new ProviderRegistry();
    expect(registry.hasAnyConfigured()).toBe(true);
  });
});
