import { createTestServiceBroker } from '../../utils';
import OpenAdminService from '../../../services/openapi/admin.service';
import { Types } from 'mongoose';
import { SYSTEM_USERID } from 'tailchat-server-sdk';

const botUserId = String(new Types.ObjectId());
const targetUserId = String(new Types.ObjectId());
const groupId = String(new Types.ObjectId());

const adminMeta = {
  meta: {
    userId: botUserId,
    user: { _id: botUserId, nickname: 'agent' },
    apiKey: { keyId: 'k', appId: 'tc_x', scopes: ['admin', 'message:read'] },
  },
};
const plainKeyMeta = {
  meta: {
    userId: botUserId,
    user: { _id: botUserId, nickname: 'agent' },
    apiKey: { keyId: 'k', appId: 'tc_x', scopes: ['group:manage'] },
  },
};
const humanMeta = {
  meta: { userId: String(new Types.ObjectId()), user: { nickname: 'tim' } },
};
const systemMeta = { meta: { userId: SYSTEM_USERID } };

describe('Test "openapi.admin" service', () => {
  const { broker, contextCallMock } = createTestServiceBroker<OpenAdminService>(
    OpenAdminService,
    {
      contextCallMockFn(actionName) {
        if (actionName === 'user.findUserByEmail') {
          return { _id: targetUserId, nickname: 'target' };
        }
        if (actionName === 'user.findUserByUsername') {
          return null;
        }
        if (actionName === 'group.addMember') {
          return { _id: groupId, name: 'g' };
        }
        return true;
      },
    }
  );

  beforeEach(() => {
    contextCallMock.mockClear();
  });

  test.each([
    ['findUser', { email: 'a@b.c' }],
    ['banUser', { userId: targetUserId }],
    ['unbanUser', { userId: targetUserId }],
    ['addGroupMember', { groupId, userId: targetUserId }],
    ['notifyUsers', { userIds: [targetUserId], title: 't', content: 'c' }],
  ])('%s is refused without the admin scope', async (action, params) => {
    await expect(
      broker.call(`openapi.admin.${action}`, params, plainKeyMeta)
    ).rejects.toThrow();
    await expect(
      broker.call(`openapi.admin.${action}`, params, humanMeta)
    ).rejects.toThrow();
    await expect(
      broker.call(`openapi.admin.${action}`, params, { meta: {} })
    ).rejects.toThrow();
    expect(contextCallMock).not.toHaveBeenCalled();
  });

  test('findUser by email', async () => {
    const res: any = await broker.call(
      'openapi.admin.findUser',
      { email: 'a@b.c' },
      adminMeta
    );
    expect(res._id).toBe(targetUserId);
    expect(contextCallMock).toHaveBeenCalledWith('user.findUserByEmail', {
      email: 'a@b.c',
    });
  });

  test('findUser by username returns null when absent', async () => {
    const res = await broker.call(
      'openapi.admin.findUser',
      { username: 'nobody' },
      adminMeta
    );
    expect(res).toBeNull();
  });

  test('findUser needs an email or a username', async () => {
    await expect(
      broker.call('openapi.admin.findUser', {}, adminMeta)
    ).rejects.toThrow();
  });

  test('banUser / unbanUser delegate to the user service', async () => {
    await broker.call(
      'openapi.admin.banUser',
      { userId: targetUserId },
      adminMeta
    );
    expect(contextCallMock).toHaveBeenCalledWith('user.banUser', {
      userId: targetUserId,
    });

    await broker.call(
      'openapi.admin.unbanUser',
      { userId: targetUserId },
      systemMeta
    );
    expect(contextCallMock).toHaveBeenCalledWith('user.unbanUser', {
      userId: targetUserId,
    });
  });

  test('a key cannot ban its own bot user', async () => {
    await expect(
      broker.call('openapi.admin.banUser', { userId: botUserId }, adminMeta)
    ).rejects.toThrow();
  });

  test('addGroupMember bypasses group permissions', async () => {
    const res: any = await broker.call(
      'openapi.admin.addGroupMember',
      { groupId, userId: targetUserId },
      adminMeta
    );
    expect(res._id).toBe(groupId);
    expect(contextCallMock).toHaveBeenCalledWith('group.addMember', {
      groupId,
      userId: targetUserId,
    });
    expect(contextCallMock.mock.calls.map((c) => c[0])).not.toContain(
      'group.getUserAllPermissions'
    );
  });

  test('notifyUsers appends a markdown inbox item', async () => {
    await broker.call(
      'openapi.admin.notifyUsers',
      { userIds: [targetUserId], title: 'Hello', content: '**hi**' },
      adminMeta
    );
    expect(contextCallMock).toHaveBeenCalledWith('chat.inbox.batchAppend', {
      userIds: [targetUserId],
      type: 'markdown',
      payload: { title: 'Hello', content: '**hi**' },
    });
  });
});
