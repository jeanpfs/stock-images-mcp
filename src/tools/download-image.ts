import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export const downloadImageSchema = z.object({
  url: z.string().url().describe("URL of the image to download"),
  filename: z
    .string()
    .optional()
    .describe("Output filename (auto-generated if omitted)"),
  folder: z
    .string()
    .optional()
    .default("./downloads")
    .describe("Destination folder (default: ./downloads)"),
});

export type DownloadImageInput = z.infer<typeof downloadImageSchema>;

export function createDownloadImageTool() {
  return {
    name: "download_image",
    description: "Download a stock image to local folder",
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
          default: "./downloads",
          description: "Destination folder (default: ./downloads)",
        },
      },
      required: ["url"],
    },
    handler: async (input: DownloadImageInput) => {
      const validated = downloadImageSchema.parse(input);

      try {
        // Ensure folder exists
        const folder = validated.folder || "./downloads";
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }

        // Fetch image
        const response = await fetch(validated.url);
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.status}`);
        }

        // Determine filename
        const contentType = response.headers.get("content-type") || "";
        const ext = contentType.includes("png")
          ? ".png"
          : contentType.includes("webp")
          ? ".webp"
          : ".jpg";

        const filename =
          validated.filename ||
          `image-${Date.now()}${ext}`;

        const filePath = path.join(folder, filename);

        // Save file
        const body = response.body;
        if (!body) {
          throw new Error("No response body");
        }

        const fileStream = fs.createWriteStream(filePath);
        await pipeline(Readable.fromWeb(body as any), fileStream);

        const stats = fs.statSync(filePath);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                path: path.resolve(filePath),
                size: stats.size,
              }),
            },
          ],
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
        };
      }
    },
  };
}
