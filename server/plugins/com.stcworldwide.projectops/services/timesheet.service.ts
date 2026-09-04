import {
  TcService,
  TcDbService,
  TcContext,
  NoPermissionError,
} from 'tailchat-server-sdk';
import type {
  TimesheetEntryDocument,
  TimesheetEntryModel,
} from '../models/timesheet';
import { assertMember, getMemberRoles, hasManagePanel } from '../utils/group';
import { nextSeq } from '../utils/counter';
import { getTimesheetChain } from '../utils/settings';
import { canDecide, onDecision, onSubmit } from '../utils/approval';

/**
 * Timesheets — hours booked to an area and a task type.
 *
 * Every group member can read every entry (a decision, not an oversight), so
 * `list` does no per-user filtering. Writes are the owner's alone until the
 * entry is approved, at which point it locks and only a panel manager can
 * reopen it.
 */
interface TimesheetService
  extends TcService,
    TcDbService<TimesheetEntryDocument, TimesheetEntryModel> {}
class TimesheetService extends TcService {
  get serviceName() {
    return 'plugin:com.stcworldwide.projectops.timesheet';
  }

  onInit() {
    this.registerLocalDb(require('../models/timesheet').default);

    this.registerAction('list', this.list, {
      params: {
        groupId: 'string',
        userId: { type: 'string', optional: true },
        from: { type: 'string', optional: true },
        to: { type: 'string', optional: true },
        status: { type: 'string', optional: true },
      },
    });
    this.registerAction('add', this.add, {
      params: {
        groupId: 'string',
        workDate: 'string',
        hours: 'number',
        hourType: { type: 'string', optional: true },
        area: { type: 'string', optional: true },
        taskType: { type: 'string', optional: true },
        description: { type: 'string', optional: true },
        building: { type: 'string', optional: true },
        systemName: { type: 'string', optional: true },
        startAt: { type: 'string', optional: true },
        endAt: { type: 'string', optional: true },
        breakMinutes: { type: 'number', optional: true },
        punchlistIds: { type: 'array', items: 'string', optional: true },
      },
    });
    this.registerAction('update', this.update, {
      params: {
        groupId: 'string',
        entryId: 'string',
        hours: { type: 'number', optional: true },
        hourType: { type: 'string', optional: true },
        area: { type: 'string', optional: true },
        taskType: { type: 'string', optional: true },
        description: { type: 'string', optional: true },
        building: { type: 'string', optional: true },
        systemName: { type: 'string', optional: true },
        breakMinutes: { type: 'number', optional: true },
        punchlistIds: { type: 'array', items: 'string', optional: true },
      },
    });
    this.registerAction('submit', this.submit, {
      params: {
        groupId: 'string',
        entryId: 'string',
      },
    });
    this.registerAction('decide', this.decide, {
      params: {
        groupId: 'string',
        entryId: 'string',
        decision: { type: 'enum', values: ['approved', 'rejected'] },
        note: { type: 'string', optional: true },
      },
    });
    this.registerAction('reopen', this.reopen, {
      params: {
        groupId: 'string',
        entryId: 'string',
        note: { type: 'string', optional: true },
      },
    });
    this.registerAction('remove', this.remove, {
      params: {
        groupId: 'string',
        entryId: 'string',
      },
    });
  }

  private async list(
    ctx: TcContext<{
      groupId: string;
      userId?: string;
      from?: string;
      to?: string;
      status?: string;
    }>
  ) {
    const { groupId, userId, from, to, status } = ctx.params;
    await assertMember(ctx, groupId);

    const query: Record<string, any> = {
      groupId,
      deletedAt: { $exists: false },
    };
    if (userId) {
      query.userId = userId;
    }
    if (status) {
      query.status = status;
    }
    if (from || to) {
      query.workDate = {};
      if (from) {
        query.workDate.$gte = new Date(from);
      }
      if (to) {
        query.workDate.$lte = new Date(to);
      }
    }

    const docs = await this.adapter.model
      .find(query)
      .sort({ workDate: 'desc', seq: 'desc' })
      .exec();

    return await this.transformDocuments(ctx, {}, docs);
  }

  private async add(ctx: TcContext<Record<string, any>>) {
    const { groupId, workDate, startAt, endAt, ...rest } = ctx.params;
    await assertMember(ctx, groupId);

    const doc = await this.adapter.model.create({
      ...rest,
      groupId,
      seq: await nextSeq(groupId, 'timesheet'),
      userId: ctx.meta.userId,
      workDate: new Date(workDate),
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      status: 'draft',
    });

    const json = await this.transformDocuments(ctx, {}, doc);
    await this.roomcastNotify(ctx, groupId, 'timesheet.add', json);

    return json;
  }

