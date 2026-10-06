# Stock Images MCP

[![CI](https://github.com/jeanpfs/stock-images-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/jeanpfs/stock-images-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/stock-images-mcp)](https://www.npmjs.com/package/stock-images-mcp)
[![license](https://img.shields.io/npm/l/stock-images-mcp)](LICENSE)

An MCP (Model Context Protocol) server for searching and downloading stock images from Pexels, Unsplash, and Pixabay.

## Features

- **search_images**: search one or all configured providers; partial failures are reported per provider
- **download_image**: download an image safely into a local folder

## Setup

### Get API keys (at least one required)

| Provider | Env var            | Get a key                       |
| -------- | ------------------ | ------------------------------- |
| Pexels   | `PEXELS_API_KEY`   | https://www.pexels.com/api/     |
| Unsplash | `UNSPLASH_API_KEY` | https://unsplash.com/developers |
| Pixabay  | `PIXABAY_API_KEY`  | https://pixabay.com/api/docs/   |

Optional: `STOCK_IMAGES_DOWNLOAD_DIR` — where `download_image` writes files (default `./downloads`).

### Claude Code / Cursor / Claude Desktop

Add to your MCP config (`~/.claude/mcp.json`, `~/.cursor/mcp.json`, or `claude_desktop_config.json`):

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

Requires Node.js 20+.

### Docker

```bash
docker build -t stock-images-mcp .
docker run -i --rm -e PEXELS_API_KEY=xxx -v "$PWD/downloads:/downloads" stock-images-mcp
```

### From source

```bash
git clone https://github.com/jeanpfs/stock-images-mcp.git
cd stock-images-mcp
npm ci && npm run build
PEXELS_API_KEY=xxx node dist/index.js
```

## Tools

### search_images

Search for stock images across configured providers.

**Parameters:**

- `query` (required): search term
- `provider`: `"pexels"`, `"unsplash"`, `"pixabay"`, or `"all"` (default: `"all"`)
- `count`: results per provider (default 5, max 20)
- `orientation`: `"landscape"`, `"portrait"`, or `"square"`

Each result has `id`, `provider`, `url`, `thumbnail`, `description`, `author`, `authorUrl`, `downloadUrl`, `width`, `height`. Pass `downloadUrl` to `download_image`.

### download_image

Download an image into the download directory.

**Parameters:**

- `url` (required): `https` image URL on `pexels.com`, `unsplash.com` or `pixabay.com` (use `downloadUrl` from `search_images`)
- `filename`: output name — letters, digits, `_`, `-`, `.` only; the extension is added from the content-type if missing (auto-generated if omitted)
- `folder`: subfolder inside the download directory

**Behavior and limits:**

- Download directory is `./downloads`, or `STOCK_IMAGES_DOWNLOAD_DIR` if set. Paths that escape it (including via symlinks) are rejected.
- Only `image/*` responses are saved; max 50 MiB; 30 s timeout; redirects are followed only to allowed hosts.
- Existing files are never overwritten.
- Unsplash downloads require `UNSPLASH_API_KEY`: the tool calls Unsplash's download endpoint, as their API guidelines require.

### Errors

Failures return `isError: true`. `search_images` also returns a per-provider `errors` list when some providers fail but others succeed. Provider requests time out after 10 s and are retried on network errors, 429 and 502/503/504.

## Attribution and licensing

Images stay under each provider's license. Credit the photographer where the provider requires it (`author` and `authorUrl` are returned for that purpose) and review the terms: [Pexels](https://www.pexels.com/license/), [Unsplash](https://unsplash.com/license), [Pixabay](https://pixabay.com/service/license-summary/).

## Development

```bash
npm ci
npm run lint && npm run format:check && npm run typecheck && npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

MIT
