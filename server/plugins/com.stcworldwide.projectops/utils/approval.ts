/**
 * The optional approval chain, as pure functions.
 *
 * All the interesting rules live here rather than in the service so they can
 * be tested without a broker, a database or a group. The service's job is to
 * load the chain, call these, and persist the answer.
 */

export type ApprovalDecision = 'approved' | 'rejected';

/** The shape we need from a configured stage; the model class satisfies it. */
export interface ApprovalStageLike {
  id: string;
  name: string;
  roleIds?: string[];
  userIds?: string[];
}

export interface ApprovalOutcome {
  /** draft | submitted | approved | rejected */
  status: string;
  currentStageIndex: number;
  /** A date locks the entry; null explicitly clears an existing lock. */
  lockedAt: Date | null;
}

/**
 * What submitting does.
 *
 * With no stages configured there is nobody to wait for, so the entry is
 * final immediately — `approved` means the same thing whether or not a group
 * uses approvals, which is what keeps payroll from having to ask.
 */
export function onSubmit(
  chain: ApprovalStageLike[],
  now: Date
): ApprovalOutcome {
  if (chain.length === 0) {
    return { status: 'approved', currentStageIndex: 0, lockedAt: now };
  }

  return { status: 'submitted', currentStageIndex: 0, lockedAt: null };
}

/**
 * What one decision does.
 *
 * Approving the last stage locks. Rejecting at any stage returns the entry to
 * its owner unlocked and rewinds to the first stage: a rejected entry is
 * edited and resubmitted, not resumed halfway.
 */
export function onDecision(
  chain: ApprovalStageLike[],
  currentStageIndex: number,
  decision: ApprovalDecision,
  now: Date
): ApprovalOutcome {
  if (decision === 'rejected') {
    return { status: 'rejected', currentStageIndex: 0, lockedAt: null };
  }

  const next = currentStageIndex + 1;
  if (next >= chain.length) {
    // Also the path when the chain was shortened after submission.
    return { status: 'approved', currentStageIndex, lockedAt: now };
  }

  return { status: 'submitted', currentStageIndex: next, lockedAt: null };
}

/**
 * May this person decide this stage?
 *
 * A stage that names nobody is open to any group member. That is a real
 * configuration — someone adds a stage and has not picked approvers yet — and
 * refusing everyone would strand every entry behind it.
 */
export function canDecide(
  stage: ApprovalStageLike | undefined,
  userId: string,
  userRoleIds: string[]
): boolean {
  if (!stage) {
    return false;
  }

  const users = stage.userIds ?? [];
  const roles = stage.roleIds ?? [];

  if (users.length === 0 && roles.length === 0) {
    return true;
  }

  return (
    users.includes(userId) || roles.some((role) => userRoleIds.includes(role))
  );
}
