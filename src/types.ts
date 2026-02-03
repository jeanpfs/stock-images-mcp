export interface StockImage {
  id: string;
  provider: "pexels" | "unsplash" | "pixabay";
  url: string;
  thumbnail: string;
  description: string;
  author: string;
  authorUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
}

export interface SearchParams {
  query: string;
  provider?: "pexels" | "unsplash" | "pixabay" | "all";
  count?: number;
  orientation?: "landscape" | "portrait" | "square";
}

export interface SearchResult {
  images: StockImage[];
  providers: string[];
}

export interface DownloadParams {
  url: string;
  filename?: string;
  folder?: string;
}

export interface DownloadResult {
  success: boolean;
  path: string;
  size: number;
}

export interface ProviderConfig {
  name: string;
  isConfigured: boolean;
  apiKey?: string;
}

export interface Provider {
  name: "pexels" | "unsplash" | "pixabay";
  isConfigured(): boolean;
  search(query: string, count: number, orientation?: string): Promise<StockImage[]>;
}
