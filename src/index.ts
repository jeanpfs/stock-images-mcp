#!/usr/bin/env node

import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { ProviderRegistry } from "./providers/index.js";
import { createSearchImagesTool } from "./tools/search-images.js";
import { createDownloadImageTool } from "./tools/download-image.js";

// Resolves to the package root from both src/ and dist/.
const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

const server = new McpServer({ name: "stock-images-mcp", version });

const searchTool = createSearchImagesTool(new ProviderRegistry());
const downloadTool = createDownloadImageTool();

server.registerTool(
  searchTool.name,
  { description: searchTool.description, inputSchema: searchTool.inputSchema },
  searchTool.handler
);
server.registerTool(
  downloadTool.name,
  { description: downloadTool.description, inputSchema: downloadTool.inputSchema },
  downloadTool.handler
);

async function main() {
  await server.connect(new StdioServerTransport());
  console.error(`Stock Images MCP server v${version} running on stdio`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
