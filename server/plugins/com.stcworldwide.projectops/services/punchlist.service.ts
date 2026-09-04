import {
  TcService,
  TcDbService,
  TcContext,
  NoPermissionError,
} from 'tailchat-server-sdk';
import type {
  PunchlistItemDocument,
  PunchlistItemModel,
} from '../models/punchlist';
import { assertCanWrite, assertMember, hasManagePanel } from '../utils/group';
import { nextSeq } from '../utils/counter';

/**
 * Punchlist — deficiencies found on a project.
 *
 * Reads are open to any group member; a member may raise an item and edit
 * their own; changing someone else's needs managePanel. Verification is the
 * one deliberate exception: signing off your own fix defeats the point of the
 * second step, so it always needs managePanel.
 */
interface PunchlistService
  extends TcService,
    TcDbService<PunchlistItemDocument, PunchlistItemModel> {}
class PunchlistService extends TcService {
  get serviceName() {
    return 'plugin:com.stcworldwide.projectops.punchlist';
  }

  onInit() {
    this.registerLocalDb(require('../models/punchlist').default);

    this.registerAction('list', this.list, {
      params: {
        groupId: 'string',
        status: { type: 'string', optional: true },
        deviceName: { type: 'string', optional: true },
      },
    });
    this.registerAction('add', this.add, {
      params: {
        groupId: 'string',
        title: 'string',
        description: { type: 'string', optional: true },
        priority: { type: 'string', optional: true },
        trade: { type: 'string', optional: true },
        building: { type: 'string', optional: true },
        level: { type: 'string', optional: true },
        room: { type: 'string', optional: true },
        deviceName: { type: 'string', optional: true },
        systemName: { type: 'string', optional: true },
        panel: { type: 'string', optional: true },
        instance: { type: 'number', optional: true },
        pointName: { type: 'string', optional: true },
        assignee: { type: 'array', items: 'string', optional: true },
        dueDate: { type: 'string', optional: true },
        source: { type: 'string', optional: true },
        checkoutRef: { type: 'string', optional: true },
      },
    });
    this.registerAction('update', this.update, {
      params: {
        groupId: 'string',
        itemId: 'string',
        title: { type: 'string', optional: true },
        description: { type: 'string', optional: true },
        status: { type: 'string', optional: true },
        priority: { type: 'string', optional: true },
        trade: { type: 'string', optional: true },
        assignee: { type: 'array', items: 'string', optional: true },
        dueDate: { type: 'string', optional: true },
        deviceName: { type: 'string', optional: true },
        systemName: { type: 'string', optional: true },
      },
    });
    this.registerAction('resolve', this.resolve, {
      params: {
        groupId: 'string',
        itemId: 'string',
        resolutionNote: { type: 'string', optional: true },
      },
    });
    this.registerAction('verify', this.verify, {
      params: {
        groupId: 'string',
        itemId: 'string',
      },
    });
    this.registerAction('remove', this.remove, {
      params: {
        groupId: 'string',
        itemId: 'string',
      },
    });
  }

  private async list(
    ctx: TcContext<{ groupId: string; status?: string; deviceName?: string }>
  ) {
    const { groupId, status, deviceName } = ctx.params;
    await assertMember(ctx, groupId);

    const query: Record<string, unknown> = {
      groupId,
      deletedAt: { $exists: false },
    };
    if (status) {
      query.status = status;
    }
    if (deviceName) {
      query.deviceName = deviceName;
    }

    const docs = await this.adapter.model
      .find(query)
      .sort({ seq: 'desc' })
      .exec();

    return await this.transformDocuments(ctx, {}, docs);
  }

  private async add(ctx: TcContext<Record<string, any>>) {
    const { groupId, dueDate, ...rest } = ctx.params;
    await assertMember(ctx, groupId);

    const doc = await this.adapter.model.create({
      ...rest,
      groupId,
      seq: await nextSeq(groupId, 'punchlist'),
      reporter: ctx.meta.userId,
      status: 'open',
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    const json = await this.transformDocuments(ctx, {}, doc);
    await this.roomcastNotify(ctx, groupId, 'punchlist.add', json);

    return json;
  }

  private async update(ctx: TcContext<Record<string, any>>) {
    const { groupId, itemId, dueDate, ...rest } = ctx.params;
    await assertMember(ctx, groupId);

    const item = await this.findItem(groupId, itemId);
    await assertCanWrite(ctx, groupId, String(item.reporter));

    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) {
        (item as Record<string, any>)[key] = value;
      }
    });
    if (dueDate !== undefined) {
      item.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    await item.save();

    const json = await this.transformDocuments(ctx, {}, item);
    await this.roomcastNotify(ctx, groupId, 'punchlist.update', json);

    return json;
  }

  /** Mark it fixed. Anyone who may write the item may say they fixed it. */
  private async resolve(
    ctx: TcContext<{ groupId: string; itemId: string; resolutionNote?: string }>
  ) {
    const { groupId, itemId, resolutionNote } = ctx.params;
    await assertMember(ctx, groupId);

    const item = await this.findItem(groupId, itemId);
    await assertCanWrite(ctx, groupId, String(item.reporter));

    item.resolvedBy = ctx.meta.userId;
    item.resolvedAt = new Date();
    item.resolutionNote = resolutionNote;
    item.status = 'readyForReview';
    await item.save();

    const json = await this.transformDocuments(ctx, {}, item);
    await this.roomcastNotify(ctx, groupId, 'punchlist.update', json);

    return json;
  }

  /**
   * Sign it off.
   *
   * Always needs managePanel: the reason fix and verify are two steps is that
   * the same person should not be able to do both, and a permission check
   * that the fixer can satisfy would quietly undo that.
   */
  private async verify(ctx: TcContext<{ groupId: string; itemId: string }>) {
    const { groupId, itemId } = ctx.params;
    await assertMember(ctx, groupId);

    if (!(await hasManagePanel(ctx, groupId))) {
      throw new NoPermissionError('Verifying a fix requires panel management');
    }

    const item = await this.findItem(groupId, itemId);

    item.verifiedBy = ctx.meta.userId;
    item.verifiedAt = new Date();
    item.status = 'closed';
    await item.save();

    const json = await this.transformDocuments(ctx, {}, item);
    await this.roomcastNotify(ctx, groupId, 'punchlist.update', json);

    return json;
  }

  /** Soft delete — these records may have to be defended a year later. */
  private async remove(ctx: TcContext<{ groupId: string; itemId: string }>) {
    const { groupId, itemId } = ctx.params;
    await assertMember(ctx, groupId);

    const item = await this.findItem(groupId, itemId);
    await assertCanWrite(ctx, groupId, String(item.reporter));

    item.deletedAt = new Date();
    await item.save();

    await this.roomcastNotify(ctx, groupId, 'punchlist.remove', {
      _id: String(item._id),
    });

    return true;
  }

  private async findItem(groupId: string, itemId: string) {
    const item = await this.adapter.model.findOne({
      _id: itemId,
      groupId,
      deletedAt: { $exists: false },
    });

    if (!item) {
      throw new Error('Punchlist item not found');
    }

    return item;
  }
}

export default PunchlistService;
