import type { Provider, StockImage } from "../types.js";

export class PixabayProvider implements Provider {
  readonly name = "pixabay" as const;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.PIXABAY_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async search(query: string, count: number, orientation?: string): Promise<StockImage[]> {
    if (!this.isConfigured()) {
      throw new Error("Pixabay API key not configured");
    }

    const squareOnly = orientation === "square";
    // Pixabay has no square filter: over-fetch, then filter client-side.
    const perPage = squareOnly ? count * 5 : count;
    const params = new URLSearchParams({
      key: this.apiKey!,
      q: query,
      per_page: String(Math.max(3, Math.min(perPage, 200))),
      image_type: "photo",
    });

    if (orientation === "landscape") {
      params.set("orientation", "horizontal");
    } else if (orientation === "portrait") {
      params.set("orientation", "vertical");
    }

    const response = await fetch(`https://pixabay.com/api/?${params}`);

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      hits: Array<{
        id: number;
        largeImageURL: string;
        previewURL: string;
        tags: string;
        user: string;
        userImageURL: string;
        imageWidth: number;
        imageHeight: number;
      }>;
    };

    const images = data.hits.map((photo) => ({
      id: String(photo.id),
      provider: "pixabay" as const,
      url: photo.largeImageURL,
      thumbnail: photo.previewURL,
      description: photo.tags,
      author: photo.user,
      authorUrl: `https://pixabay.com/users/${encodeURIComponent(photo.user)}`,
      downloadUrl: photo.largeImageURL,
      width: photo.imageWidth,
      height: photo.imageHeight,
    }));

    if (!squareOnly) return images;
    return images
      .filter((i) => Math.abs(i.width - i.height) <= Math.max(i.width, i.height) * 0.1)
      .slice(0, count);
  }
}
