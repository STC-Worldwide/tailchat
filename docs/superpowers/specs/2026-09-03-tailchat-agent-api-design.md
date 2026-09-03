# Tailchat Agent API Design

Date: 2026-09-03
Status: Approved, revised the same day -- see "Revision 2" at the end, which
supersedes D1, D5 and the `admin` row of D2. Everything below the Revision
heading is current; the decisions above it are kept as the record of how the
first cut worked.

## Objective

Let AI agents and other automation act inside Tailchat over the existing HTTP
and socket gateway with credentials that are scoped, hashed at rest, and
revocable, and close the gaps that stopped an agent from doing routine
administration (adding members to a group, looking up or banning users).

This is the "server PR" of the three-step plan agreed on 2026-09-03:

1. use the existing OpenApp bot login as-is;
2. **this document** -- API keys, a gateway-reachable add-member action, a small
   admin surface, rate limiting, a regenerated OpenAPI spec;
3. an MCP server wrapping the resulting surface -- `apps/tailchat-mcp`, see
   "Step 3" below.

## What already existed

- Every Moleculer action whose `visibility` is `published` (the default) is
  reachable as `POST /api/<service>/<action>` and as a socket.io event of the
  same name. Authentication is a user JWT in the `X-Token` header.
- The OpenApp system (`openapi.app`) issues an `appId` + `appSecret`. With the
  `bot` capability, `POST /api/openapi/bot/login` with `md5(appId + appSecret)`
  returns a 30-day JWT for a dedicated bot user of type `openapiBot`.
- Actions marked `visibility: 'public'` are cluster-internal only. That set
  includes `group.addMember`, `user.banUser`, `user.findUserByEmail`.

## Decisions

### D1. API keys are a new credential, the md5 bot login stays

A key is issued per OpenApp, acts as that app's bot user, and carries a list of
named scopes. The legacy `openapi.bot.login` flow is unchanged so the existing
client SDK and any deployed bots keep working; the login handler now logs a
deprecation notice. Nothing new should be built on it.

Key format: `tck_` + 12-char key id + 32-char secret, both from an alphanumeric
`nanoid` alphabet (48 chars total, fixed length, so the parser needs no
delimiter). Only the SHA-256 of the secret is stored. The secret is high
entropy, so a fast hash is the correct choice; a password KDF would add latency
per request for no security gain. Comparison uses `crypto.timingSafeEqual`.

The plaintext key is returned exactly once, from `openapi.apikey.create`.

### D2. Scopes are named, and expand to action-name globs

Scopes are a fixed catalog defined in the server SDK
(`packages/sdk/src/services/lib/apikey.ts`) so the gateway, the socket mixin,
the OpenAPI generator, and the client all read one definition:

| Scope | Covers |
| --- | --- |
| `message:read` | fetch, search, nearby, ack listing, inbox listing |
| `message:write` | send, recall, delete, reactions, DM converse creation, inbox ack/clear |
| `group:read` | group listing/basic info, membership checks, permissions, invite listing, extra data reads |
| `group:manage` | everything under `group.*`, `group.extra.*`, `group.invite.*` (superset of `group:read`) |
| `user:read` | whoami, user info, settings read, friend list, DM list |
| `user:write` | profile/settings writes, friend and friend-request actions, DM list edits |
| `file` | upload (`file.save`), `file.get`, `file.stat` |
| `plugins` | `plugin:**` (backend plugin services) and `plugin.registry.list` |
| `admin` | `openapi.admin.*` -- requires the app to hold the `admin` capability |

Matching uses Moleculer's `Utils.match` (`*` = one segment, `**` = any depth).
The gateway resolves the endpoint before `authorize` runs, so the action name
is known at authorization time and a key outside its scope gets a 403 before
the action is called. The socket mixin performs the same check in `onAny`.

Keys cannot manage OpenApps or other keys: there is no `openapi` scope. Those
actions stay behind a human user's JWT.

### D3. Resolution is a database lookup per request, no cache

