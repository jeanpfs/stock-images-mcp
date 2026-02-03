import type { Provider, StockImage } from "../types.js";

export class PexelsProvider implements Provider {
  readonly name = "pexels" as const;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.PEXELS_API_KEY;
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
      throw new Error("Pexels API key not configured");
    }

    const params = new URLSearchParams({
      query,
      per_page: String(Math.min(count, 80)),
    });

    if (orientation) {
      params.set("orientation", orientation);
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?${params}`,
      {
        headers: {
          Authorization: this.apiKey!,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json() as {
      photos: Array<{
        id: number;
        src: { original: string; medium: string };
        alt: string;
        photographer: string;
        photographer_url: string;
        width: number;
        height: number;
      }>;
    };

    return data.photos.map((photo) => ({
      id: String(photo.id),
      provider: "pexels" as const,
      url: photo.src.original,
      thumbnail: photo.src.medium,
      description: photo.alt || "",
      author: photo.photographer,
      authorUrl: photo.photographer_url,
      downloadUrl: photo.src.original,
      width: photo.width,
      height: photo.height,
    }));
  }
}
