import type { Provider, StockImage } from "../types.js";
import { PexelsProvider } from "./pexels.js";
import { UnsplashProvider } from "./unsplash.js";
import { PixabayProvider } from "./pixabay.js";

export class ProviderRegistry {
  private providers: Provider[];

  constructor() {
    this.providers = [
      new PexelsProvider(),
      new UnsplashProvider(),
      new PixabayProvider(),
    ];
  }

  getConfiguredProviders(): Provider[] {
    return this.providers.filter((p) => p.isConfigured());
  }

  getConfiguredProviderNames(): string[] {
    return this.getConfiguredProviders().map((p) => p.name);
  }

  hasAnyConfigured(): boolean {
    return this.getConfiguredProviders().length > 0;
  }

  getProvider(name: string): Provider | undefined {
    return this.providers.find((p) => p.name === name);
  }

  async search(
    query: string,
    count: number,
    orientation?: string,
    providerName?: string
  ): Promise<StockImage[]> {
    if (!this.hasAnyConfigured()) {
      throw new Error(
        "No API keys configured. Set at least one: PEXELS_API_KEY, UNSPLASH_API_KEY, or PIXABAY_API_KEY"
      );
    }

    const targetProviders =
      providerName && providerName !== "all"
        ? [this.getProvider(providerName)].filter(Boolean) as Provider[]
        : this.getConfiguredProviders();

    if (targetProviders.length === 0) {
      throw new Error(`Provider "${providerName}" is not configured`);
    }

    const results = await Promise.allSettled(
      targetProviders.map((p) => p.search(query, count, orientation))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<StockImage[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);
  }
}

export { PexelsProvider } from "./pexels.js";
export { UnsplashProvider } from "./unsplash.js";
export { PixabayProvider } from "./pixabay.js";
