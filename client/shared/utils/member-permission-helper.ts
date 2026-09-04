import _flatten from 'lodash/flatten';
import _uniq from 'lodash/uniq';
import { getPermissionList, PERMISSION } from './role-helper';

/**
 * 这里只描述算权限用得到的那几个字段。
 *
 * `GroupInfo` 在 `tailchat-types` 和 shared 自己的 model 下各有一份, `config` 的可
 * 空性还不一样, 用结构类型两边都能传进来, 也免得为了对齐类型去动别人的定义。
 */
export interface PanelPermissionShape {
  id: string;
  permissionMap?: Record<string, string[]>;
  fallbackPermissions?: string[];
}

export interface GroupPermissionShape {
  owner: string;
  members: { userId: string; roles?: string[] }[];
  roles: { _id: unknown; permissions: string[] }[];
  panels: PanelPermissionShape[];
  fallbackPermissions?: string[];
}

/**
 * 权限计算, 但针对任意成员而非"当前用户"。
 *
 * `useGroupPermission` 里的那几个 hook 只算得出当前登录用户的权限, 因为它们内部
 * 取的是 `useUserId()`。成员列表要按"谁看得见这个频道"过滤, 需要对每个成员都算一
 * 遍, 所以把纯逻辑抽到这里, 那些 hook 再回过头来用它 —— 两边共用一份实现, 才不会
 * 出现"侧边栏把人藏了, 频道列表却还露着"这种两套判断打架的情况。
 */

/**
 * 某个成员在群组层面拥有的全部权限。
 *
 * 群主是全集: 群主的权限不挂在身份组上, 光看 roles 是推不出来的。
 */
export function getGroupMemberPermissions(
  groupInfo: GroupPermissionShape | undefined | null,
  userId: string
): string[] {
  if (!groupInfo || !userId) {
    return [];
  }

  if (groupInfo.owner === userId) {
    return getPermissionList().map((p) => p.key);
  }

  const userRoles =
    groupInfo.members.find((m) => m.userId === userId)?.roles ?? [];

  return _uniq([
    ..._flatten(
      userRoles.map(
        (roleId) =>
          groupInfo.roles.find((role) => String(role._id) === roleId)
            ?.permissions ?? []
      )
    ),
    ...(groupInfo.fallbackPermissions ?? []),
  ]);
}

/**
 * 某个成员在某个面板上额外拿到的权限。
 *
 * 只是"额外" —— 面板权限是加法, 减不掉群组已经给出去的东西。
 */
export function getPanelMemberPermissions(
  groupInfo: GroupPermissionShape | undefined | null,
  panelInfo: PanelPermissionShape | undefined | null,
  userId: string
): string[] {
  if (!groupInfo || !panelInfo || !userId) {
    return [];
  }

  const permissionMap = panelInfo.permissionMap ?? {};
  const userRoles =
    groupInfo.members.find((m) => m.userId === userId)?.roles ?? [];

  return _uniq([
    ..._flatten(userRoles.map((roleId) => permissionMap[roleId] ?? [])),
    ...(permissionMap[userId] ?? []),
    ...(panelInfo.fallbackPermissions ?? []),
  ]);
}

/**
 * 该成员在这个面板上的最终权限 = 群组权限 ∪ 面板权限。
 *
 * 并集, 不是覆盖 —— 和 `useHasGroupPanelPermission` 保持一致。
 */
export function getMemberPanelPermissions(
  groupInfo: GroupPermissionShape | undefined | null,
  panelId: string,
  userId: string
): string[] {
  const panelInfo = groupInfo?.panels.find((p) => p.id === panelId);

  return _uniq([
    ...getGroupMemberPermissions(groupInfo, userId),
    ...getPanelMemberPermissions(groupInfo, panelInfo, userId),
  ]);
}

/**
 * 这个成员看得见这个频道么。
 *
 * 因为权限是并集, 群组的 fallbackPermissions 里只要有 core.viewPanel, 所有人就都
 * 看得见所有频道 —— 而这正是新建群组的默认值。想让某个频道只对一部分人可见, 得先
 * 把 core.viewPanel 从群组的"所有人"权限里拿掉, 再按身份组发到具体面板上。
 */
export function canMemberViewPanel(
  groupInfo: GroupPermissionShape | undefined | null,
  panelId: string,
  userId: string
): boolean {
  return getMemberPanelPermissions(groupInfo, panelId, userId).includes(
    PERMISSION.core.viewPanel
  );
}
