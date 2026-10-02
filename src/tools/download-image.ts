import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable, Transform } from "node:stream";

const ALLOWED_HOST_SUFFIXES = ["pexels.com", "unsplash.com", "pixabay.com"];
const MAX_BYTES = 50 * 1024 * 1024;
const TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 5;
const FILENAME_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export const downloadImageSchema = z.object({
  url: z.string().url().describe("URL of the image to download"),
  filename: z
    .string()
    .optional()
    .describe("Output filename (auto-generated if omitted)"),
  folder: z
    .string()
    .optional()
    .describe("Subfolder inside the download directory"),
});

export type DownloadImageInput = z.infer<typeof downloadImageSchema>;

/** Only https URLs on the three provider domains (or their subdomains) are allowed. */
export function assertAllowedUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("Only https URLs are allowed");
  }
  const host = url.hostname.toLowerCase();
  const allowed = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
  if (!allowed) {
    throw new Error(`Host not allowed: ${host}`);
  }
  return url;
}

function isInside(base: string, target: string): boolean {
  const rel = path.relative(base, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** Resolves and creates the destination folder, guaranteeing it stays inside `baseDir`. */
export function resolveFolder(baseDir: string, folder?: string): string {
  const target = path.resolve(baseDir, folder || ".");
  if (!isInside(baseDir, target)) {
    throw new Error("folder must be inside the download directory");
  }
  fs.mkdirSync(target, { recursive: true });
  // Re-check after symlink resolution.
  if (!isInside(fs.realpathSync(baseDir), fs.realpathSync(target))) {
    throw new Error("folder must be inside the download directory");
  }
  return target;
}

async function fetchValidated(rawUrl: string, init: RequestInit): Promise<Response> {
  let url = assertAllowedUrl(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(url, { ...init, redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect without location");
      url = assertAllowedUrl(new URL(location, url).toString());
      continue;
    }
    return response;
  }
  throw new Error("Too many redirects");
}

/** Unsplash requires hitting `download_location`; it answers with the real image URL. */
async function resolveUnsplashTracking(url: URL, signal: AbortSignal): Promise<string> {
  const key = process.env.UNSPLASH_API_KEY;
  if (!key) throw new Error("UNSPLASH_API_KEY is required to download Unsplash photos");
  const response = await fetchValidated(url.toString(), {
    headers: { Authorization: `Client-ID ${key}` },
    signal,
  });
  if (!response.ok) throw new Error(`Unsplash download endpoint error: ${response.status}`);
  const data = (await response.json()) as { url?: string };
  if (!data.url) throw new Error("Unsplash download endpoint returned no url");
  return data.url;
}

async function download(input: DownloadImageInput) {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const baseDir = path.resolve(process.env.STOCK_IMAGES_DOWNLOAD_DIR || "./downloads");

  if (input.filename !== undefined && !FILENAME_PATTERN.test(input.filename)) {
    throw new Error(
      "Invalid filename: use letters, digits, '_', '-', '.' only (no path separators)"
    );
  }
  if (input.filename?.includes("..")) {
    throw new Error("Invalid filename: '..' is not allowed");
  }

  let imageUrl = assertAllowedUrl(input.url);
  if (imageUrl.hostname === "api.unsplash.com") {
    imageUrl = assertAllowedUrl(await resolveUnsplashTracking(imageUrl, signal));
  }

  const folder = resolveFolder(baseDir, input.folder);
  const response = await fetchValidated(imageUrl.toString(), { signal });
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
  if (!response.body) throw new Error("No response body");

  const contentType = (response.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) throw new Error(`Unsupported content-type: ${contentType || "unknown"}`);

  const declared = Number(response.headers.get("content-length"));
  if (declared > MAX_BYTES) throw new Error("Image exceeds 50 MiB limit");

  const filename = input.filename
    ? path.extname(input.filename)
      ? input.filename
      : `${input.filename}${ext}`
    : `image-${Date.now()}${ext}`;
  const filePath = path.join(folder, filename);

  let received = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      received += chunk.length;
      if (received > MAX_BYTES) cb(new Error("Image exceeds 50 MiB limit"));
      else cb(null, chunk);
    },
  });

  // "wx": fail instead of overwriting an existing file.
  const fileStream = fs.createWriteStream(filePath, { flags: "wx" });
  try {
    await pipeline(Readable.fromWeb(response.body as never), limiter, fileStream);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(`File already exists: ${filename}`);
    }
    fs.rmSync(filePath, { force: true });
    throw error;
  }

  return { success: true, path: filePath, size: fs.statSync(filePath).size };
}

export function createDownloadImageTool() {
  return {
    name: "download_image",
    description:
      "Download a stock image (https URL on pexels.com, unsplash.com or pixabay.com) into the download directory. Refuses to overwrite existing files.",
    inputSchema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "URL of the image to download",
        },
        filename: {
          type: "string",
          description: "Output filename (auto-generated if omitted)",
        },
        folder: {
          type: "string",
          description: "Subfolder inside the download directory",
        },
      },
      required: ["url"],
    },
    handler: async (input: DownloadImageInput) => {
      try {
        const result = await download(downloadImageSchema.parse(input));
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Download failed",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  };
}
