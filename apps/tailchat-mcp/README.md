# tailchat-mcp

An [MCP](https://modelcontextprotocol.io) server that lets an AI agent act inside a
Tailchat workspace: list and create groups and channels, add and manage members,
read and post messages, send DMs, watch the inbox, and (with an admin-scoped token)
look up, notify and ban users. It authenticates with a personal access token, so it
acts as the user who created that token and everything it can do is bounded by the
token's scopes and that user's own permissions.

It runs two ways from the same tools:

| | Transport | What the agent needs |
| --- | --- | --- |
| **Hosted** (`src/http.ts`) | Streamable HTTP at `/mcp` | a URL and a token |
| **Local** (`src/index.ts`) | stdio | this repo, a build, and Node |

## Hosted

The deployment serves the endpoint itself, so there is nothing to install. Create a
token under **Settings -> API keys** and point a client at it:

```bash
claude mcp add --transport http tailchat https://chat.example.com/mcp   --header "Authorization: Bearer tck_..."
```

Any client that speaks remote MCP takes the same two things — a URL and an
`Authorization: Bearer` header. **Settings -> MCP setup** in the web client has
per-client snippets already filled in with that deployment's origin.

The endpoint is **stateless by design**: every request builds its own MCP server and
its own Tailchat client from the token on that request, and throws them away when the
response ends. Nothing is kept between requests, so there is no session map that could
hand one person's identity to another — the failure that matters most when one process
serves many people's tokens. `X-Api-Key` works in place of the bearer header, matching
what the gateway already accepts. A request with no token, or a token that is not
shaped like `tck_` + 44 alphanumerics, is refused with 401 before anything reaches the
gateway, and the rejection never echoes the credential.

Being stateless also means no server-initiated streams: the endpoint answers `POST` and
returns 405 for `GET` and `DELETE`. None of the tools need them. `GET /healthz` answers
without a token.

| Variable | Meaning |
| --- | --- |
| `TAILCHAT_URL` | Gateway origin this server calls, e.g. `http://service-core:3000` |
| `MCP_HTTP_PORT` | Listen port, default 3010 |
| `MCP_HTTP_PATH` | Endpoint path, default `/mcp` |
| `MCP_PUBLIC_URL` | Origin to report to agents, when it differs from the one called |
| `TAILCHAT_TIMEOUT_MS` | Per-request timeout, default 15000 |

## Local

For a client that cannot reach a remote MCP server yet.

1. In the Tailchat web client open **Settings -> API keys** and create a personal
   access token with the scopes the agent needs. It is shown once; copy it. The
   token acts as you, so it already sees your groups — there is no bot to create
   and nothing to add to a group.
2. Build the server:

   ```bash
   pnpm --dir apps/tailchat-mcp build
   ```

3. Register it with your agent. For Claude Code:

   ```bash
   claude mcp add tailchat -e TAILCHAT_URL=https://chat.example.com -e TAILCHAT_API_KEY=tck_... -- node /path/to/tailchat/apps/tailchat-mcp/dist/src/index.js
   ```

   Any MCP host works the same way: run `node dist/src/index.js` over stdio with the
   two environment variables set. **Settings -> MCP setup** in the web client has
   ready-to-copy snippets for Claude Code, Claude Desktop, Codex CLI and Cursor,
   already filled in with that deployment's origin.

| Variable | Meaning |
| --- | --- |
| `TAILCHAT_URL` | Origin of the deployment, e.g. `https://chat.stc-worldwide.com` |
| `TAILCHAT_API_KEY` | The `tck_...` token from **Settings -> API keys** |
| `TAILCHAT_TIMEOUT_MS` | Per-request timeout, default 15000 |

The token never travels as a tool argument and is never echoed in a result.

## Tools

| Tool | Scope needed |
| --- | --- |
| `tailchat_whoami` | any |
| `tailchat_list_groups`, `tailchat_get_group` | group:read |
| `tailchat_create_group`, `tailchat_create_channel`, `tailchat_rename_channel`, `tailchat_delete_channel` | group:manage (+ managePanel in the group) |
| `tailchat_add_member`, `tailchat_remove_member`, `tailchat_mute_member` | group:manage (+ manageUser in the group) |
| `tailchat_create_invite`, `tailchat_create_role`, `tailchat_set_member_roles` | group:manage |
| `tailchat_find_user` | user:read (by Nickname#0000) or admin (by email) |
| `tailchat_send_message`, `tailchat_send_dm` | message:write |
| `tailchat_read_messages`, `tailchat_search_messages`, `tailchat_inbox` | message:read |
| `tailchat_admin_notify_users`, `tailchat_admin_set_banned` | admin (owner must be a server administrator) |
| `tailchat_actions`, `tailchat_call` | whatever the called action needs |

`tailchat_call` reaches every published gateway action by name, and
`tailchat_actions` is its catalog, generated from `server/openapi.json`. Regenerate
the catalog whenever the spec changes:

```bash
pnpm --dir server gen:openapi && pnpm --dir apps/tailchat-mcp sync:actions
```

## Trust boundary

There is no inbound authentication: whoever can spawn the process holds the token,
and the token acts as its owner. Give each agent its own token with the narrowest
scopes that do the job, and revoke it from **Settings -> API keys** when the agent
is retired. A token can never exceed its owner, and it cannot mint or revoke tokens.
The `admin` scope is only issued to a user listed in the server's `ADMIN_USER_IDS`.

## Development

```bash
pnpm --dir apps/tailchat-mcp check:type
pnpm --dir apps/tailchat-mcp test
```

Tests run against an in-memory MCP client and a fake gateway; no Tailchat
deployment is needed.
