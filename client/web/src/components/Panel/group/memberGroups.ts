import type { GroupInfo, UserBaseInfo } from 'tailchat-shared';
import { canMemberViewPanel } from 'tailchat-shared';

export interface MemberGroup {
  /** 稳定的 key: 身份组用其 id, 在线/离线用固定串 */
  key: string;
  label: string;
  members: UserBaseInfo[];
}

interface BuildMemberGroupsOptions {
  groupInfo: GroupInfo | undefined | null;
  /** 传了就按"谁看得见这个频道"过滤; 不传则列出全部成员 */
  panelId?: string;
  members: UserBaseInfo[];
  /** 该成员当前是否在线 */
  isOnline: (userId: string) => boolean;
  labels: { online: string; offline: string };
}

/**
 * 只留下在这个频道里有 `core.viewPanel` 的人。
 *
 * 搜索结果也要过一遍: 不然按名字一搜, 就把分组里刻意藏起来的人捞回来了。
 */
export function filterMembersByPanel(
  groupInfo: GroupInfo | undefined | null,
  panelId: string | undefined,
  members: UserBaseInfo[]
): UserBaseInfo[] {
  if (!panelId) {
    return members;
  }

  return members.filter((member) =>
    canMemberViewPanel(groupInfo, panelId, member._id)
  );
}

/**
 * 把成员分成 身份组 → 在线 → 离线 三段, 顺序即展示顺序。
 *
 * 只有**在线**成员会挂到身份组下面, 离线的一律沉到最后一组 —— 一个满是灰名字的
 * "管理员"分组既占地方又没有信息量, 人看这个列表是想知道现在能找谁。
 *
 * 一个人可能同时属于好几个身份组, 但只会出现一次: 取 `groupInfo.roles` 里排在最前
 * 面的那个。这里没有单独的 rank 字段, 数组顺序就是唯一的排序依据。
 */
export function buildMemberGroups(
  options: BuildMemberGroupsOptions
): MemberGroup[] {
  const { groupInfo, panelId, members, isOnline, labels } = options;

  const visible = filterMembersByPanel(groupInfo, panelId, members);

  const roles = groupInfo?.roles ?? [];
  const roleOrder = new Map(
    roles.map((role, index) => [String(role._id), index])
  );
  const memberRoles = new Map(
    (groupInfo?.members ?? []).map((m) => [m.userId, m.roles ?? []])
  );

  /** 该成员排在最前的身份组, 没有身份组则为 null */
  const topRoleOf = (userId: string): string | null => {
    let top: string | null = null;
    let topIndex = Number.POSITIVE_INFINITY;

    for (const roleId of memberRoles.get(userId) ?? []) {
      const index = roleOrder.get(String(roleId));
      // 成员身上可能留着已被删除的身份组 id, 那种直接跳过
      if (index !== undefined && index < topIndex) {
        top = String(roleId);
        topIndex = index;
      }
    }

    return top;
  };

  const byRole = new Map<string, UserBaseInfo[]>();
  const online: UserBaseInfo[] = [];
  const offline: UserBaseInfo[] = [];

  for (const member of visible) {
    if (!isOnline(member._id)) {
      offline.push(member);
      continue;
    }

    const roleId = topRoleOf(member._id);
    if (roleId === null) {
      online.push(member);
      continue;
    }

    const bucket = byRole.get(roleId);
    if (bucket) {
      bucket.push(member);
    } else {
      byRole.set(roleId, [member]);
    }
  }

  const groups: MemberGroup[] = [];

  for (const role of roles) {
    const roleMembers = byRole.get(String(role._id));
    if (roleMembers && roleMembers.length > 0) {
      groups.push({
        key: String(role._id),
        label: role.name,
        members: roleMembers,
      });
    }
  }

  if (online.length > 0) {
    groups.push({ key: 'online', label: labels.online, members: online });
  }

  if (offline.length > 0) {
    groups.push({ key: 'offline', label: labels.offline, members: offline });
  }

  return groups;
}
