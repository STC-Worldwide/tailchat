import { decideConverseAccess } from '../converse-access';
import { PERMISSION } from 'tailchat-server-sdk';

/**
 * 这一组盯的是一个真实存在过的洞: `chat.message.fetchConverseMessage` 从来没有
 * 鉴权 —— 拿到任意 converseId 就能读走整个会话, 包括别人之间的私信 —— 而
 * `core.viewPanel` 只在客户端生效, 服务端连这个权限点都没定义过。
 *
 * 所以每条用例都应当在去掉对应那段判断之后失败。
 */
const VIEW = PERMISSION.core.viewPanel;

const groupFacts = (
  over: Partial<Parameters<typeof decideConverseAccess>[0]> = {}
) =>
  ({
    kind: 'group' as const,
    groupId: 'group-1',
    isMember: true,
    panelPermissions: [VIEW],
    ...over,
  } as any);

describe('decideConverseAccess — group channels', () => {
  test('a member who can view the panel is allowed', () => {
    expect(decideConverseAccess(groupFacts())).toBeNull();
  });

  test('a member without viewPanel is refused', () => {
    // 没有这条, 频道权限就只是界面装饰: 侧边栏藏了频道, 接口照给
    expect(
      decideConverseAccess(groupFacts({ panelPermissions: ['core.message'] }))
    ).toBe('no-permission');
  });

  test('an empty permission set is refused, not defaulted open', () => {
    expect(decideConverseAccess(groupFacts({ panelPermissions: [] }))).toBe(
      'no-permission'
    );
  });

  test('a non-member is refused even with the permission', () => {
    expect(decideConverseAccess(groupFacts({ isMember: false }))).toBe(
      'no-permission'
    );
  });

  test('a claimed groupId that does not own the converse is refused', () => {
    /*
     * groupId 是请求参数。报一个自己在的群、再配一个别的群的 converseId, 只查
     * "我在我说的那个群里"的话这就过了 —— 会话本身才是要检查的东西。
     */
    expect(
      decideConverseAccess(
        groupFacts({ groupId: 'group-1', claimedGroupId: 'group-2' })
      )
    ).toBe('no-permission');
  });

  test('a claimed groupId that matches is fine', () => {
    expect(
      decideConverseAccess(
        groupFacts({ groupId: 'group-1', claimedGroupId: 'group-1' })
      )
    ).toBeNull();
  });

  test('no claimed groupId at all is fine — it is derived', () => {
    // 客户端读消息只带 converseId, 所以"不报"必须是正常路径
    expect(
      decideConverseAccess(groupFacts({ claimedGroupId: undefined }))
    ).toBeNull();
  });
});

describe('decideConverseAccess — direct messages', () => {
  const direct = (members: string[] | null, userId = 'me') =>
    decideConverseAccess({ kind: 'direct', members, userId });

  test('a participant is allowed', () => {
    expect(direct(['me', 'them'])).toBeNull();
  });

  test('someone else’s DM is refused', () => {
    expect(direct(['them', 'other'])).toBe('no-permission');
  });

  test('a converse that does not exist reads as not-found', () => {
    expect(direct(null)).toBe('not-found');
  });

  test('an empty member list is refused rather than open', () => {
    expect(direct([])).toBe('no-permission');
  });

  test('member ids are compared as strings', () => {
    // members 从库里出来是 ObjectId, userId 是字符串
    expect(direct([{ toString: () => 'me' } as any])).toBeNull();
  });
});
