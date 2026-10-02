import { z } from "zod";
import type { ProviderRegistry } from "../providers/index.js";

export const searchImagesShape = {
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
};

export const searchImagesSchema = z.object(searchImagesShape);

export type SearchImagesInput = z.input<typeof searchImagesSchema>;

export function createSearchImagesTool(registry: ProviderRegistry) {
  const configuredProviders = registry.getConfiguredProviderNames();

  return {
    name: "search_images",
    description: `Search stock images across providers. Available providers: ${
      configuredProviders.length > 0
        ? configuredProviders.join(", ")
        : "NONE CONFIGURED - set at least one API key"
    }`,
    inputSchema: searchImagesShape,
    handler: async (input: SearchImagesInput) => {
      const reply = (payload: unknown, isError = false) => ({
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
        ...(isError ? { isError: true } : {}),
      });

      try {
        const validated = searchImagesSchema.parse(input);
        const { images, errors } = await registry.search(
          validated.query,
          validated.count,
          validated.orientation,
          validated.provider
        );

        if (images.length === 0 && errors.length > 0) {
          return reply({ error: "All providers failed", errors }, true);
        }

        return reply({
          images,
          count: images.length,
          providers: [...new Set(images.map((i) => i.provider))],
          ...(errors.length > 0 ? { errors } : {}),
        });
      } catch (error) {
        return reply({ error: error instanceof Error ? error.message : "Search failed" }, true);
      }
    },
  };
}
