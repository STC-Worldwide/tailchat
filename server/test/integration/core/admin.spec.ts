import { createTestServiceBroker } from '../../utils';
import AdminService from '../../../services/core/admin.service';
import { Types } from 'mongoose';
import { SYSTEM_USERID } from 'tailchat-server-sdk';
import { TEST_ADMIN_USER_ID } from '../../constants';

const targetUserId = String(new Types.ObjectId());
const groupId = String(new Types.ObjectId());
const ordinaryUserId = String(new Types.ObjectId());

/**
 * Administration is gated on WHO the caller is, not on how they authenticated:
 * a token acts as its owner, so an ordinary user's token is refused exactly
 * like their login would be.
 */
const adminLogin = {
  meta: { userId: TEST_ADMIN_USER_ID, user: { nickname: 'tim' } },
};
const adminToken = {
  meta: {
    userId: TEST_ADMIN_USER_ID,
    user: { nickname: 'tim' },
    apiKey: { keyId: 'k', userId: TEST_ADMIN_USER_ID, scopes: ['admin'] },
  },
};
const ordinaryLogin = {
  meta: { userId: ordinaryUserId, user: { nickname: 'someone' } },
};
const ordinaryToken = {
  meta: {
    userId: ordinaryUserId,
    user: { nickname: 'someone' },
    apiKey: { keyId: 'k', userId: ordinaryUserId, scopes: ['admin'] },
  },
};
const systemMeta = { meta: { userId: SYSTEM_USERID } };

describe('Test "admin" service', () => {
  const { broker, contextCallMock } = createTestServiceBroker<AdminService>(
    AdminService,
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

  const cases: [string, Record<string, unknown>][] = [
    ['findUser', { email: 'a@b.c' }],
    ['banUser', { userId: targetUserId }],
    ['unbanUser', { userId: targetUserId }],
    ['addGroupMember', { groupId, userId: targetUserId }],
    ['notifyUsers', { userIds: [targetUserId], title: 't', content: 'c' }],
  ];

  test.each(cases)(
    '%s is refused for an ordinary user login',
    async (action, params) => {
      await expect(
        broker.call(`admin.${action}`, params, ordinaryLogin)
      ).rejects.toThrow(/administrator/);
    }
  );

  test.each(cases)(
    '%s is refused for an ordinary user token, even one claiming the admin scope',
    async (action, params) => {
      await expect(
        broker.call(`admin.${action}`, params, ordinaryToken)
      ).rejects.toThrow(/administrator/);
    }
  );

  test.each(cases)(
    '%s is allowed for a server administrator',
    async (action, params) => {
      await expect(
        broker.call(`admin.${action}`, params, adminLogin)
      ).resolves.toBeDefined();
    }
  );

  test.each(cases)(
    '%s is allowed for a server administrator token',
    async (action, params) => {
      await expect(
        broker.call(`admin.${action}`, params, adminToken)
      ).resolves.toBeDefined();
    }
  );

  test('the admin panel system identity is allowed', async () => {
    await expect(
      broker.call('admin.banUser', { userId: targetUserId }, systemMeta)
    ).resolves.toBe(true);
  });

  test('findUser looks up by email then username, and needs one of them', async () => {
    const byEmail = await broker.call(
      'admin.findUser',
      { email: 'a@b.c' },
      adminToken
    );
    expect(byEmail).toMatchObject({ _id: targetUserId });
    expect(contextCallMock).toHaveBeenCalledWith('user.findUserByEmail', {
      email: 'a@b.c',
    });

    const byUsername = await broker.call(
      'admin.findUser',
      { username: 'nobody' },
      adminToken
    );
    expect(byUsername).toBeNull();

    await expect(broker.call('admin.findUser', {}, adminToken)).rejects.toThrow(
      /email or username/
    );
  });

  test('banUser refuses to ban the caller', async () => {
    await expect(
      broker.call('admin.banUser', { userId: TEST_ADMIN_USER_ID }, adminToken)
    ).rejects.toThrow(/Cannot ban the calling user/);
  });

  test('notifyUsers writes a markdown item to each inbox', async () => {
    await broker.call(
      'admin.notifyUsers',
      { userIds: [targetUserId], title: 'Heads up', content: 'body' },
      adminToken
    );

    expect(contextCallMock).toHaveBeenCalledWith('chat.inbox.batchAppend', {
      userIds: [targetUserId],
      type: 'markdown',
      payload: { title: 'Heads up', content: 'body' },
    });
  });

  test('addGroupMember bypasses group permissions', async () => {
    await broker.call(
      'admin.addGroupMember',
      { groupId, userId: targetUserId },
      adminToken
    );

    expect(contextCallMock).toHaveBeenCalledWith('group.addMember', {
      groupId,
      userId: targetUserId,
    });
  });
});
