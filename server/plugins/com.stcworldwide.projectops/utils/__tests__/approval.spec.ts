import {
  canDecide,
  onDecision,
  onSubmit,
  type ApprovalStageLike,
} from '../approval';

const NOW = new Date('2026-09-04T03:00:00.000Z');

const stage = (
  name: string,
  roleIds: string[] = [],
  userIds: string[] = []
): ApprovalStageLike => ({ id: name.toLowerCase(), name, roleIds, userIds });

describe('onSubmit', () => {
  test('with no chain configured, submitting finalises the entry', () => {
    // The whole point of the chain being optional: with nobody to wait for,
    // waiting forever is the wrong default.
    expect(onSubmit([], NOW)).toEqual({
      status: 'approved',
      currentStageIndex: 0,
      lockedAt: NOW,
    });
  });

  test('with a chain, submitting parks the entry at the first stage', () => {
    expect(onSubmit([stage('Foreman'), stage('PM')], NOW)).toEqual({
      status: 'submitted',
      currentStageIndex: 0,
      lockedAt: null,
    });
  });
});

describe('onDecision', () => {
  const chain = [stage('Foreman'), stage('PM')];

  test('approving a middle stage advances to the next one', () => {
    expect(onDecision(chain, 0, 'approved', NOW)).toEqual({
      status: 'submitted',
      currentStageIndex: 1,
      lockedAt: null,
    });
  });

  test('approving the last stage approves and locks', () => {
    expect(onDecision(chain, 1, 'approved', NOW)).toEqual({
      status: 'approved',
      currentStageIndex: 1,
      lockedAt: NOW,
    });
  });

  test('a single-stage chain locks on the first approval', () => {
    expect(onDecision([stage('Foreman')], 0, 'approved', NOW)).toEqual({
      status: 'approved',
      currentStageIndex: 0,
      lockedAt: NOW,
    });
  });

  test('rejecting at any stage sends it back, unlocked', () => {
    expect(onDecision(chain, 1, 'rejected', NOW)).toEqual({
      status: 'rejected',
      currentStageIndex: 0,
      lockedAt: null,
    });
  });

  test('a stage index past the end of the chain still resolves to approved', () => {
    // Defensive: the chain can be shortened after an entry was submitted.
    expect(onDecision(chain, 5, 'approved', NOW)).toEqual({
      status: 'approved',
      currentStageIndex: 5,
      lockedAt: NOW,
    });
  });
});

describe('canDecide', () => {
  const byRole = stage('Foreman', ['role-foreman']);
  const byUser = stage('PM', [], ['user-tim']);

  test('a named user may decide', () => {
    expect(canDecide(byUser, 'user-tim', [])).toBe(true);
  });

  test('a member of a named role may decide', () => {
    expect(canDecide(byRole, 'user-anyone', ['role-foreman'])).toBe(true);
  });

  test('everyone else may not', () => {
    expect(canDecide(byRole, 'user-anyone', ['role-tech'])).toBe(false);
    expect(canDecide(byUser, 'user-someone', [])).toBe(false);
  });

  test('a stage naming nobody is open to any group member', () => {
    // An empty stage is a configuration people will actually create, and
    // refusing everyone would strand every entry behind it.
    expect(canDecide(stage('Anyone'), 'user-anyone', [])).toBe(true);
  });

  test('a missing stage refuses rather than throwing', () => {
    expect(canDecide(undefined, 'user-tim', [])).toBe(false);
  });
});
