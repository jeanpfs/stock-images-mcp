import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProviderRegistry } from "../../providers/index.js";
import { createSearchImagesTool } from "../search-images.js";

const pexelsPayload = {
  photos: [
    {
      id: 1,
      width: 10,
      height: 10,
      alt: "x",
      photographer: "p",
      photographer_url: "https://www.pexels.com/@p",
      src: { original: "o", large2x: "l", medium: "m" },
    },
  ],
};

function mockFetch(routes: Record<string, () => Response>) {
  return vi.fn(async (input: unknown) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) throw new Error(`unexpected fetch ${url}`);
    return routes[key]!();
  });
}

describe("search_images", () => {
  beforeEach(() => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    vi.stubEnv("UNSPLASH_API_KEY", "k");
    vi.stubEnv("PIXABAY_API_KEY", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const call = async (input: object) => {
    const tool = createSearchImagesTool(new ProviderRegistry());
    const res = await tool.handler(input as never);
    return { res, body: JSON.parse(res.content[0]!.text) };
  };

  it("reports partial failures next to successful results", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        "api.pexels.com": () => Response.json(pexelsPayload),
        "api.unsplash.com": () => new Response("rate limited", { status: 403 }),
      })
    );
    const { res, body } = await call({ query: "cat" });
    expect(res.isError).toBeUndefined();
    expect(body.count).toBe(1);
    expect(body.errors).toEqual([{ provider: "unsplash", error: "Unsplash API error: 403" }]);
  });

  it("flags isError when every provider fails", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        "api.pexels.com": () => new Response("", { status: 500 }),
        "api.unsplash.com": () => new Response("", { status: 500 }),
      })
    );
    const { res, body } = await call({ query: "cat" });
    expect(res.isError).toBe(true);
    expect(body.errors).toHaveLength(2);
  });

  it("errors when the requested provider has no key", async () => {
    const { res, body } = await call({ query: "cat", provider: "pixabay" });
    expect(res.isError).toBe(true);
    expect(body.error).toMatch(/not configured/);
  });

  it("flags isError on invalid input", async () => {
    const { res } = await call({ query: "cat", count: 99 });
    expect(res.isError).toBe(true);
  });

  it("maps square to Unsplash 'squarish'", async () => {
    const fetchMock = mockFetch({
      "api.unsplash.com": () => Response.json({ results: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await call({ query: "cat", provider: "unsplash", orientation: "square" });
    expect(String(fetchMock.mock.calls[0]![0])).toContain("orientation=squarish");
  });

  it("filters Pixabay results client-side for square", async () => {
    vi.stubEnv("PIXABAY_API_KEY", "k");
    const hit = (id: number, w: number, h: number) => ({
      id,
      largeImageURL: "l",
      previewURL: "p",
      tags: "t",
      user: "u",
      userImageURL: "",
      imageWidth: w,
      imageHeight: h,
    });
    vi.stubGlobal(
      "fetch",
      mockFetch({
        "pixabay.com/api": () =>
          Response.json({ hits: [hit(1, 100, 50), hit(2, 100, 98), hit(3, 40, 100)] }),
      })
    );
    const { body } = await call({ query: "cat", provider: "pixabay", orientation: "square" });
    expect(body.images.map((i: { id: string }) => i.id)).toEqual(["2"]);
  });
});
