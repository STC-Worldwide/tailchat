import { useGroupInfo } from '@capital/common';

/**
 * Settings live in the group's own `config`, written through Group Settings.
 *
 * The keys carry the `plugin:` prefix that `regPluginGroupConfigItem` adds on
 * save, and the SERVER reads these same keys — see utils/settings.ts. Keep the
 * two in step.
 */
const PLUGIN_ID = 'com.stcworldwide.projectops';

/** What `regPluginGroupConfigItem` is registered under. */
export const SETTING_NAMES = {
  timesheetApproval: `${PLUGIN_ID}:timesheetApproval`,
  refPrefix: `${PLUGIN_ID}:refPrefix`,
};

/**
 * What the value is stored under on the group — Tailchat prefixes the
 * registered name with `plugin:` on save. The server reads these same strings.
 */
export const SETTING_KEYS = {
  timesheetApproval: `plugin:${SETTING_NAMES.timesheetApproval}`,
  refPrefix: `plugin:${SETTING_NAMES.refPrefix}`,
};

/**
 * Panels read settings straight off the group they already have loaded, so
 * showing a ref costs no request of its own.
 */
export function useProjectOpsSettings(groupId: string): {
  refPrefix: string | undefined;
} {
  const groupInfo = useGroupInfo(groupId);
  const config: Record<string, any> = (groupInfo as any)?.config ?? {};
  const prefix = config[SETTING_KEYS.refPrefix];

  return {
    refPrefix:
      typeof prefix === 'string' && prefix.trim() !== ''
        ? prefix.trim()
        : undefined,
  };
}
