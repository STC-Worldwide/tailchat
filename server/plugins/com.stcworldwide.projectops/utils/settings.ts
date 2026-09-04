import type { TcContext } from 'tailchat-server-sdk';
import type { ApprovalStageLike } from './approval';

/**
 * Per-group settings for the project-ops panels.
 *
 * These live in the group's own `config`, alongside every other group setting,
 * rather than in a collection of this plugin's own. That is what
 * `regPluginGroupConfigItem` writes to, so the settings appear in Group
 * Settings where people already look for them, and `updateGroupConfig` gates
 * writes on `PERMISSION.core.groupConfig` — the same permission that guards
 * the rest of that page. A private collection would have meant a second
 * settings screen and a second permission model saying the same thing.
 *
 * The trade is that the values are written by a group manager through the UI
 * and are therefore untrusted shape-wise, so everything read here is parsed
 * defensively. A malformed chain must read as "no approval configured", never
 * throw on submit.
 */
const CONFIG_PREFIX = 'plugin:com.stcworldwide.projectops:';

export const SETTING_KEYS = {
  timesheetApproval: `${CONFIG_PREFIX}timesheetApproval`,
  refPrefix: `${CONFIG_PREFIX}refPrefix`,
} as const;

async function getGroupConfig(
  ctx: TcContext,
  groupId: string
): Promise<Record<string, unknown>> {
  const groupInfo: any = await ctx.call('group.getGroupInfo', { groupId });

  return (groupInfo?.config ?? {}) as Record<string, unknown>;
}

/**
 * One approval stage, or null if this is not one.
 *
 * A stage needs a name to be worth showing in the UI; role and user lists are
 * optional, and a stage with neither is open to any member — which is the
 * useful default for a crew that has not set roles up.
 */
function parseStage(value: unknown, index: number): ApprovalStageLike | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const stage = value as Record<string, unknown>;
  const name = typeof stage.name === 'string' ? stage.name.trim() : '';
  if (name === '') {
    return null;
  }

  const strings = (input: unknown): string[] =>
    Array.isArray(input)
      ? input.filter((item): item is string => typeof item === 'string')
      : [];

  return {
    id: typeof stage.id === 'string' ? stage.id : `stage-${index}`,
    name,
    roleIds: strings(stage.roleIds),
    userIds: strings(stage.userIds),
  };
}

/**
 * The approval chain for this group's timesheets, in order.
 *
 * Empty means approval is off: submitting an entry finalises it, because
 * there is nobody to wait for.
 */
export async function getTimesheetChain(
  ctx: TcContext,
  groupId: string
): Promise<ApprovalStageLike[]> {
  const config = await getGroupConfig(ctx, groupId);
  const raw = config[SETTING_KEYS.timesheetApproval];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map(parseStage)
    .filter((stage): stage is ApprovalStageLike => stage !== null);
}

/** Prefix for human-readable refs: '861' gives 861-PL-014. */
export async function getRefPrefix(
  ctx: TcContext,
  groupId: string
): Promise<string | undefined> {
  const config = await getGroupConfig(ctx, groupId);
  const prefix = config[SETTING_KEYS.refPrefix];

  return typeof prefix === 'string' && prefix.trim() !== ''
    ? prefix.trim()
    : undefined;
}
