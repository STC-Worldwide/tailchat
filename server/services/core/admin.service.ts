import {
  TcService,
  TcContext,
  EntityError,
  NoPermissionError,
  isServerAdmin,
  UserStruct,
} from 'tailchat-server-sdk';
import { isValidStr } from '../../lib/utils';

/**
 * Server administration.
 *
 * The caller must be a server administrator: the admin panel's system
 * identity, or a user id listed in ADMIN_USER_IDS. That holds whether the
 * request arrives with a login or with a personal access token — a token acts
 * as its owner and can never outrank them — and a token additionally needs the
 * `admin` scope, which the gateway checks before the action runs.
 *
 * Design: docs/superpowers/specs/2026-09-03-tailchat-agent-api-design.md
 */
class AdminService extends TcService {
  get serviceName(): string {
    return 'admin';
  }

  onInit(): void {
    this.registerAction('findUser', this.findUser, {
      params: {
        email: { type: 'string', optional: true },
        username: { type: 'string', optional: true },
      },
    });
    this.registerAction('banUser', this.banUser, {
      params: {
        userId: 'string',
      },
    });
    this.registerAction('unbanUser', this.unbanUser, {
      params: {
        userId: 'string',
      },
    });
    this.registerAction('addGroupMember', this.addGroupMember, {
      params: {
        groupId: 'string',
        userId: 'string',
      },
    });
    this.registerAction('notifyUsers', this.notifyUsers, {
      params: {
        userIds: { type: 'array', items: 'string', min: 1 },
        title: 'string',
        content: 'string',
      },
    });
  }

  /**
   * Look a user up by email or username. Returns null when absent.
   */
  async findUser(
    ctx: TcContext<{ email?: string; username?: string }>
  ): Promise<UserStruct | null> {
    this.assertAdmin(ctx);
    const { email, username } = ctx.params;

    if (isValidStr(email)) {
      return (await ctx.call('user.findUserByEmail', { email })) ?? null;
    }

    if (isValidStr(username)) {
      return (await ctx.call('user.findUserByUsername', { username })) ?? null;
    }

    throw new EntityError('email or username is required');
  }

  async banUser(ctx: TcContext<{ userId: string }>): Promise<boolean> {
    this.assertAdmin(ctx);
    const { userId } = ctx.params;

    if (String(userId) === String(ctx.meta.userId)) {
      throw new EntityError('Cannot ban the calling user');
    }

    await ctx.call('user.banUser', { userId });
    this.logger.info('[admin] banned', userId, 'by', this.actor(ctx));

    return true;
  }

  async unbanUser(ctx: TcContext<{ userId: string }>): Promise<boolean> {
    this.assertAdmin(ctx);
    const { userId } = ctx.params;

    await ctx.call('user.unbanUser', { userId });
    this.logger.info('[admin] unbanned', userId, 'by', this.actor(ctx));

    return true;
  }

  /**
   * Add a user to any group, without a group-level permission check.
   */
  async addGroupMember(ctx: TcContext<{ groupId: string; userId: string }>) {
    this.assertAdmin(ctx);
    const { groupId, userId } = ctx.params;

    const group = await ctx.call('group.addMember', { groupId, userId });
    this.logger.info(
      '[admin] added',
      userId,
      'to group',
      groupId,
      'by',
      this.actor(ctx)
    );

    return group;
  }

  /**
   * Put a markdown item in the inbox of each listed user.
   */
  async notifyUsers(
    ctx: TcContext<{ userIds: string[]; title: string; content: string }>
  ): Promise<{ userIds: string[] }> {
    this.assertAdmin(ctx);
    const { userIds, title, content } = ctx.params;

    await ctx.call('chat.inbox.batchAppend', {
      userIds,
      type: 'markdown',
      payload: { title, content },
    });

    return { userIds };
  }

  private assertAdmin(ctx: TcContext) {
    if (isServerAdmin(ctx.meta.userId)) {
      return;
    }

    throw new NoPermissionError(
      'Server administrator rights are required (ADMIN_USER_IDS)'
    );
  }

  private actor(ctx: TcContext): string {
    if (ctx.meta.apiKey) {
      return `key ${ctx.meta.apiKey.keyId} (user ${ctx.meta.apiKey.userId})`;
    }
    return `user ${ctx.meta.userId}`;
  }
}

export default AdminService;
