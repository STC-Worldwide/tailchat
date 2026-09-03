import { createTestServiceBroker } from '../../utils';
import GroupService from '../../../services/core/group/group.service';
import { Types } from 'mongoose';
import type { Group } from '../../../models/group/group';
import { generateRandomStr } from '../../../lib/utils';
import _ from 'lodash';
import { GroupPanelType, PERMISSION, allPermission } from 'tailchat-server-sdk';

function createTestGroup(
  userId: Types.ObjectId = new Types.ObjectId(),
  groupInfo?: Partial<Group>
): Partial<Group> {
  return {
    name: 'test',
    owner: userId,
    members: [
      {
        roles: [],
        userId: userId,
      },
    ],
    panels: [],
    ...groupInfo,
  };
}

function createTestRole(
  name: string = generateRandomStr(),
  permissions: string[] = []
) {
  const roleId = new Types.ObjectId();
  return {
    _id: roleId,
    id: String(roleId),
    name,
    permissions,
  };
}

describe('Test "group" service', () => {
  const { broker, service, insertTestData, contextCallMock } =
    createTestServiceBroker<GroupService>(GroupService, {
      contextCallMockFn(actionName, params) {
        if (actionName === 'group.getUserAllPermissions') {
          return [PERMISSION.core.owner];
        }
        if (actionName === 'user.getUserInfo') {
          return { nickname: 'test-nickname' };
        }
        if (actionName === 'group.getGroupInfo') {
          // `service` is assigned below; the mock only runs inside tests
          return service.adapter.model.findById(params.groupId).lean();
        }
      },
    });

  test('Test "group.createGroup"', async () => {
    const userId = String(new Types.ObjectId());

    const res: Group = await broker.call(
      'group.createGroup',
      {
        name: 'test',
        panels: [
          {
            id: '00',
            name: '频道1',
            type: GroupPanelType.TEXT,
          },
          {
            id: '10',
            name: '频道分组',
            type: GroupPanelType.GROUP,
          },
          {
            id: '11',
            name: '子频道',
            parentId: '10',
            type: GroupPanelType.TEXT,
          },
        ],
      },
      {
        meta: {
          userId,
        },
      }
    );

    try {
      expect(res).toHaveProperty('name', 'test');
      expect(res).toHaveProperty('panels');
      expect(res).toHaveProperty('owner');
      expect(res.members.length).toBe(1);

      // 面板ID会被自动转换
      const panels = res.panels;
      expect(panels[0].id).toHaveLength(24);
      expect(panels[1].id).toBe(panels[2].parentId);
      expect(res.roles).toEqual([]);
    } finally {
      await service.adapter.model.findByIdAndDelete(res._id);
    }
  });

  test('Test "group.getUserGroups"', async () => {
    const userId = new Types.ObjectId();
    const testGroup = await insertTestData(createTestGroup(userId));

    const res: Group[] = await broker.call(
      'group.getUserGroups',
      {},
      {
        meta: {
          userId: String(userId),
        },
      }
    );

    expect(res.length).toBe(1);
    expect(res[0]._id).toBe(String(testGroup._id));
  });

  test('Test "group.joinGroup"', async () => {
    const userId = new Types.ObjectId();
    const testGroup = await insertTestData(createTestGroup(userId));

    expect(
      [...(testGroup.members ?? [])].map((v) =>
        service.adapter.entityToObject(v)
      )
    ).toEqual([
      {
        roles: [],
        userId,
      },
    ]);

    const newMemberUserId = new Types.ObjectId();

    const res: Group = await broker.call(
      'group.joinGroup',
      {
        groupId: String(testGroup._id),
      },
      {
        meta: {
          userId: String(newMemberUserId),
        },
      }
    );

    const newMembers = [...res.members];
    expect(newMembers).toEqual([
      {
        roles: [],
        userId,
      },
      {
        roles: [],
        userId: newMemberUserId,
      },
    ]);
  });

  test('Test "group.modifyGroupPanel"', async () => {
    const testGroupPanels = [
      {
        id: String(new Types.ObjectId()),
        name: generateRandomStr(),
        type: 1,
      },
      {
        id: String(new Types.ObjectId()),
        name: generateRandomStr(),
        type: 1,
      },
      {
        id: String(new Types.ObjectId()),
        name: generateRandomStr(),
        type: 1,
      },
    ];
    const testGroup = await insertTestData(
      createTestGroup(new Types.ObjectId(), {
        panels: [...testGroupPanels],
      })
    );

    const newPanelName = generateRandomStr();

    const res: Group = await broker.call(
      'group.modifyGroupPanel',
      {
        groupId: String(testGroup._id),
        panelId: String(testGroupPanels[1].id),
        name: newPanelName,
        type: testGroupPanels[1].type,
      },
      {
        meta: {
          userId: String(testGroup.owner),
        },
      }
    );

    const expectedPanels = [
      testGroupPanels[0],
      { ...testGroupPanels[1], name: newPanelName },
      testGroupPanels[2],
    ];
    // panels carry schema defaults (fallbackPermissions) the fixture omits
    expect(res.panels).toMatchObject(expectedPanels);
    expect(_.omit(res, 'updatedAt')).toMatchObject(
      _.omit(
        {
          ...testGroup.toJSON(),
          _id: String(testGroup._id),
          panels: expectedPanels,
        },
        'updatedAt'
      )
    );
  });

  describe('Test "group.deleteGroupPanel"', () => {
    const groupPanelId = new Types.ObjectId();
    const textPanelId = new Types.ObjectId();

    const sampleGroupInfo = {
      panels: [
        {
          id: String(groupPanelId),
          name: '文字频道',
          type: 1,
        },
        {
          id: String(textPanelId),
          name: '大厅',
          parentId: String(groupPanelId),
          type: 0,
        },
        {
          id: String(new Types.ObjectId()),
          name: '其他面板',
          type: 0,
        },
      ],
    };

    test('delete single panel', async () => {
      const userId = new Types.ObjectId();
      const testGroup = await insertTestData(
        createTestGroup(userId, sampleGroupInfo)
      );

      const res: Group = await broker.call(
        'group.deleteGroupPanel',
        {
          groupId: String(testGroup._id),
          panelId: String(textPanelId),
        },
        {
          meta: {
            userId: String(userId),
          },
        }
      );

      expect(res.panels.length).toBe(2);
    });
    test('delete group panel', async () => {
      const userId = new Types.ObjectId();
      const testGroup = await insertTestData(
        createTestGroup(userId, sampleGroupInfo)
      );

      const res: Group = await broker.call(
        'group.deleteGroupPanel',
        {
          groupId: String(testGroup._id),
          panelId: String(groupPanelId),
        },
        {
          meta: {
            userId: String(userId),
          },
        }
      );

      expect(res.panels.length).toBe(1);
    });
  });

  describe('Group Roles Controllers', () => {
    test('Test "group.createGroupRole"', async () => {
      const userId = new Types.ObjectId();
      const testGroup = await insertTestData(createTestGroup(userId));

      const res: Group = await broker.call(
        'group.createGroupRole',
        {
          groupId: String(testGroup.id),
          roleName: 'testRole',
        },
        {
          meta: {
            userId: String(userId),
          },
        }
      );

      expect((res.roles ?? []).length).toBe(1);
      expect(res.roles).toMatchObject([
        {
          name: 'testRole',
          permissions: [],
        },
      ]);
    });

    test('Test "group.deleteGroupRole"', async () => {
      const userId = new Types.ObjectId();
      const role1 = createTestRole('TestRole1', ['permission1', 'permission2']);
      const role2 = createTestRole('TestRole2', ['permission1', 'permission2']);
      const testGroup = await insertTestData(
        createTestGroup(userId, {
          roles: [role1, role2],
          members: [
            {
              userId,
              roles: [role1.id, role2.id],
            },
          ],
        })
      );

      expect(testGroup.roles?.length).toBe(2);
      expect(testGroup.roles).toMatchObject([role1, role2]);

      const res: Group = await broker.call(
        'group.deleteGroupRole',
        {
          groupId: String(testGroup.id),
          roleId: String(role1.id),
        },
        {
          meta: {
            userId: String(userId),
          },
        }
      );

      expect(res.roles?.length).toBe(1);
      expect(res.roles).toMatchObject([
        {
          name: 'TestRole2',
          permissions: ['permission1', 'permission2'],
        },
      ]);
      expect(res.members).toMatchObject([
        {
          userId,
          roles: [role2.id],
        },
      ]);
    });

    test('Test "group.updateGroupRolePermission"', async () => {
      const userId = new Types.ObjectId();
      const role1 = createTestRole('TestRole1', ['permission1', 'permission2']);
      const role2 = createTestRole('TestRole2', ['permission1', 'permission2']);
      const testGroup = await insertTestData(
        createTestGroup(userId, {
          roles: [role1, role2],
        })
      );

      const res: Group = await broker.call(
        'group.updateGroupRolePermission',
        {
          groupId: String(testGroup.id),
          roleId: role1.id,
          permissions: ['foo'],
        },
        {
          meta: {
            userId: String(userId),
          },
        }
      );

      expect((res.roles ?? []).length).toBe(2);
      expect(res.roles).toMatchObject([
        {
          name: 'TestRole1',
          permissions: ['foo'],
        },
        {
          name: 'TestRole2',
          permissions: ['permission1', 'permission2'],
        },
      ]);
    });

    test('Test "group.getPermissions"', async () => {
      const ownerId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const role1 = createTestRole('TestRole1', ['permission1', 'permission2']);
      const role2 = createTestRole('TestRole2', ['permission2', 'permission3']);
      const testGroup = await insertTestData(
        createTestGroup(ownerId, {
          members: [
            {
              userId: ownerId,
              roles: [],
            },
            {
              userId,
              roles: [role1.id, role2.id],
            },
          ],
          roles: [role1, role2],
        })
      );

      // a plain member gets exactly the union of their roles' permissions
      const res: string[] = await broker.call(
        'group.getPermissions',
        {
          groupId: String(testGroup.id),
        },
        {
          meta: {
            userId: String(userId),
          },
        }
      );
      expect(res).toEqual(['permission1', 'permission2', 'permission3']);

      // the owner holds every core permission on top of role permissions
      const ownerRes: string[] = await broker.call(
        'group.getPermissions',
        {
          groupId: String(testGroup.id),
        },
        {
          meta: {
            userId: String(ownerId),
          },
        }
      );
      expect(ownerRes).toEqual(expect.arrayContaining([PERMISSION.core.owner]));
      expect(ownerRes).toEqual(expect.arrayContaining(allPermission));
    });

    test('Test "group.appendGroupMemberRoles"', async () => {
      const userId = new Types.ObjectId();
      const role1 = createTestRole('TestRole1', ['permission1', 'permission2']);
      const role2 = createTestRole('TestRole2', ['permission2', 'permission3']);
      const testGroup = await insertTestData(
        createTestGroup(userId, {
          members: [
            {
              userId,
              roles: [role1.id],
            },
          ],
          roles: [role1, role2],
        })
      );

      await broker.call(
        'group.appendGroupMemberRoles',
        {
          groupId: String(testGroup.id),
          memberIds: [String(userId)],
          roles: [role2.id],
        },
        {
          meta: {
            userId: String(userId),
          },
        }
      );

      expect(service.cleanActionCache.mock.calls).toContainEqual([
        'getGroupInfo',
        [String(testGroup.id)],
      ]);
      expect(service.cleanActionCache.mock.calls).toContainEqual([
        'getUserAllPermissions',
        [String(testGroup.id), String(userId)],
      ]);
      const notifiedGroupId = _.last(service.roomcastNotify.mock.calls)[1];
      const notifiedGroupInfo: Group = _.last(
        service.roomcastNotify.mock.calls
      )[3];

      expect(notifiedGroupId).toEqual(String(testGroup.id));
      expect(notifiedGroupInfo.members).toEqual([
        {
          roles: [role1.id, role2.id],
          userId,
        },
      ]);
    });

    test('Test "group.removeGroupMemberRoles"', async () => {
      const userId = new Types.ObjectId();
      const role1 = createTestRole('TestRole1', ['permission1', 'permission2']);
      const role2 = createTestRole('TestRole2', ['permission2', 'permission3']);
      const testGroup = await insertTestData(
        createTestGroup(userId, {
          members: [
            {
              userId,
              roles: [role1.id],
            },
          ],
          roles: [role1, role2],
        })
      );

      await broker.call(
        'group.removeGroupMemberRoles',
        {
          groupId: String(testGroup.id),
          memberIds: [String(userId)],
          roles: [role1.id],
        },
        {
          meta: {
            userId: String(userId),
          },
        }
      );

      expect(service.cleanActionCache.mock.calls).toContainEqual([
        'getGroupInfo',
        [String(testGroup.id)],
      ]);
      expect(service.cleanActionCache.mock.calls).toContainEqual([
        'getUserAllPermissions',
        [String(testGroup.id), String(userId)],
      ]);
      const notifiedGroupId = _.last(service.roomcastNotify.mock.calls)[1];
      const notifiedGroupInfo: Group = _.last(
        service.roomcastNotify.mock.calls
      )[3];

      expect(notifiedGroupId).toEqual(String(testGroup.id));
      expect(notifiedGroupInfo.members).toEqual([
        {
          roles: [],
          userId,
        },
      ]);
    });
  });

  test('Test "group.muteGroupMember"', async () => {
    const userId = new Types.ObjectId();
    const testGroup = await insertTestData(createTestGroup(userId));

    const muteUntil = new Date().valueOf() + 1000 * 60 * 60 * 10;

    await broker.call(
      'group.muteGroupMember',
      {
        groupId: String(testGroup._id),
        memberId: String(userId),
        muteMs: 1000 * 60 * 60 * 10,
      },
      {
        meta: {
          userId: String(userId),
          user: { nickname: 'foo' },
        },
      }
    );

    const finalGroup = await service.adapter.model.findById(testGroup._id);

    expect(new Date(finalGroup?.members[0].muteUntil ?? 0).valueOf()).toBe(
      muteUntil
    );
  });

  test('Test "group.deleteGroupMember"', async () => {
    const userId = new Types.ObjectId();
    const userId2 = new Types.ObjectId();
    const testGroup = await insertTestData(
      createTestGroup(userId, {
        members: [
          {
            roles: [],
            userId: userId,
          },
          {
            roles: [],
            userId: userId2,
          },
        ],
      })
    );

    const beforeGroup = await service.adapter.model.findById(testGroup._id);

    expect(beforeGroup.members.map((m) => String(m.userId))).toEqual([
      String(userId),
      String(userId2),
    ]);

    await broker.call(
      'group.deleteGroupMember',
      {
        groupId: String(testGroup._id),
        memberId: String(userId2),
      },
      {
        meta: {
          userId: String(userId),
          user: { nickname: 'foo' },
        },
      }
    );

    const finalGroup = await service.adapter.model.findById(testGroup._id);

    expect(finalGroup.members.map((m) => String(m.userId))).toEqual([
      String(userId),
    ]);
  });

  describe('group.addGroupMember', () => {
    test('a member with manageUser adds another user', async () => {
      const userId = new Types.ObjectId();
      const userId2 = new Types.ObjectId();
      const testGroup = await insertTestData(createTestGroup(userId));

      const res: Group = await broker.call(
        'group.addGroupMember',
        {
          groupId: String(testGroup._id),
          userId: String(userId2),
        },
        {
          meta: {
            userId: String(userId),
            user: { nickname: 'foo' },
          },
        }
      );

      expect(res.members.map((m) => String(m.userId))).toEqual([
        String(userId),
        String(userId2),
      ]);

      const finalGroup = await service.adapter.model.findById(testGroup._id);
      expect(finalGroup.members.map((m) => String(m.userId))).toEqual([
        String(userId),
        String(userId2),
      ]);
    });

    test('is refused without the manageUser permission', async () => {
      const userId = new Types.ObjectId();
      const userId2 = new Types.ObjectId();
      const testGroup = await insertTestData(createTestGroup(userId));

      contextCallMock.mockImplementationOnce((actionName: string) => {
        if (actionName === 'group.getUserAllPermissions') {
          return [PERMISSION.core.message];
        }
      });

      await expect(
        broker.call(
          'group.addGroupMember',
          {
            groupId: String(testGroup._id),
            userId: String(userId2),
          },
          {
            meta: {
              userId: String(userId),
              user: { nickname: 'foo' },
            },
          }
        )
      ).rejects.toThrow();

      const finalGroup = await service.adapter.model.findById(testGroup._id);
      expect(finalGroup.members).toHaveLength(1);
    });

    test('is refused for an unknown user', async () => {
      const userId = new Types.ObjectId();
      const testGroup = await insertTestData(createTestGroup(userId));

      contextCallMock
        .mockImplementationOnce((actionName: string) =>
          actionName === 'group.getUserAllPermissions'
            ? [PERMISSION.core.owner]
            : undefined
        )
        .mockImplementationOnce(() => null);

      await expect(
        broker.call(
          'group.addGroupMember',
          {
            groupId: String(testGroup._id),
            userId: String(new Types.ObjectId()),
          },
          {
            meta: {
              userId: String(userId),
              user: { nickname: 'foo' },
            },
          }
        )
      ).rejects.toThrow();
    });

    test('is refused when the user is already a member', async () => {
      const userId = new Types.ObjectId();
      const testGroup = await insertTestData(createTestGroup(userId));

      await expect(
        broker.call(
          'group.addGroupMember',
          {
            groupId: String(testGroup._id),
            userId: String(userId),
          },
          {
            meta: {
              userId: String(userId),
              user: { nickname: 'foo' },
            },
          }
        )
      ).rejects.toThrow();
    });
  });
});
