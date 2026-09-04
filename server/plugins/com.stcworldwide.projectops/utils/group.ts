import {
  NoPermissionError,
  PERMISSION,
  type TcContext,
} from 'tailchat-server-sdk';

/**
 * Group membership and permission checks, in one place.
 *
 * Every action in this plugin is scoped to a group, and the rule is the same
 * throughout: members read everything, members create and edit their own,
 * and managePanel is what it takes to touch someone else's record.
 */

export async function assertMember(
  ctx: TcContext,
  groupId: string
): Promise<void> {
  const isMember = await ctx.call('group.isMember', { groupId });
  if (!isMember) {
    throw new NoPermissionError('Not a member of this group');
  }
}

export async function getPermissions(
  ctx: TcContext,
  groupId: string
): Promise<string[]> {
  return (await ctx.call('group.getPermissions', { groupId })) as string[];
}

export async function hasManagePanel(
  ctx: TcContext,
  groupId: string
): Promise<boolean> {
  const permissions = await getPermissions(ctx, groupId);
  return permissions.includes(PERMISSION.core.managePanel);
}

/**
 * The caller may write this record if they own it, or if they can manage
 * panels. Owner is passed in rather than looked up so the caller decides what
 * "owner" means for its collection (reporter, userId, creator).
 */
export async function assertCanWrite(
  ctx: TcContext,
  groupId: string,
  ownerId: string | undefined
): Promise<void> {
  if (ownerId && String(ownerId) === String(ctx.meta.userId)) {
    return;
  }

  if (await hasManagePanel(ctx, groupId)) {
    return;
  }

  throw new NoPermissionError(
    'Only the owner or a panel manager can change this'
  );
}

/** Role ids the caller holds in this group — needed to resolve approval stages. */
export async function getMemberRoles(
  ctx: TcContext,
  groupId: string
): Promise<string[]> {
  const groupInfo: any = await ctx.call('group.getGroupInfo', { groupId });
  const member = (groupInfo?.members ?? []).find(
    (m: any) => String(m.userId) === String(ctx.meta.userId)
  );

  return member?.roles ?? [];
}
