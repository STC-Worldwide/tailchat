#!/usr/bin/env node
// tailchat-mcp — an MCP server that lets an agent act inside Tailchat as an OpenApp
// bot, authenticated by a scoped API key from the environment.
//
// Transport is stdio, so stdout belongs to the protocol. Anything diagnostic goes to
// stderr; a stray console.log corrupts the JSON-RPC stream.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { ConfigError, TailchatClient, loadConfig } from './client.js';
import { registerTools } from './tools.js';
import { VERSION } from './version.js';

export const INSTRUCTIONS = `You act inside a Tailchat workspace as a real user: the personal access token in this
server's environment belongs to someone, and every call is made as them. Start with
tailchat_whoami — it names that user and lists the scopes the token carries, and every
tool says which scope it needs. A 403 means the token lacks a scope or that user lacks a
group permission; relay it, it cannot be widened from here.

Because you are that user, act with the restraint they would: what you post appears under
their name and their colleagues will read it as theirs.

Model of the place: a "group" is a server/workspace with channels ("panels"); a text
channel's id is also its converseId, which is what messages are posted to and read from.
Direct messages live in their own converse (tailchat_send_dm creates or reuses one). You
only see groups that user belongs to, so an empty tailchat_list_groups means they are in
no groups, not that the workspace is empty. Roles carry permission keys such as
core.manageUser and core.managePanel; a group's owner holds all of them.

Mentions and replies are handled for you by tailchat_send_message. Ids are 24-hex
Mongo ids; show nicknames and channel names to people, not ids.

The dedicated tools cover daily work. tailchat_actions lists every other published
action and tailchat_call invokes one by name — same scopes, raw response.`;

async function main(): Promise<void> {
  let client: TailchatClient;
  try {
    client = new TailchatClient(loadConfig());
  } catch (e) {
    if (e instanceof ConfigError) {
      process.stderr.write(`tailchat-mcp: ${e.message}\n`);
      process.exit(2);
    }
    throw e;
  }

  const server = new McpServer(
    { name: 'tailchat-mcp', version: VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS }
  );
  registerTools(server, client);

  await server.connect(new StdioServerTransport());
  process.stderr.write(
    `tailchat-mcp ${VERSION} ready — ${client.config.url}\n`
  );
}

main().catch((err) => {
  process.stderr.write(
    `tailchat-mcp: fatal ${
      err instanceof Error ? err.stack ?? err.message : String(err)
    }\n`
  );
  process.exit(1);
});
