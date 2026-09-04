import { createTestServiceBroker } from '../../../test/utils';
import TimesheetService from '../services/timesheet.service';
import { SETTING_KEYS } from '../utils/settings';
import { Types } from 'mongoose';

/**
 * The approval chain end to end, against a real database.
 *
 * The pure transition rules are covered in utils/__tests__/approval.spec.ts;
 * what this suite is for is the parts that only break once persistence and
 * permissions are involved — locking, ownership, and the chain being read
 * from group settings rather than assumed.
 */
describe('Test "plugin:com.stcworldwide.projectops.timesheet" service', () => {
  const groupId = String(new Types.ObjectId());
  const owner = String(new Types.ObjectId());
  const other = String(new Types.ObjectId());

  // Every group call the service makes: membership, permissions, roles, and
  // now the approval chain, which lives in the group's own config.
  let managePanel = false;
  let chain: { id: string; name: string }[] = [];
  const { broker, service } = createTestServiceBroker<TimesheetService>(
    TimesheetService,
    {
      contextCallMockFn: (actionName: string) => {
        if (actionName === 'group.isMember') {
          return true;
        }
        if (actionName === 'group.getPermissions') {
          return managePanel ? ['core.managePanel'] : [];
        }
        if (actionName === 'group.getGroupInfo') {
          return {
            members: [{ userId: owner, roles: [] }],
            config: { [SETTING_KEYS.timesheetApproval]: chain },
          };
        }
        return undefined;
      },
    }
  );

  const meta = (userId: string) => ({ meta: { userId } });

  const addEntry = (userId = owner, hours = 8) =>
    broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.add',
      {
        groupId,
        workDate: '2026-09-03',
        hours,
        area: 'NOX',
        taskType: 'Checkout',
      },
      meta(userId)
    ) as Promise<any>;

  const setChain = (stages: { id: string; name: string }[]) => {
    chain = stages;
  };

  // Cleanup lives here rather than in afterAll: createTestServiceBroker
  // registers its own afterAll first, which closes the mongoose connection,
  // so anything we try to delete afterwards fails with MongoNotConnectedError.
  beforeEach(async () => {
    managePanel = false;
    chain = [];
    await service.adapter.model.deleteMany({ groupId });
  });

  test('a new entry starts as a draft owned by the caller', async () => {
    const entry = await addEntry();

    expect(entry.status).toBe('draft');
    expect(String(entry.userId)).toBe(owner);
    expect(entry.hours).toBe(8);
    expect(entry.area).toBe('NOX');
    expect(entry.lockedAt).toBeUndefined();
  });

  test('with no chain configured, submitting approves and locks at once', async () => {
    const entry = await addEntry();

    const submitted: any = await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.submit',
      { groupId, entryId: String(entry._id) },
      meta(owner)
    );

    expect(submitted.status).toBe('approved');
    expect(submitted.lockedAt).toBeTruthy();
    // Nobody decided it, so there is no approver to name.
    expect(submitted.approvedBy).toBeUndefined();
    expect(submitted.approvedAt).toBeTruthy();
  });

  test('a locked entry refuses edits until it is reopened', async () => {
    const entry = await addEntry();
    await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.submit',
      { groupId, entryId: String(entry._id) },
      meta(owner)
    );

    await expect(
      broker.call(
        'plugin:com.stcworldwide.projectops.timesheet.update',
        { groupId, entryId: String(entry._id), hours: 12 },
        meta(owner)
      )
    ).rejects.toThrow(/locked/);

    managePanel = true;
    const reopened: any = await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.reopen',
      { groupId, entryId: String(entry._id), note: 'wrong day' },
      meta(other)
    );

    expect(reopened.status).toBe('draft');
    expect(reopened.lockedAt).toBeUndefined();
    // Reopening an already-reported entry has to leave a trace.
    expect(reopened.revisions).toHaveLength(1);
    expect(reopened.revisions[0].note).toBe('wrong day');
  });

  test('a two-stage chain walks both stages before locking', async () => {
    await setChain([
      { id: 'foreman', name: 'Foreman' },
      { id: 'pm', name: 'PM' },
    ]);

    const entry = await addEntry();
    const submitted: any = await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.submit',
      { groupId, entryId: String(entry._id) },
      meta(owner)
    );

    expect(submitted.status).toBe('submitted');
    expect(submitted.currentStageIndex).toBe(0);
    expect(submitted.lockedAt).toBeUndefined();

    const first: any = await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.decide',
      { groupId, entryId: String(entry._id), decision: 'approved' },
      meta(other)
    );

    expect(first.status).toBe('submitted');
    expect(first.currentStageIndex).toBe(1);
    expect(first.lockedAt).toBeUndefined();

    const second: any = await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.decide',
      { groupId, entryId: String(entry._id), decision: 'approved' },
      meta(other)
    );

    expect(second.status).toBe('approved');
    expect(second.lockedAt).toBeTruthy();
    expect(second.approvals).toHaveLength(2);
    // Stage names are copied so renaming a stage cannot rewrite history.
    expect(second.approvals.map((a: any) => a.stageName)).toEqual([
      'Foreman',
      'PM',
    ]);
  });

  test('rejecting returns the entry to its owner, unlocked', async () => {
    await setChain([{ id: 'foreman', name: 'Foreman' }]);

    const entry = await addEntry();
    await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.submit',
      { groupId, entryId: String(entry._id) },
      meta(owner)
    );

    const rejected: any = await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.decide',
      {
        groupId,
        entryId: String(entry._id),
        decision: 'rejected',
        note: 'split the after-hours window',
      },
      meta(other)
    );

    expect(rejected.status).toBe('rejected');
    expect(rejected.lockedAt).toBeUndefined();
    expect(rejected.rejectionNote).toBe('split the after-hours window');

    // and it is editable again
    const edited: any = await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.update',
      { groupId, entryId: String(entry._id), hours: 4 },
      meta(owner)
    );
    expect(edited.hours).toBe(4);
  });

  test('hours belong to the person who worked them', async () => {
    const entry = await addEntry();

    await expect(
      broker.call(
        'plugin:com.stcworldwide.projectops.timesheet.update',
        { groupId, entryId: String(entry._id), hours: 99 },
        meta(other)
      )
    ).rejects.toThrow();
  });

  test('an edit records what changed', async () => {
    const entry = await addEntry();

    const edited: any = await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.update',
      { groupId, entryId: String(entry._id), hours: 6.5 },
      meta(owner)
    );

    expect(edited.revisions).toHaveLength(1);
    expect(edited.revisions[0].changes.hours).toEqual([8, 6.5]);
  });

  test('every member sees everyone hours, not just their own', async () => {
    await addEntry(owner, 8);
    await addEntry(other, 5);

    const list: any = await broker.call(
      'plugin:com.stcworldwide.projectops.timesheet.list',
      { groupId },
      meta(owner)
    );

    const userIds = list.map((e: any) => String(e.userId));
    expect(userIds).toContain(owner);
    expect(userIds).toContain(other);
  });
});
