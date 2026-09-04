import settingsModel from '../models/settings';
import type { ApprovalStageLike } from './approval';

/**
 * Per-group settings, with a usable answer when none have been saved.
 *
 * A group that has never opened the settings panel is the normal case, not an
 * error: it simply has no approval chain, which means approvals are off.
 */
export async function getSettings(groupId: string) {
  return await settingsModel.findOne({ groupId });
}

export async function getTimesheetChain(
  groupId: string
): Promise<ApprovalStageLike[]> {
  const settings = await getSettings(groupId);
  return (settings?.timesheetApproval ?? []) as ApprovalStageLike[];
}

export async function getRefPrefix(
  groupId: string
): Promise<string | undefined> {
  const settings = await getSettings(groupId);
  return settings?.refPrefix;
}
