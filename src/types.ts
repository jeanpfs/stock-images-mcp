export type ProviderName = "pexels" | "unsplash" | "pixabay";

export interface StockImage {
  id: string;
  provider: ProviderName;
  url: string;
  thumbnail: string;
  description: string;
  author: string;
  authorUrl: string;
  /** URL to pass to `download_image`. For Unsplash this is the tracking endpoint. */
  downloadUrl: string;
  width: number;
  height: number;
}

export interface ProviderError {
  provider: ProviderName;
  error: string;
}

export interface SearchOutcome {
  images: StockImage[];
  errors: ProviderError[];
}

export interface Provider {
  name: ProviderName;
  isConfigured(): boolean;
  search(query: string, count: number, orientation?: string): Promise<StockImage[]>;
}
