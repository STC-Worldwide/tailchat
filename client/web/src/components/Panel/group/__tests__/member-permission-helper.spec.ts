import {
  canMemberViewPanel,
  getGroupMemberPermissions,
  getMemberPanelPermissions,
  getPanelMemberPermissions,
  PERMISSION,
} from 'tailchat-shared';

/*
 * 这个 spec 放在 web 下而不是紧挨着被测模块, 是因为 CI 只在 client/web 里跑 jest
 * (`cd client/web && pnpm test`), client/shared 下的 __tests__ 一个都不会执行 ——
 * 放在那边等于没有守卫。
 */

/**
 * 这些断言钉的是"面板权限是加法"这件事。
 *
 * 成员列表按它过滤, 频道列表也按它隐藏频道 —— 两边算错的方向不一样的话, 就会出现
 * 侧边栏把人藏了、频道列表却还露着的情况, 所以语义必须在这里写死。
 */
const VIEW = PERMISSION.core.viewPanel;
const MESSAGE = PERMISSION.core.message;

const buildGroup = (overrides: any = {}): any => ({
  _id: 'g1',
  name: 'Project 861',
  owner: 'owner-1',
  members: [
    { userId: 'owner-1', roles: [] },
    { userId: 'foreman-1', roles: ['role-foreman'] },
    { userId: 'crew-1', roles: [] },
  ],
  roles: [
    { _id: 'role-foreman', name: 'Foreman', permissions: [MESSAGE] },
    { _id: 'role-admin', name: 'Admin', permissions: [] },
  ],
  panels: [
    { id: 'p1', name: 'Lobby' },
    {
      id: 'p2',
      name: 'Foreman only',
      fallbackPermissions: [],
      permissionMap: { 'role-foreman': [VIEW] },
    },
  ],
  fallbackPermissions: [VIEW, MESSAGE],
  config: {},
  ...overrides,
});

describe('getGroupMemberPermissions', () => {
  test('the owner holds every permission, not just their roles', () => {
    // 群主的权限不挂在身份组上, 光看 roles 会把群主算成没有权限
    const group = buildGroup({ fallbackPermissions: [] });
    const permissions = getGroupMemberPermissions(group, 'owner-1');

    expect(permissions).toContain(VIEW);
    expect(permissions).toContain(PERMISSION.core.manageRoles);
  });

  test('a member gets their roles plus the group fallback', () => {
    expect(getGroupMemberPermissions(buildGroup(), 'foreman-1')).toEqual(
      expect.arrayContaining([VIEW, MESSAGE])
    );
    expect(getGroupMemberPermissions(buildGroup(), 'crew-1')).toEqual(
      expect.arrayContaining([VIEW, MESSAGE])
    );
  });

  test('an unknown user and a missing group both read as no permissions', () => {
    expect(getGroupMemberPermissions(buildGroup(), 'nobody')).toEqual([
      VIEW,
      MESSAGE,
    ]);
    expect(getGroupMemberPermissions(undefined, 'crew-1')).toEqual([]);
    expect(getGroupMemberPermissions(buildGroup(), '')).toEqual([]);
  });

  test('a role id left on a member after the role was deleted is ignored', () => {
    const group = buildGroup({
      members: [{ userId: 'crew-1', roles: ['role-deleted'] }],
      fallbackPermissions: [],
    });

    expect(getGroupMemberPermissions(group, 'crew-1')).toEqual([]);
  });
});

describe('getPanelMemberPermissions', () => {
  test('grants come from the role map, the per-user map and the panel fallback', () => {
    const group = buildGroup();
    const panel: any = {
      id: 'p3',
      fallbackPermissions: [MESSAGE],
      permissionMap: { 'role-foreman': [VIEW], 'crew-1': [VIEW] },
    };

    expect(getPanelMemberPermissions(group, panel, 'foreman-1')).toEqual(
      expect.arrayContaining([VIEW, MESSAGE])
    );
    expect(getPanelMemberPermissions(group, panel, 'crew-1')).toEqual(
      expect.arrayContaining([VIEW, MESSAGE])
    );
  });

  test('a panel with no permission config grants nothing of its own', () => {
    const group = buildGroup();
    expect(
      getPanelMemberPermissions(group, { id: 'p1' } as any, 'crew-1')
    ).toEqual([]);
  });
});

describe('canMemberViewPanel', () => {
  test('the group fallback alone is enough — this is the default group', () => {
    // 新建群组的 fallbackPermissions 就带着 core.viewPanel, 所以默认情况下
    // 所有人都看得见所有频道, 过滤器不会藏任何人。
    const group = buildGroup();

    expect(canMemberViewPanel(group, 'p2', 'crew-1')).toBe(true);
    expect(canMemberViewPanel(group, 'p2', 'foreman-1')).toBe(true);
  });

  test('once viewPanel leaves the group fallback, the panel map decides', () => {
    const group = buildGroup({ fallbackPermissions: [MESSAGE] });

    expect(canMemberViewPanel(group, 'p2', 'foreman-1')).toBe(true);
    expect(canMemberViewPanel(group, 'p2', 'crew-1')).toBe(false);
    // 群主永远看得见
    expect(canMemberViewPanel(group, 'p2', 'owner-1')).toBe(true);
  });

  test('a panel cannot take away what the group already granted', () => {
    // 权限是并集而不是覆盖: 面板上写着空的 fallbackPermissions 也挡不住群组给的
    const group = buildGroup();
    const restrictive = buildGroup({
      panels: [
        { id: 'p2', fallbackPermissions: [], permissionMap: {} },
        ...group.panels.filter((p: any) => p.id !== 'p2'),
      ],
    });

    expect(canMemberViewPanel(restrictive, 'p2', 'crew-1')).toBe(true);
  });

  test('an unknown panel id is not viewable', () => {
    const group = buildGroup({ fallbackPermissions: [MESSAGE] });
    expect(canMemberViewPanel(group, 'does-not-exist', 'crew-1')).toBe(false);
  });
});

describe('getMemberPanelPermissions', () => {
  test('is the union of the group and the panel', () => {
    const group = buildGroup({ fallbackPermissions: [MESSAGE] });

    expect(getMemberPanelPermissions(group, 'p2', 'foreman-1').sort()).toEqual(
      [MESSAGE, VIEW].sort()
    );
  });
});
