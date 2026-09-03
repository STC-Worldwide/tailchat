// The MCP tool surface over Tailchat.
//
// Dedicated tools cover what an agent does day to day — groups and channels, members
// and roles, reading and posting messages, DMs, the inbox — and carry the domain facts a
// model otherwise gets wrong: a text channel's panel id IS its converse id, mentions are
// `[at=userId][/at]` tags plus meta.mentions, a reply is meta.reply plus an @-tag, group
// membership is what makes a group visible at all. `tailchat_call` reaches every other
// published action and `tailchat_actions` is its map.
//
// The token acts as the user who created it, so the reach here is exactly that user's.
// Nothing is filtered client-side: whether a call is allowed is decided by the gateway
// from the token's scopes and by the service from that user's own group permissions; a
// 403 names what was missing and is relayed as-is.

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { randomUUID } from 'node:crypto';

import { ACTIONS, SPEC_VERSION } from './actions.js';
import { TailchatApiError, type TailchatClient } from './client.js';
import { renderResult } from './render.js';

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

function ok(value: unknown): ToolResult {
  return { content: [{ type: 'text', text: renderResult(value) }] };
}

function fail(err: unknown): ToolResult {
  const message =
    err instanceof TailchatApiError
      ? `${err.message}${err.status ? ` [HTTP ${err.status}]` : ''}`
      : err instanceof Error
      ? err.message
      : String(err);
  return { content: [{ type: 'text', text: message }], isError: true };
}

async function run(fn: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return ok(await fn());
  } catch (err) {
    return fail(err);
  }
}

// ------------------------------------------------------------------ shapes

export const PANEL_TYPES = { text: 0, category: 1, plugin: 2 } as const;
const PANEL_TYPE_NAMES: Record<number, string> = {
  0: 'text',
  1: 'category',
  2: 'plugin',
};

interface RawPanel {
  id: string;
  name: string;
  type: number;
  parentId?: string;
  provider?: string;
  pluginPanelName?: string;
  meta?: unknown;
}

interface RawRole {
  _id: string;
  name: string;
  permissions: string[];
}

interface RawMember {
  userId: string;
  roles: string[];
  muteUntil?: string;
}

interface RawGroup {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  owner: string;
  members: RawMember[];
  panels: RawPanel[];
  roles?: RawRole[];
  config?: Record<string, unknown>;
}

interface UserInfo {
  _id: string;
  nickname: string;
  discriminator?: string;
  avatar?: string;
  email?: string;
  temporary?: boolean;
  type?: string;
}

function channelView(p: RawPanel) {
  return {
    id: p.id,
    name: p.name,
    type: PANEL_TYPE_NAMES[p.type] ?? String(p.type),
    parentId: p.parentId,
    ...(p.provider
      ? { provider: p.provider, pluginPanelName: p.pluginPanelName }
      : {}),
  };
}

function roleView(r: RawRole) {
  return { id: String(r._id), name: r.name, permissions: r.permissions };
}

function groupSummary(g: RawGroup) {
  return {
    id: String(g._id),
    name: g.name,
    description: g.description,
    owner: String(g.owner),
    memberCount: g.members?.length ?? 0,
    channels: (g.panels ?? []).map(channelView),
    roles: (g.roles ?? []).map(roleView),
  };
}

function userView(u: UserInfo) {
  return {
    id: String(u._id),
    nickname: u.nickname,
    uniqueName: u.discriminator
      ? `${u.nickname}#${u.discriminator}`
      : undefined,
    avatar: u.avatar,
    email: u.email,
    type: u.type,
    temporary: u.temporary,
  };
}

// ------------------------------------------------------------------ helpers

async function listGroups(client: TailchatClient): Promise<RawGroup[]> {
  return (await client.call<RawGroup[]>('group.getUserGroups')) ?? [];
}

async function getGroup(
  client: TailchatClient,
  groupId: string
): Promise<RawGroup> {
  const group = (await listGroups(client)).find(
    (g) => String(g._id) === groupId
  );
  if (!group) {
    throw new Error(
      `group ${groupId} is not one you are a member of — join it in Tailchat, or have someone with the manageUser permission add you`
    );
  }
  return group;
}

