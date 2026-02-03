import { z } from "zod";
import type { ProviderRegistry } from "../providers/index.js";

export const searchImagesSchema = z.object({
  query: z.string().describe("Search term for images"),
  provider: z
    .enum(["pexels", "unsplash", "pixabay", "all"])
    .optional()
    .default("all")
    .describe("Which provider to search (default: all configured)"),
  count: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(5)
    .describe("Number of images per provider (default: 5, max: 20)"),
  orientation: z
    .enum(["landscape", "portrait", "square"])
    .optional()
    .describe("Image orientation filter"),
});

export type SearchImagesInput = z.infer<typeof searchImagesSchema>;

export function createSearchImagesTool(registry: ProviderRegistry) {
  const configuredProviders = registry.getConfiguredProviderNames();

  return {
    name: "search_images",
    description: `Search stock images across providers. Available providers: ${
      configuredProviders.length > 0
        ? configuredProviders.join(", ")
        : "NONE CONFIGURED - set at least one API key"
    }`,
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search term for images",
        },
        provider: {
          type: "string",
          enum: ["pexels", "unsplash", "pixabay", "all"],
          default: "all",
          description: "Which provider to search (default: all configured)",
        },
        count: {
          type: "number",
          minimum: 1,
          maximum: 20,
          default: 5,
          description: "Number of images per provider (default: 5, max: 20)",
        },
        orientation: {
          type: "string",
          enum: ["landscape", "portrait", "square"],
          description: "Image orientation filter",
        },
      },
      required: ["query"],
    },
    handler: async (input: SearchImagesInput) => {
      const validated = searchImagesSchema.parse(input);

      if (!registry.hasAnyConfigured()) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error:
                  "No API keys configured. Set at least one: PEXELS_API_KEY, UNSPLASH_API_KEY, or PIXABAY_API_KEY",
              }),
            },
          ],
        };
      }

      try {
        const images = await registry.search(
          validated.query,
          validated.count,
          validated.orientation,
          validated.provider
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                images,
                count: images.length,
                providers: [...new Set(images.map((i) => i.provider))],
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
                error: error instanceof Error ? error.message : "Search failed",
              }),
            },
          ],
        };
      }
    },
  };
}
