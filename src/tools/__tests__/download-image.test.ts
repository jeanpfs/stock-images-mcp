import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  assertAllowedUrl,
  createDownloadImageTool,
  resolveFolder,
} from "../download-image.js";

const PNG: Uint8Array<ArrayBuffer> = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function imageResponse(type = "image/png", body: Uint8Array<ArrayBuffer> = PNG) {
  return new Response(new Blob([body]), { status: 200, headers: { "content-type": type } });
}

describe("assertAllowedUrl", () => {
  it.each([
    "http://images.pexels.com/a.jpg",
    "https://localhost/a.jpg",
    "https://169.254.169.254/latest",
    "https://evilpexels.com/a.jpg",
    "https://pexels.com.evil.io/a.jpg",
    "file:///etc/passwd",
  ])("rejects %s", (url) => {
    expect(() => assertAllowedUrl(url)).toThrow();
  });

  it.each([
    "https://images.pexels.com/a.jpg",
    "https://images.unsplash.com/a",
    "https://cdn.pixabay.com/a.jpg",
    "https://pixabay.com/a.jpg",
  ])("accepts %s", (url) => {
    expect(assertAllowedUrl(url).href).toBe(url);
  });
});

describe("download_image", () => {
  let base: string;
  const tool = createDownloadImageTool();
  const run = async (input: { url: string; filename?: string; folder?: string }) => {
    const res = await tool.handler(input);
    return { res, body: JSON.parse(res.content[0].text) };
  };

  beforeEach(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), "dl-"));
    vi.stubEnv("STOCK_IMAGES_DOWNLOAD_DIR", base);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fs.rmSync(base, { recursive: true, force: true });
  });

  it("saves the image and appends the extension from content-type", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse()));
    const { body } = await run({
      url: "https://images.pexels.com/a",
      filename: "cat",
    });
    expect(body.success).toBe(true);
    expect(body.path).toBe(path.join(base, "cat.png"));
    expect(fs.readFileSync(body.path)).toEqual(Buffer.from(PNG));
  });

  it.each(["../evil.png", "a/b.png", "..", "a\\b.png", ".hidden"])(
    "rejects filename %s",
    async (filename) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse()));
      const { res, body } = await run({ url: "https://images.pexels.com/a", filename });
      expect(res.isError).toBe(true);
      expect(body.success).toBe(false);
    }
  );

  it("rejects folders that escape the download directory", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse()));
    const { res } = await run({
      url: "https://images.pexels.com/a",
      folder: "../outside",
    });
    expect(res.isError).toBe(true);
    expect(fs.existsSync(path.join(base, "..", "outside"))).toBe(false);
  });

  it("rejects folders that escape through a symlink", () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "out-"));
    fs.symlinkSync(outside, path.join(base, "link"));
    expect(() => resolveFolder(base, "link")).toThrow(/inside/);
    fs.rmSync(outside, { recursive: true, force: true });
  });

  it("rejects non-image content-type", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse("text/html")));
    const { res, body } = await run({ url: "https://images.pexels.com/a" });
    expect(res.isError).toBe(true);
    expect(body.error).toMatch(/content-type/);
    expect(fs.readdirSync(base)).toEqual([]);
  });

  it("refuses to overwrite and keeps the original", async () => {
    fs.writeFileSync(path.join(base, "cat.png"), "original");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse()));
    const { res, body } = await run({
      url: "https://images.pexels.com/a",
      filename: "cat.png",
    });
    expect(res.isError).toBe(true);
    expect(body.error).toMatch(/already exists/);
    expect(fs.readFileSync(path.join(base, "cat.png"), "utf8")).toBe("original");
  });

  it("refuses redirects to hosts outside the allowlist", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "https://169.254.169.254/latest" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { res, body } = await run({ url: "https://images.pexels.com/a" });
    expect(res.isError).toBe(true);
    expect(body.error).toMatch(/not allowed/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("aborts when the body exceeds the size limit and removes the partial file", async () => {
    const huge = new Response(
      new ReadableStream({
        pull(controller) {
          controller.enqueue(new Uint8Array(8 * 1024 * 1024));
        },
      }),
      { status: 200, headers: { "content-type": "image/png" } }
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(huge));
    const { res, body } = await run({
      url: "https://images.pexels.com/a",
      filename: "big.png",
    });
    expect(res.isError).toBe(true);
    expect(body.error).toMatch(/50 MiB/);
    expect(fs.existsSync(path.join(base, "big.png"))).toBe(false);
  });

  it("resolves Unsplash download_location through the API with the key", async () => {
    vi.stubEnv("UNSPLASH_API_KEY", "k");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ url: "https://images.unsplash.com/photo-1" })
      )
      .mockResolvedValueOnce(imageResponse());
    vi.stubGlobal("fetch", fetchMock);
    const { body } = await run({
      url: "https://api.unsplash.com/photos/abc/download?ixid=1",
      filename: "u.png",
    });
    expect(body.success).toBe(true);
    const [firstUrl, firstInit] = fetchMock.mock.calls[0];
    expect(String(firstUrl)).toContain("api.unsplash.com/photos/abc/download");
    expect(firstInit.headers.Authorization).toBe("Client-ID k");
    expect(String(fetchMock.mock.calls[1][0])).toBe("https://images.unsplash.com/photo-1");
  });
});