/** Best-effort id -> nickname map; a missing user:read scope just yields no names. */
async function nicknames(
  client: TailchatClient,
  ids: string[]
): Promise<Map<string, UserInfo>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  try {
    const list = await client.call<UserInfo[]>('user.getUserInfoList', {
      userIds: unique,
    });
    return new Map((list ?? []).map((u) => [String(u._id), u]));
  } catch {
    return new Map();
  }
}

const userSelector = {
  userId: z.string().optional().describe('Tailchat user id (24 hex chars)'),
  uniqueName: z
    .string()
    .optional()
    .describe(
      'Nickname#0000 as shown in the client (needs the user:read scope)'
    ),
  email: z
    .string()
    .optional()
    .describe('Account email (needs the admin scope and server-admin rights)'),
};

async function resolveUser(
  client: TailchatClient,
  sel: { userId?: string; uniqueName?: string; email?: string }
): Promise<UserInfo> {
  if (sel.userId) {
    const u = await client.call<UserInfo | null>('user.getUserInfo', {
      userId: sel.userId,
    });
    if (!u) throw new Error(`no user with id ${sel.userId}`);
    return u;
  }
  if (sel.uniqueName) {
    if (!sel.uniqueName.includes('#')) {
      throw new Error(
        'uniqueName must be Nickname#0000 (the four-digit discriminator is required)'
      );
    }
    const u = await client.call<UserInfo | null>(
      'user.searchUserWithUniqueName',
      {
        uniqueName: sel.uniqueName,
      }
    );
    if (!u) throw new Error(`no user named ${sel.uniqueName}`);
    return u;
  }
  if (sel.email) {
    const u = await client.call<UserInfo | null>('admin.findUser', {
      email: sel.email,
    });
    if (!u) throw new Error(`no user with email ${sel.email}`);
    return u;
  }
  throw new Error('give one of userId, uniqueName or email');
}

function mentionTag(userId: string): string {
  return `[at=${userId}][/at]`;
}

// ------------------------------------------------------------------ tools

