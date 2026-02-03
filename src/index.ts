#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { ProviderRegistry } from "./providers/index.js";
import { createSearchImagesTool } from "./tools/search-images.js";
import { createDownloadImageTool } from "./tools/download-image.js";

const registry = new ProviderRegistry();
const searchTool = createSearchImagesTool(registry);
const downloadTool = createDownloadImageTool();

const server = new Server(
  {
    name: "stock-images-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: searchTool.name,
        description: searchTool.description,
        inputSchema: searchTool.inputSchema,
      },
      {
        name: downloadTool.name,
        description: downloadTool.description,
        inputSchema: downloadTool.inputSchema,
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "search_images":
      return searchTool.handler(args as any);
    case "download_image":
      return downloadTool.handler(args as any);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stock Images MCP server running on stdio");
}

main().catch(console.error);
