import { buildMemberGroups, filterMembersByPanel } from '../memberGroups';
import { PERMISSION } from 'tailchat-shared';

const VIEW = PERMISSION.core.viewPanel;
const MESSAGE = PERMISSION.core.message;

const user = (id: string): any => ({ _id: id, nickname: id });

const buildGroup = (overrides: any = {}): any => ({
  _id: 'g1',
  owner: 'owner-1',
  members: [
    { userId: 'owner-1', roles: ['role-admin'] },
    { userId: 'foreman-1', roles: ['role-foreman'] },
    { userId: 'both-1', roles: ['role-foreman', 'role-admin'] },
    { userId: 'crew-1', roles: [] },
  ],
  roles: [
    { _id: 'role-admin', name: 'Admin', permissions: [] },
    { _id: 'role-foreman', name: 'Foreman', permissions: [] },
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

const labels = { online: 'Online', offline: 'Offline' };
const allOnline = () => true;

const summarise = (groups: ReturnType<typeof buildMemberGroups>) =>
  groups.map((g) => [g.label, g.members.map((m) => m._id)]);

describe('buildMemberGroups', () => {
  test('roles come first in the order the group defines them, then online, then offline', () => {
    const groups = buildMemberGroups({
      groupInfo: buildGroup(),
      members: [user('crew-1'), user('foreman-1'), user('owner-1')],
      isOnline: allOnline,
      labels,
    });

    expect(summarise(groups)).toEqual([
      ['Admin', ['owner-1']],
      ['Foreman', ['foreman-1']],
      ['Online', ['crew-1']],
    ]);
  });

  test('a member in several roles is listed once, under the highest', () => {
    // roles 数组的顺序就是排序依据, Admin 排在 Foreman 前面
    const groups = buildMemberGroups({
      groupInfo: buildGroup(),
      members: [user('both-1')],
      isOnline: allOnline,
      labels,
    });

    expect(summarise(groups)).toEqual([['Admin', ['both-1']]]);
  });

  test('offline members sink to Offline even when they hold a role', () => {
    const groups = buildMemberGroups({
      groupInfo: buildGroup(),
      members: [user('foreman-1'), user('crew-1')],
      isOnline: (id) => id === 'crew-1',
      labels,
    });

    expect(summarise(groups)).toEqual([
      ['Online', ['crew-1']],
      ['Offline', ['foreman-1']],
    ]);
  });

  test('empty groups are dropped rather than rendered as a bare header', () => {
    const groups = buildMemberGroups({
      groupInfo: buildGroup(),
      members: [user('crew-1')],
      isOnline: allOnline,
      labels,
    });

    expect(groups.map((g) => g.label)).toEqual(['Online']);
  });

  test('without a panelId every member is listed', () => {
    const groupInfo = buildGroup({ fallbackPermissions: [MESSAGE] });
    const groups = buildMemberGroups({
      groupInfo,
      members: [user('crew-1'), user('foreman-1')],
      isOnline: allOnline,
      labels,
    });

    expect(groups.flatMap((g) => g.members.map((m) => m._id)).sort()).toEqual([
      'crew-1',
      'foreman-1',
    ]);
  });

  test('with a panelId, members who cannot view that panel are dropped', () => {
    const groupInfo = buildGroup({ fallbackPermissions: [MESSAGE] });
    const groups = buildMemberGroups({
      groupInfo,
      panelId: 'p2',
      members: [user('crew-1'), user('foreman-1'), user('owner-1')],
      isOnline: allOnline,
      labels,
    });

    // crew-1 有 message 但没有 viewPanel; 群主永远在
    expect(summarise(groups)).toEqual([
      ['Admin', ['owner-1']],
      ['Foreman', ['foreman-1']],
    ]);
  });

  test('the default group hides nobody, because viewPanel is a group fallback', () => {
    const groups = buildMemberGroups({
      groupInfo: buildGroup(),
      panelId: 'p2',
      members: [user('crew-1'), user('foreman-1')],
      isOnline: allOnline,
      labels,
    });

    expect(groups.flatMap((g) => g.members.map((m) => m._id)).sort()).toEqual([
      'crew-1',
      'foreman-1',
    ]);
  });

  test('a stale role id on a member does not create a phantom group', () => {
    const groupInfo = buildGroup({
      members: [{ userId: 'crew-1', roles: ['role-deleted'] }],
    });
    const groups = buildMemberGroups({
      groupInfo,
      members: [user('crew-1')],
      isOnline: allOnline,
      labels,
    });

    expect(summarise(groups)).toEqual([['Online', ['crew-1']]]);
  });

  test('no group info at all still renders the members it was handed', () => {
    const groups = buildMemberGroups({
      groupInfo: undefined,
      members: [user('crew-1')],
      isOnline: allOnline,
      labels,
    });

    expect(summarise(groups)).toEqual([['Online', ['crew-1']]]);
  });

  test('search results are filtered too, so a name lookup cannot reveal a hidden member', () => {
    const groupInfo = buildGroup({ fallbackPermissions: [MESSAGE] });
    const searchHits = [user('crew-1'), user('foreman-1')];

    expect(
      filterMembersByPanel(groupInfo, 'p2', searchHits).map((m) => m._id)
    ).toEqual(['foreman-1']);
  });

  test('with no panel selected the filter is a pass-through', () => {
    const members = [user('crew-1'), user('foreman-1')];
    expect(filterMembersByPanel(buildGroup(), undefined, members)).toBe(
      members
    );
  });
});
