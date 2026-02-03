import type { Provider, StockImage } from "../types.js";

export class UnsplashProvider implements Provider {
  readonly name = "unsplash" as const;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.UNSPLASH_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async search(
    query: string,
    count: number,
    orientation?: string
  ): Promise<StockImage[]> {
    if (!this.isConfigured()) {
      throw new Error("Unsplash API key not configured");
    }

    const params = new URLSearchParams({
      query,
      per_page: String(Math.min(count, 30)),
    });

    if (orientation) {
      params.set("orientation", orientation);
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: {
          Authorization: `Client-ID ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      results: Array<{
        id: string;
        urls: { raw: string; small: string };
        alt_description: string | null;
        user: { name: string; links: { html: string } };
        width: number;
        height: number;
        links: { download: string };
      }>;
    };

    return data.results.map((photo) => ({
      id: photo.id,
      provider: "unsplash" as const,
      url: photo.urls.raw,
      thumbnail: photo.urls.small,
      description: photo.alt_description || "",
      author: photo.user.name,
      authorUrl: photo.user.links.html,
      downloadUrl: photo.links.download,
      width: photo.width,
      height: photo.height,
    }));
  }
}
