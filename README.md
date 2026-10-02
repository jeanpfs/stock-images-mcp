# Stock Images MCP

<a href="https://glama.ai/mcp/servers/@jeanpfs/stock-images-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@jeanpfs/stock-images-mcp/badge" />
</a>

An MCP (Model Context Protocol) server for searching and downloading stock images from Pexels, Unsplash, and Pixabay.

## Features

- **search_images**: Search across multiple stock image providers
- **download_image**: Download images to local folder

## Setup

### Get API Keys (at least one required)

- **Pexels**: https://www.pexels.com/api/
- **Unsplash**: https://unsplash.com/developers
- **Pixabay**: https://pixabay.com/api/docs/

### Usage with Claude Code / Cursor

Add to your MCP config (`~/.claude/mcp.json` or `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "stock-images": {
      "command": "npx",
      "args": ["-y", "stock-images-mcp"],
      "env": {
        "PEXELS_API_KEY": "your-key-here",
        "UNSPLASH_API_KEY": "your-key-here",
        "PIXABAY_API_KEY": "your-key-here"
      }
    }
  }
}
```

### Usage with Docker

```bash
docker build -t stock-images-mcp .
docker run -e PEXELS_API_KEY=xxx stock-images-mcp
```

## Tools

### search_images

Search for stock images across configured providers.

**Parameters:**

- `query` (required): Search term
- `provider`: "pexels", "unsplash", "pixabay", or "all" (default: "all")
- `count`: Number of results per provider (default: 5, max: 20)
- `orientation`: "landscape", "portrait", or "square"

### download_image

Download an image into the download directory.

**Parameters:**

- `url` (required): `https` image URL on `pexels.com`, `unsplash.com` or `pixabay.com` (pass `downloadUrl` from `search_images`)
- `filename`: Output filename — letters, digits, `_`, `-`, `.` only; extension added from the content-type if missing (auto-generated if omitted)
- `folder`: Subfolder inside the download directory

**Behavior and limits:**

- Download directory is `./downloads`, or `STOCK_IMAGES_DOWNLOAD_DIR` if set. Paths that escape it (including via symlinks) are rejected.
- Only `image/*` responses are saved; max 50 MiB; 30 s timeout; redirects are followed only to allowed hosts.
- Existing files are never overwritten.
- Unsplash downloads require `UNSPLASH_API_KEY`: the tool calls Unsplash's download endpoint, as their API guidelines require.

### Errors

Failures return `isError: true`. `search_images` also returns per-provider `errors` when some providers fail but others succeed.

## License

MIT
