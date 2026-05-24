import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { mcpServer } from "./services/mcp-core.js";
import { logger } from "./shared/logger/index.js";

async function run() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info("🔌 Servidor MCP Stdio Sales Brain inicializado com sucesso via core.");
  console.error("Sales Brain MCP Server em execução via Stdio...");
}

run().catch((error) => {
  logger.error(error, "🚨 Falha grave ao inicializar servidor MCP Stdio");
  process.exit(1);
});