`openapi.apikey.resolve` (cluster-internal) parses the key, loads the record by
`keyId` (unique index), verifies the hash, then rejects revoked or expired keys
and apps that no longer hold the `bot` capability. The `admin` scope is dropped
from the effective scopes if the app has lost the `admin` capability. This is
deliberately not cached so revocation is immediate. `lastUsedAt` is updated at
most once a minute per key, fire-and-forget.

### D4. `group.addGroupMember` is published, gated on `core.manageUser`

Mirrors `group.deleteGroupMember`: same parameter shape, same permission.
The target user must exist. It reuses the internal `addMember` for the write,
the notifications, and the socket room join, then posts a system message to
the group lobby. Direct add is the behaviour a company workspace wants; invite
codes remain for self-service joins.

### D5. Admin surface is a separate service behind an `admin` capability

`openapi.admin` exposes `findUser`, `banUser`, `unbanUser`, `addGroupMember`
(no group-permission check) and `notifyUsers` (system inbox message). Each
action requires either an API key with the `admin` scope or the internal
`SYSTEM_USERID` (the admin panel's broker identity).

Any user can create an OpenApp, so `admin` is the one capability an owner
cannot self-grant. `openapi.app.setAppCapability` refuses to add it unless the
caller is `SYSTEM_USERID` or listed in `ADMIN_USER_IDS` (new environment
variable, comma-separated user ids). Removing it is always allowed.

### D6. Rate limiting is on, keyed by credential

The `/api` route gets Moleculer-web's rate limiter: 600 requests per minute
per credential (SHA-256 of the presented token or key), falling back to the
client IP for unauthenticated calls such as login. `API_RATE_LIMIT` overrides
the number; `0` disables it. Responses carry `X-Rate-Limit-*` headers and an
over-limit call gets HTTP 429.

The store is per gateway node in memory. The STC deployment runs one gateway,
so the limit is exact there; with several gateways the effective limit is
`limit x nodes`. This is a disposable optimisation in the sense of
`AGENTS.md`, not shared state, and it fails open (a store failure does not
block traffic). A Redis-backed store can replace it without changing the key
function.

### D7. Credentials are accepted from three headers

`X-Token` (existing), `Authorization: Bearer <value>`, and `X-Api-Key`. The
value decides the path: something that parses as an API key goes to
`openapi.apikey.resolve`, anything else is treated as a JWT. The same
resolver serves the socket handshake (`auth.token`).

### D8. The OpenAPI document is generated, and now says who may call what

`pnpm --dir server gen:openapi` walks every service and writes
`server/openapi.json`. The generator now emits the security schemes above,
tags each path with its service, converts the fastest-validator parameter
schema into JSON Schema (`required` list, arrays, optionals), and annotates
each operation with `x-tailchat-scopes`: the API-key scopes that permit it.
The hand-written `openapi.yaml` (12 paths, version 1.7.6) is deleted; it was a
second, stale contract.

## Out of scope

- Creating user accounts for other people (registration still needs a verified
  email).
- A Redis-backed rate-limit store.
- Banning a bot user directly (revoke its keys or remove the capability).

## Step 3: the MCP server (`apps/tailchat-mcp`)

A stdio MCP server, TypeScript on `@modelcontextprotocol/sdk`, configured by
`TAILCHAT_URL` and `TAILCHAT_API_KEY`. It acts as the app's bot user and is
bounded by the key's scopes and the bot's group permissions; nothing is
filtered client-side and a 403 is relayed as-is.

Twenty-two tools: dedicated ones for groups, channels, members, roles,
invites, messages, DMs and the inbox (each carrying the domain facts a model
gets wrong -- a text channel's id is its converseId, mentions are `[at=id][/at]`
plus `meta.mentions`, replies are `meta.reply` plus an @-tag, a group is only
visible once the bot is a member); `tailchat_admin_*` for the admin scope;
and `tailchat_call` over a catalog (`tailchat_actions`) generated from
`server/openapi.json` by `pnpm --dir apps/tailchat-mcp sync:actions`.

Results are capped at 24 KB with an explicit `_truncated` note rather than a
silent cut. Tests drive the real tool surface through an in-memory MCP client
against a fake gateway and run in the server CI gate. The trust boundary is
the process spawner: there is no inbound authentication, so each agent gets
its own narrowly scoped, revocable key.

## Verification

- `pnpm --filter tailchat-server-sdk build`
- `pnpm --dir server check:type`
- `pnpm --dir server test --runInBand` for the openapi, group, and unit suites
  (needs `MONGO_URL`)
- `pnpm --dir server gen:openapi` and review of the regenerated diff
- `pnpm --dir client/web check:type` and the openapi plugin test


## Revision 2 (2026-09-03): personal access tokens, not app bots

**What was wrong.** In the first cut a key belonged to an OpenApp and resolved
to that app's synthetic bot user. Every real task then needed a chain of setup
that has nothing to do with the task: create an application, enable a Bot
capability, install a frontend plugin to see any of it, then add the bot to
each group and give it a role. And because the bot is a separate principal, it
could not see anything its owner could see. Tim's verdict on trying it: "I
don't want to use this bot mechanic. I want this to be a legit api that works
natively with tailchat. No dependency on a bot framework."

**What replaced it.** A key is now a **personal access token**: it belongs to a
user and authenticates AS that user. There is no application, no bot account,
and no membership setup — a token starts out seeing exactly the groups,
channels, DMs and permissions its owner sees. Scopes narrow it from there, so
a token is always a subset of its owner and never a new principal.

This is the ordinary shape for this kind of API (a GitHub PAT, a Slack user
token) and it fits Tailchat's authorization model, which is per-user
everywhere: every action reads `ctx.meta.userId` and checks that user's group
membership and permissions. The bot account was a way to manufacture a user id
for a credential that had none; a token that carries its owner's id needs no
such invention.

### Changes

| Before | After |
| --- | --- |
| `openapi.apikey.*`, key scoped to an `appId` | `user.apikey.*`, key scoped to a `userId` |
| Resolved to `openapi.bot.getOrCreateBotAccount` | Resolves to the owning user, refused if banned |
| `ApiKeyMeta.appId` | `ApiKeyMeta.userId` |
| `openapi.admin.*` behind an app `admin` capability | `admin.*` behind `ADMIN_USER_IDS` |
| Keys managed in the Open Api plugin (needs a per-browser install) | **Settings -> API keys**, core UI, no plugin |
| Key service ran on the openapi node | Runs on the core node, so the gateway resolves credentials without a cross-node call |

The OpenApp `admin` capability is gone: it existed only to gate app-scoped
keys. OpenApps keep their `bot`, `webpage` and `oauth` capabilities and the
legacy `openapi.bot.login` still works for existing bots — a bot is now one
thing you may build ON the API, not the way the API authenticates.

### Guarantees, and where they are enforced

- **A token cannot exceed its owner.** Scopes only subtract. The service checks
  the owner's rights at mint time and `resolve` re-checks them on every
  request, so removing someone from `ADMIN_USER_IDS` disables the admin scope
  on their existing tokens immediately.
- **A token cannot mint or revoke tokens, including itself.** No scope maps to
  `user.apikey.*`, and the gateway refuses any action outside a token's
  scopes, so that surface requires a real login.
- **Revocation, expiry and bans are immediate.** `resolve` is deliberately
  uncached and reads the owner's live record.
- **A token id cannot be probed across accounts.** Revoking a key owned by
  someone else answers "not found", the same as a key that does not exist.

### Verification

`server`: 20 suites / 178 tests, including a rewritten `user.apikey` suite
(hash at rest, scope filtering, the admin-scope refusal and its removal after
the fact, banned owner, tampered secret, cross-account revoke) and an `admin`
suite that proves an ordinary user is refused whether they present a login or
a token claiming the admin scope. `apps/tailchat-mcp`: 17 tests.