export function registerTools(server: McpServer, client: TailchatClient): void {
  server.registerTool(
    'tailchat_whoami',
    {
      title: 'Who am I',
      description:
        'The user this token acts as, and the scopes it carries. Call first to learn what the token may do.',
      inputSchema: {},
    },
    () =>
      run(async () => {
        const meta = await client.call<any>('user.whoami');
        return {
          user: meta?.user
            ? {
                id: String(meta.user._id),
                nickname: meta.user.nickname,
                email: meta.user.email,
              }
            : null,
          apiKey: meta?.apiKey ?? null,
          server: client.config.url,
          specVersion: SPEC_VERSION,
        };
      })
  );

  server.registerTool(
    'tailchat_list_groups',
    {
      title: 'List groups',
      description:
        'Groups (servers/workspaces) you belong to, with their channels and roles. A group you are not a member of is invisible.',
      inputSchema: {},
    },
    () => run(async () => (await listGroups(client)).map(groupSummary))
  );

  server.registerTool(
    'tailchat_get_group',
    {
      title: 'Get group',
      description:
        'One group in detail: channels, roles and members (with nicknames when the token has user:read).',
      inputSchema: {
        groupId: z.string(),
        includeMembers: z.boolean().default(true),
      },
    },
    ({ groupId, includeMembers }) =>
      run(async () => {
        const g = await getGroup(client, groupId);
        const summary = groupSummary(g);
        if (!includeMembers) return summary;
        const names = await nicknames(
          client,
          g.members.map((m) => String(m.userId))
        );
        const roleNames = new Map(
          (g.roles ?? []).map((r) => [String(r._id), r.name])
        );
        return {
          ...summary,
          members: g.members.map((m) => ({
            userId: String(m.userId),
            nickname: names.get(String(m.userId))?.nickname,
            isOwner: String(m.userId) === String(g.owner),
            roles: (m.roles ?? []).map(
              (id) => roleNames.get(String(id)) ?? String(id)
            ),
            mutedUntil: m.muteUntil,
          })),
        };
      })
  );

  server.registerTool(
    'tailchat_create_group',
    {
      title: 'Create group',
      description:
        'Create a group with an initial channel layout. You become its owner. Without `channels`, one text channel named "general" is created. Needs group:manage.',
      inputSchema: {
        name: z.string().min(1),
        channels: z
          .array(
            z.object({
              name: z.string().min(1),
              type: z.enum(['text', 'category']).default('text'),
              parent: z
                .string()
                .optional()
                .describe(
                  'Name of a category channel in this list to nest under'
                ),
            })
          )
          .optional(),
      },
    },
    ({ name, channels }) =>
      run(async () => {
        const layout = channels?.length
          ? channels
          : [{ name: 'general', type: 'text' as const, parent: undefined }];
        const ids = new Map<string, string>();
        for (const c of layout) ids.set(c.name, randomUUID());
        const panels = layout.map((c) => {
          const parentId = c.parent ? ids.get(c.parent) : undefined;
          if (c.parent && !parentId) {
            throw new Error(
              `parent "${c.parent}" is not a channel in this list`
            );
          }
          return {
            id: ids.get(c.name),
            name: c.name,
            type: PANEL_TYPES[c.type],
            ...(parentId ? { parentId } : {}),
          };
        });
        const g = await client.call<RawGroup>('group.createGroup', {
          name,
          panels,
        });
        return groupSummary(g);
      })
  );

  server.registerTool(
    'tailchat_create_channel',
    {
      title: 'Create channel',
      description:
        "Add a text channel or a category to a group. Needs the managePanel permission in that group (group:manage scope). A text channel's id is also its converseId for messages.",
      inputSchema: {
        groupId: z.string(),
        name: z.string().min(1),
        type: z.enum(['text', 'category']).default('text'),
        parentId: z
          .string()
          .optional()
          .describe('Category channel id to nest under'),
      },
    },
    ({ groupId, name, type, parentId }) =>
      run(async () => {
        const g = await client.call<RawGroup>('group.createGroupPanel', {
          groupId,
          name,
          type: PANEL_TYPES[type],
          ...(parentId ? { parentId } : {}),
        });
        const created = (g.panels ?? []).find(
          (p) => p.name === name && p.type === PANEL_TYPES[type]
        );
        return {
          channel: created ? channelView(created) : undefined,
          channels: (g.panels ?? []).map(channelView),
        };
      })
  );

  server.registerTool(
    'tailchat_rename_channel',
    {
      title: 'Rename channel',
      description:
        'Rename a channel or category, keeping everything else about it.',
      inputSchema: {
        groupId: z.string(),
        panelId: z.string(),
        name: z.string().min(1),
      },
    },
    ({ groupId, panelId, name }) =>
      run(async () => {
        const g = await getGroup(client, groupId);
        const panel = g.panels.find((p) => p.id === panelId);
        if (!panel)
          throw new Error(`no channel ${panelId} in group ${groupId}`);
        const updated = await client.call<RawGroup>('group.modifyGroupPanel', {
          groupId,
          panelId,
          name,
          type: panel.type,
          ...(panel.provider ? { provider: panel.provider } : {}),
          ...(panel.pluginPanelName
            ? { pluginPanelName: panel.pluginPanelName }
            : {}),
          ...(panel.meta ? { meta: panel.meta } : {}),
        });
        return (updated.panels ?? []).map(channelView);
      })
  );

  server.registerTool(
    'tailchat_delete_channel',
    {
      title: 'Delete channel',
      description:
        'Delete a channel or category. Messages in a text channel become unreachable; this is not reversible.',
      inputSchema: { groupId: z.string(), panelId: z.string() },
    },
    ({ groupId, panelId }) =>
      run(async () => {
        const g = await client.call<RawGroup>('group.deleteGroupPanel', {
          groupId,
          panelId,
        });
        return (g.panels ?? []).map(channelView);
      })
  );

  server.registerTool(
    'tailchat_find_user',
    {
      title: 'Find user',
      description:
        'Look a user up by id, by Nickname#0000 (user:read) or by email (admin scope).',
      inputSchema: userSelector,
    },
    (sel) => run(async () => userView(await resolveUser(client, sel)))
  );

  server.registerTool(
    'tailchat_add_member',
    {
      title: 'Add member',
      description:
        'Add a user to a group directly (no invite code). Needs the manageUser permission in that group (group:manage), or `asAdmin` with the admin scope to bypass group permissions.',
      inputSchema: {
        groupId: z.string(),
        ...userSelector,
        asAdmin: z.boolean().default(false),
      },
    },
    ({ groupId, asAdmin, ...sel }) =>
      run(async () => {
        const user = await resolveUser(client, sel);
        const action = asAdmin
          ? 'admin.addGroupMember'
          : 'group.addGroupMember';
        const g = await client.call<RawGroup>(action, {
          groupId,
          userId: String(user._id),
        });
        return { added: userView(user), memberCount: g?.members?.length };
      })
  );

  server.registerTool(
    'tailchat_remove_member',
    {
      title: 'Remove member',
      description: 'Kick a member from a group. Needs manageUser in the group.',
      inputSchema: { groupId: z.string(), userId: z.string() },
    },
    ({ groupId, userId }) =>
      run(async () => {
        await client.call('group.deleteGroupMember', {
          groupId,
          memberId: userId,
        });
        return { removed: userId };
      })
  );

  server.registerTool(
    'tailchat_mute_member',
    {
      title: 'Mute member',
      description:
        'Mute a member for a number of minutes; 0 lifts an existing mute.',
      inputSchema: {
        groupId: z.string(),
        userId: z.string(),
        minutes: z.number().int().min(0),
      },
    },
    ({ groupId, userId, minutes }) =>
      run(async () => {
        await client.call('group.muteGroupMember', {
          groupId,
          memberId: userId,
          muteMs: minutes > 0 ? minutes * 60_000 : -1,
        });
        return minutes > 0 ? { muted: userId, minutes } : { unmuted: userId };
      })
  );

  server.registerTool(
    'tailchat_create_invite',
    {
      title: 'Create invite',
      description:
        'Create an invite code for a group. `permanent` codes need the unlimitedInvite permission; normal ones expire.',
      inputSchema: {
        groupId: z.string(),
        permanent: z.boolean().default(false),
      },
    },
    ({ groupId, permanent }) =>
      run(async () => {
        const invite = await client.call<{ code: string; expiredAt?: string }>(
          'group.invite.createGroupInvite',
          { groupId, inviteType: permanent ? 'permanent' : 'normal' }
        );
        return {
          code: invite.code,
          url: `${client.config.url}/invite/${invite.code}`,
          expiredAt: invite.expiredAt,
        };
      })
  );

  server.registerTool(
    'tailchat_create_role',
    {
      title: 'Create role',
      description:
        'Create a role in a group with a set of permission keys (core.message, core.invite, core.manageUser, core.managePanel, core.manageRoles, core.deleteMessage, core.groupConfig, ...). Needs manageRoles.',
      inputSchema: {
        groupId: z.string(),
        name: z.string().min(1),
        permissions: z.array(z.string()).default([]),
      },
    },
    ({ groupId, name, permissions }) =>
      run(async () => {
        const g = await client.call<RawGroup>('group.createGroupRole', {
          groupId,
          roleName: name,
          permissions,
        });
        return (g.roles ?? []).map(roleView);
      })
  );

  server.registerTool(
    'tailchat_set_member_roles',
    {
      title: 'Set member roles',
      description:
        'Give roles to members or take them away. Needs manageRoles.',
      inputSchema: {
        groupId: z.string(),
        userIds: z.array(z.string()).min(1),
        roleIds: z.array(z.string()).min(1),
        mode: z.enum(['add', 'remove']).default('add'),
      },
    },
    ({ groupId, userIds, roleIds, mode }) =>
      run(async () => {
        const action =
          mode === 'add'
            ? 'group.appendGroupMemberRoles'
            : 'group.removeGroupMemberRoles';
        await client.call(action, {
          groupId,
          memberIds: userIds,
          roles: roleIds,
        });
        return { [mode === 'add' ? 'added' : 'removed']: roleIds, userIds };
      })
  );

  server.registerTool(
    'tailchat_send_message',
    {
      title: 'Send message',
      description:
        'Post a message to a converse. For a group text channel, converseId is the channel id and groupId must be given; for a DM, converseId comes from tailchat_send_dm or the inbox. Content is plain text; mentions and replies are added for you. Needs message:write.',
      inputSchema: {
        converseId: z.string(),
        groupId: z.string().optional(),
        content: z.string().min(1),
        replyToMessageId: z.string().optional(),
        mentionUserIds: z.array(z.string()).optional(),
      },
    },
    ({ converseId, groupId, content, replyToMessageId, mentionUserIds }) =>
      run(async () => {
        const meta: Record<string, unknown> = {};
        let text = content;
        const mentions = new Set(mentionUserIds ?? []);
        if (replyToMessageId) {
          const original = await client.call<any>('chat.message.getMessage', {
            messageId: replyToMessageId,
          });
          if (!original) throw new Error(`no message ${replyToMessageId}`);
          meta.reply = {
            _id: String(original._id),
            author: String(original.author),
            content: String(original.content ?? ''),
          };
          mentions.add(String(original.author));
          text = `${mentionTag(String(original.author))} ${text}`;
        }
        if (mentions.size > 0) {
          meta.mentions = [...mentions];
          for (const id of mentionUserIds ?? []) {
            if (!text.includes(mentionTag(id)))
              text = `${mentionTag(id)} ${text}`;
          }
        }
        const msg = await client.call<any>('chat.message.sendMessage', {
          converseId,
          ...(groupId ? { groupId } : {}),
          content: text,
          plain: content,
          ...(Object.keys(meta).length ? { meta } : {}),
        });
        return {
          id: String(msg?._id),
          converseId,
          groupId,
          content: msg?.content ?? text,
        };
      })
  );

  server.registerTool(
    'tailchat_read_messages',
    {
      title: 'Read messages',
      description:
        'Recent messages in a converse (a text channel id or a DM converse id), newest last. Pass `beforeMessageId` to page backwards. Needs message:read.',
      inputSchema: {
        converseId: z.string(),
        beforeMessageId: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(30),
      },
    },
    ({ converseId, beforeMessageId, limit }) =>
      run(async () => {
        const raw = await client.call<any[]>(
          'chat.message.fetchConverseMessage',
          {
            converseId,
            ...(beforeMessageId ? { startId: beforeMessageId } : {}),
          }
        );
        const sorted = [...(raw ?? [])].sort((a, b) =>
          String(a._id).localeCompare(String(b._id))
        );
        const page = sorted.slice(-limit);
        const names = await nicknames(
          client,
          page.map((m) => String(m.author))
        );
        return {
          converseId,
          count: page.length,
          oldestMessageId: page[0]?._id,
          messages: page.map((m) => ({
            id: String(m._id),
            author: {
              id: String(m.author),
              nickname: names.get(String(m.author))?.nickname,
            },
            content: m.content,
            createdAt: m.createdAt,
            hasRecall: m.hasRecall,
            reactions: m.reactions,
            reply: m.meta?.reply,
          })),
        };
      })
  );

  server.registerTool(
    'tailchat_search_messages',
    {
      title: 'Search messages',
      description: 'Full-text search inside one converse. Needs message:read.',
      inputSchema: {
        converseId: z.string(),
        text: z.string().min(1),
        groupId: z.string().optional(),
      },
    },
    ({ converseId, text, groupId }) =>
      run(async () => {
        const raw = await client.call<any[]>('chat.message.searchMessage', {
          converseId,
          text,
          ...(groupId ? { groupId } : {}),
        });
        const names = await nicknames(
          client,
          (raw ?? []).map((m) => String(m.author))
        );
        return (raw ?? []).map((m) => ({
          id: String(m._id),
          author: {
            id: String(m.author),
            nickname: names.get(String(m.author))?.nickname,
          },
          content: m.content,
          createdAt: m.createdAt,
        }));
      })
  );

  server.registerTool(
    'tailchat_send_dm',
    {
      title: 'Send direct message',
      description:
        'Open (or reuse) a direct-message converse with a user and post to it. Needs message:write.',
      inputSchema: { ...userSelector, content: z.string().min(1) },
    },
    ({ content, ...sel }) =>
      run(async () => {
        const user = await resolveUser(client, sel);
        const converse = await client.call<any>(
          'chat.converse.createDMConverse',
          {
            memberIds: [String(user._id)],
          }
        );
        const converseId = String(converse._id);
        const msg = await client.call<any>('chat.message.sendMessage', {
          converseId,
          content,
          plain: content,
        });
        return { to: userView(user), converseId, messageId: String(msg?._id) };
      })
  );

  server.registerTool(
    'tailchat_inbox',
    {
      title: 'Inbox',
      description:
        'Your inbox: mentions and DMs addressed to you. Each item names the converse (and group) to answer in. Needs message:read.',
      inputSchema: { unreadOnly: z.boolean().default(true) },
    },
    ({ unreadOnly }) =>
      run(async () => {
        const items = await client.call<any[]>('chat.inbox.all');
        const list = (items ?? []).filter(
          (i) => !unreadOnly || i.readed !== true
        );
        return list.map((i) => ({
          id: String(i._id),
          type: i.type,
          readed: i.readed,
          createdAt: i.createdAt,
          message: i.message
            ? {
                messageId: i.message.messageId,
                converseId: i.message.converseId,
                groupId: i.message.groupId,
                snippet: i.message.messageSnippet,
              }
            : undefined,
          payload: i.payload,
        }));
      })
  );

  server.registerTool(
    'tailchat_admin_notify_users',
    {
      title: 'Admin: notify users',
      description:
        "Push a system (markdown) notification into users' inboxes. Needs the admin scope.",
      inputSchema: {
        userIds: z.array(z.string()).min(1),
        title: z.string().min(1),
        content: z.string().min(1),
      },
    },
    ({ userIds, title, content }) =>
      run(() => client.call('admin.notifyUsers', { userIds, title, content }))
  );

  server.registerTool(
    'tailchat_admin_set_banned',
    {
      title: 'Admin: ban / unban user',
      description:
        'Ban a user (their sessions are cut and logins refused) or lift a ban. Needs the admin scope.',
      inputSchema: { userId: z.string(), banned: z.boolean() },
    },
    ({ userId, banned }) =>
      run(async () => {
        await client.call(banned ? 'admin.banUser' : 'admin.unbanUser', {
          userId,
        });
        return { userId, banned };
      })
  );

  server.registerTool(
    'tailchat_actions',
    {
      title: 'List actions',
      description:
        'The catalog of every published gateway action with its parameters and the token scopes that permit it — the map for tailchat_call. Filter by a substring of the action name or by scope.',
      inputSchema: {
        filter: z.string().optional(),
        scope: z.string().optional(),
      },
    },
    ({ filter, scope }) =>
      run(async () => {
        const f = filter?.toLowerCase();
        const list = ACTIONS.filter(
          (a) =>
            (!f || a.action.toLowerCase().includes(f)) &&
            (!scope || a.scopes.includes(scope))
        );
        return {
          specVersion: SPEC_VERSION,
          count: list.length,
          actions: list.map((a) => ({
            action: a.action,
            scopes: a.scopes,
            public: a.public,
            required: a.required,
            params: Object.keys(a.params),
            summary: a.summary || undefined,
          })),
        };
      })
  );

  server.registerTool(
    'tailchat_call',
    {
      title: 'Call any action',
      description:
        'Call any published gateway action by name (e.g. "group.updateGroupField") with a JSON params object. Use tailchat_actions to find names and parameters. The gateway enforces the token\'s scopes; the response is the action\'s raw data.',
      inputSchema: {
        action: z.string().min(1),
        params: z.record(z.unknown()).default({}),
      },
    },
    ({ action, params }) => run(() => client.call(action, params))
  );
}
