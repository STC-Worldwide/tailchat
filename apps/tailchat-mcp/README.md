# tailchat-mcp

An [MCP](https://modelcontextprotocol.io) server that lets an AI agent act inside a
Tailchat workspace: list and create groups and channels, add and manage members,
read and post messages, send DMs, watch the bot's inbox, and (with an admin-scoped
key) look up, notify and ban users. It talks to the gateway with an OpenApp API key,
so everything it can do is bounded by that key's scopes and the bot's group
permissions.

## Setup

1. In the Tailchat web client open **Open Api**, create an application, enable its
   **Bot** capability, then under **API keys** create a key with the scopes the
   agent needs. The key is shown once; copy it.
2. Add the bot to the groups it should work in. A group owner (or anyone with the
   manageUser permission) can do that from the group's integration panel, or with
   `tailchat_add_member` from another key that has the permission.
3. Build the server:

   ```bash
   pnpm --dir apps/tailchat-mcp build
   ```

4. Register it with your agent. For Claude Code:

   ```bash
   claude mcp add tailchat -e TAILCHAT_URL=https://chat.example.com -e TAILCHAT_API_KEY=tck_... -- node /path/to/tailchat/apps/tailchat-mcp/dist/src/index.js
   ```

   Any MCP host works the same way: run `node dist/src/index.js` over stdio with the
   two environment variables set.

| Variable | Meaning |
| --- | --- |
| `TAILCHAT_URL` | Origin of the deployment, e.g. `https://chat.stc-worldwide.com` |
| `TAILCHAT_API_KEY` | The `tck_...` key from the Open Api panel |
| `TAILCHAT_TIMEOUT_MS` | Per-request timeout, default 15000 |

The key never travels as a tool argument and is never echoed in a result.

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
| `tailchat_admin_notify_users`, `tailchat_admin_set_banned` | admin |
| `tailchat_actions`, `tailchat_call` | whatever the called action needs |

`tailchat_call` reaches every published gateway action by name, and
`tailchat_actions` is its catalog, generated from `server/openapi.json`. Regenerate
the catalog whenever the spec changes:

```bash
pnpm --dir server gen:openapi && pnpm --dir apps/tailchat-mcp sync:actions
```

## Trust boundary

There is no inbound authentication: whoever can spawn the process holds the key.
Give each agent its own key with the narrowest scopes that do the job, and revoke
it from the Open Api panel when the agent is retired. The `admin` scope only works
for an app that a server administrator has granted the admin capability.

## Development

```bash
pnpm --dir apps/tailchat-mcp check:type
pnpm --dir apps/tailchat-mcp test
```

Tests run against an in-memory MCP client and a fake gateway; no Tailchat
deployment is needed.
