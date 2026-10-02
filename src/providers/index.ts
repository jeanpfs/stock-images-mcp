import type { Provider, ProviderError, SearchOutcome, StockImage } from "../types.js";
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
  ): Promise<SearchOutcome> {
    if (!this.hasAnyConfigured()) {
      throw new Error(
        "No API keys configured. Set at least one: PEXELS_API_KEY, UNSPLASH_API_KEY, or PIXABAY_API_KEY"
      );
    }

    let targetProviders: Provider[];
    if (providerName && providerName !== "all") {
      const provider = this.getProvider(providerName);
      if (!provider?.isConfigured()) {
        throw new Error(`Provider "${providerName}" is not configured`);
      }
      targetProviders = [provider];
    } else {
      targetProviders = this.getConfiguredProviders();
    }

    const results = await Promise.allSettled(
      targetProviders.map((p) => p.search(query, count, orientation))
    );

    const images: StockImage[] = [];
    const errors: ProviderError[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        images.push(...r.value);
      } else {
        errors.push({
          provider: targetProviders[i].name,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        });
      }
    });
    return { images, errors };
  }
}

export { PexelsProvider } from "./pexels.js";
export { UnsplashProvider } from "./unsplash.js";
export { PixabayProvider } from "./pixabay.js";
