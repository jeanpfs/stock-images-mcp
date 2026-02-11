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

Download an image to local folder.

**Parameters:**
- `url` (required): Image URL
- `filename`: Output filename (auto-generated if omitted)
- `folder`: Destination folder (default: "./downloads")

## License

MIT