  private async update(ctx: TcContext<Record<string, any>>) {
    const { groupId, entryId, ...rest } = ctx.params;
    await assertMember(ctx, groupId);

    const entry = await this.findEntry(groupId, entryId);
    this.assertOwner(ctx, entry);
    this.assertUnlocked(entry);

    const changes: Record<string, [unknown, unknown]> = {};
    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      const before = (entry as Record<string, any>)[key];
      if (before !== value) {
        changes[key] = [before, value];
      }
      (entry as Record<string, any>)[key] = value;
    });

    if (Object.keys(changes).length > 0) {
      entry.revisions.push({
        by: ctx.meta.userId,
        at: new Date(),
        changes,
      } as any);
    }

    await entry.save();

    const json = await this.transformDocuments(ctx, {}, entry);
    await this.roomcastNotify(ctx, groupId, 'timesheet.update', json);

    return json;
  }

  /**
   * Hand the entry to the chain.
   *
   * With no chain configured this approves and locks immediately — see
   * onSubmit. Only the owner may submit their own hours.
   */
  private async submit(ctx: TcContext<{ groupId: string; entryId: string }>) {
    const { groupId, entryId } = ctx.params;
    await assertMember(ctx, groupId);

    const entry = await this.findEntry(groupId, entryId);
    this.assertOwner(ctx, entry);
    this.assertUnlocked(entry);

    const chain = await getTimesheetChain(groupId);
    const now = new Date();
    const outcome = onSubmit(chain, now);

    entry.status = outcome.status;
    entry.currentStageIndex = outcome.currentStageIndex;
    entry.lockedAt = outcome.lockedAt ?? undefined;
    entry.submittedAt = now;
    if (outcome.status === 'approved') {
      // Nobody decided it, so there is no approver to record.
      entry.approvedAt = now;
    }

    await entry.save();

    const json = await this.transformDocuments(ctx, {}, entry);
    await this.roomcastNotify(ctx, groupId, 'timesheet.update', json);

    return json;
  }

  /** Approve or reject at the current stage. */
  private async decide(
    ctx: TcContext<{
      groupId: string;
      entryId: string;
      decision: 'approved' | 'rejected';
      note?: string;
    }>
  ) {
    const { groupId, entryId, decision, note } = ctx.params;
    await assertMember(ctx, groupId);

    const entry = await this.findEntry(groupId, entryId);
    if (entry.status !== 'submitted') {
      throw new Error('Only a submitted entry can be decided');
    }

    const chain = await getTimesheetChain(groupId);
    const stage = chain[entry.currentStageIndex];
    const roles = await getMemberRoles(ctx, groupId);

    // A panel manager can always unblock a stuck stage; otherwise the stage
    // itself says who may decide it.
    if (
      !canDecide(stage, ctx.meta.userId, roles) &&
      !(await hasManagePanel(ctx, groupId))
    ) {
      throw new NoPermissionError('Not an approver for this stage');
    }

    const now = new Date();
    const outcome = onDecision(chain, entry.currentStageIndex, decision, now);

    entry.approvals.push({
      stageId: stage?.id ?? '',
      // Copied, not referenced: renaming a stage must not rewrite history.
      stageName: stage?.name ?? 'Approval',
      decision,
      by: ctx.meta.userId,
      at: now,
      note,
    } as any);

    entry.status = outcome.status;
    entry.currentStageIndex = outcome.currentStageIndex;
    entry.lockedAt = outcome.lockedAt ?? undefined;

    if (decision === 'rejected') {
      entry.rejectionNote = note;
    }
    if (outcome.status === 'approved') {
      entry.approvedBy = ctx.meta.userId;
      entry.approvedAt = now;
    }

    await entry.save();

    const json = await this.transformDocuments(ctx, {}, entry);
    await this.roomcastNotify(ctx, groupId, 'timesheet.update', json);

    return json;
  }

  /**
   * Unlock an approved entry so it can be corrected.
   *
   * Needs managePanel and always records a revision: an approved entry has
   * already been reported, so reopening one has to leave a trace.
   */
  private async reopen(
    ctx: TcContext<{ groupId: string; entryId: string; note?: string }>
  ) {
    const { groupId, entryId, note } = ctx.params;
    await assertMember(ctx, groupId);

    if (!(await hasManagePanel(ctx, groupId))) {
      throw new NoPermissionError(
        'Reopening an approved entry requires panel management'
      );
    }

    const entry = await this.findEntry(groupId, entryId);

    entry.revisions.push({
      by: ctx.meta.userId,
      at: new Date(),
      changes: { status: [entry.status, 'draft'] },
      note,
    } as any);

    entry.status = 'draft';
    entry.currentStageIndex = 0;
    entry.lockedAt = undefined;
    entry.approvedBy = undefined;
    entry.approvedAt = undefined;

    await entry.save();

    const json = await this.transformDocuments(ctx, {}, entry);
    await this.roomcastNotify(ctx, groupId, 'timesheet.update', json);

    return json;
  }

  private async remove(ctx: TcContext<{ groupId: string; entryId: string }>) {
    const { groupId, entryId } = ctx.params;
    await assertMember(ctx, groupId);

    const entry = await this.findEntry(groupId, entryId);
    this.assertOwner(ctx, entry);
    this.assertUnlocked(entry);

    entry.deletedAt = new Date();
    await entry.save();

    await this.roomcastNotify(ctx, groupId, 'timesheet.remove', {
      _id: String(entry._id),
    });

    return true;
  }

  private async findEntry(groupId: string, entryId: string) {
    const entry = await this.adapter.model.findOne({
      _id: entryId,
      groupId,
      deletedAt: { $exists: false },
    });

    if (!entry) {
      throw new Error('Timesheet entry not found');
    }

    return entry;
  }

  /** Hours belong to the person who worked them; nobody else edits them. */
  private assertOwner(ctx: TcContext, entry: TimesheetEntryDocument) {
    if (String(entry.userId) !== String(ctx.meta.userId)) {
      throw new NoPermissionError('Only the owner can change their own hours');
    }
  }

  private assertUnlocked(entry: TimesheetEntryDocument) {
    if (entry.lockedAt) {
      throw new Error('This entry is approved and locked; reopen it first');
    }
  }
}

export default TimesheetService;
