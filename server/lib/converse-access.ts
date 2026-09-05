import { PERMISSION } from 'tailchat-server-sdk';

/**
 * 会话可见性的判定。
 *
 * 单独抽出来是为了能在 CI 里跑到 —— server 的集成测试要连 Mongo, 流水线只跑
 * test/unit、lib/__tests__ 和 models/openapi。鉴权这种东西必须有跑得起来的回归,
 * 放在只在本地跑的地方等于没有。
 *
 * 这里只做判断, 不查库: 事实由 chat.message 服务收集好传进来。
 */

/** 群组频道: converseId 就是面板 id */
export interface GroupConverseFacts {
  kind: 'group';
  /** 反查出来的真实所属群组 */
  groupId: string;
  /** 调用方在参数里自报的群组, 可能没有 */
  claimedGroupId?: string;
  isMember: boolean;
  /** 该用户在这个面板上的最终权限 (群组权限 ∪ 面板权限) */
  panelPermissions: string[];
}

/** 私信 / 多人会话 */
export interface DirectConverseFacts {
  kind: 'direct';
  /** 会话不存在时为 null */
  members: string[] | null;
  userId: string;
}

export type ConverseFacts = GroupConverseFacts | DirectConverseFacts;

/** 拒绝的理由; null 表示放行 */
export type ConverseDenial = 'not-found' | 'no-permission';

const DENY_NOT_FOUND: ConverseDenial = 'not-found';
const DENY: ConverseDenial = 'no-permission';

/**
 * 这个用户能不能读写这个会话。
 *
 * 群组频道要同时满足两件事: 是群成员, 且在这个面板上有 core.viewPanel。少了后者,
 * 频道权限就只是界面装饰 —— 左边栏把频道藏起来了, 接口照样给。
 */
export function decideConverseAccess(
  facts: ConverseFacts
): ConverseDenial | null {
  if (facts.kind === 'group') {
    /*
     * groupId 是调用方自己报的请求参数。报一个自己在的群, 再配一个别的群的
     * converseId, "我在我说的那个群里"这种检查就过了 —— 检查的必须是会话本身。
     */
    if (
      facts.claimedGroupId &&
      String(facts.claimedGroupId) !== String(facts.groupId)
    ) {
      return DENY;
    }

    if (!facts.isMember) {
      return DENY;
    }

    if (!facts.panelPermissions.includes(PERMISSION.core.viewPanel)) {
      return DENY;
    }

    return null;
  }

  if (facts.members === null) {
    return DENY_NOT_FOUND;
  }

  return facts.members.some((member) => String(member) === facts.userId)
    ? null
    : DENY;
}
