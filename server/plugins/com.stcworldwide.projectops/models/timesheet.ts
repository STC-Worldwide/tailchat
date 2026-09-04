import { db } from 'tailchat-server-sdk';
import type { Types } from 'mongoose';
import { ApprovalRecord, Attachment, Revision } from './shared';

const { getModelForClass, prop, modelOptions, Severity, index } = db;

/**
 * One person's hours, for one day, on one project.
 *
 * Every group member can read everyone's entries (Tim, 2026-09-04), so there
 * is no per-user filtering in the read path — only writes are restricted to
 * the owner and approvers.
 *
 * Approval is optional and configured per group in ProjectOpsSettings. With
 * no stages configured, submitting finalises the entry immediately; with one
 * or more, it walks them in order. Either way `approved` means the same
 * thing — final and locked — so payroll never has to ask which mode a group
 * was in.
 */
@index({ groupId: 1, workDate: -1 })
@index({ groupId: 1, userId: 1, workDate: -1 })
@index({ groupId: 1, status: 1 })
@modelOptions({
  options: {
    customName: 'p_timesheet',
    // `meta` and revision `changes` are deliberately free-form;
    // without this typegoose warns on every model build.
    allowMixed: Severity.ALLOW,
  },
})
export class TimesheetEntry extends db.TimeStamps implements db.Base {
  _id: Types.ObjectId;
  id: string;

  @prop({ index: true })
  groupId: string;

  @prop()
  seq: number;

  @prop()
  userId: string;

  /** The day worked, at local midnight. Not the moment of entry. */
  @prop()
  workDate: Date;

  /**
   * Authoritative. start/end are a convenience for people who work that way.
   *
   * Deriving hours from start/end was rejected: techs reconstruct a day from
   * memory more often than they clock in and out, and a model that demands
   * timestamps gets invented ones.
   */
  @prop()
  hours: number;

  @prop()
  startAt?: Date;

  @prop()
  endAt?: Date;

  @prop({ default: 0 })
  breakMinutes: number;

  /** regular | overtime | doubleTime | travel | standby */
  @prop({ default: 'regular' })
  hourType: string;

  /**
   * Building / area the hours were booked to: 'NOX' | 'UTL' | 'MSGR' | 'CCAC'
   * | 'MCAC' | 'PCAC'. Free text rather than an enum because the area list is
   * per project, and 861's is not every project's.
   */
  @prop()
  area?: string;

  /**
   * 'Commissioning' | 'Checkout' | 'Software' | 'Supervision' | 'Rework'.
   *
   * These are the columns of the Subcontractor Daily Report this project
   * already publishes (report 20-861-B2), not an invented cost-code scheme —
   * which is what lets the weekly rollup be computed instead of typed.
   */
  @prop()
  taskType?: string;

  @prop()
  description?: string;

  // --- what was worked on ---

  @prop()
  building?: string;

  @prop()
  systemName?: string;

  /**
   * Punch items worked on. This is what turns three lists into one tool:
   * with it you can cost a deficiency in both hours and parts.
   */
  @prop({ type: () => String, default: [] })
  punchlistIds: string[];

  // --- approval ---

  /** draft | submitted | approved | rejected */
  @prop({ default: 'draft' })
  status: string;

  @prop()
  submittedAt?: Date;

  /**
   * Which stage of the chain is pending, while status is 'submitted'.
   * Meaningless in any other status, and always 0 when no chain is set.
   */
  @prop({ default: 0 })
  currentStageIndex: number;

  /** Append-only: every decision at every stage, including rejections. */
  @prop({ type: () => ApprovalRecord, default: [] })
  approvals: ApprovalRecord[];

  /**
   * Who and when for the final approval. With no chain configured nobody
   * decided it, so `approvedAt` is set and `approvedBy` deliberately is not.
   */
  @prop()
  approvedBy?: string;

  @prop()
  approvedAt?: Date;

  /** Why it came back. Kept alongside the full record in `approvals`. */
  @prop()
  rejectionNote?: string;

  /**
   * Set when the entry reaches `approved`. Writes must fail while it is set
   * rather than silently overwriting — this data reaches payroll and client
   * invoices, and a quiet post-approval edit is the expensive failure.
   * Reopening clears it and appends a Revision.
   */
  @prop()
  lockedAt?: Date;

  @prop({ type: () => Revision, default: [] })
  revisions: Revision[];

  @prop({ type: () => Attachment, default: [] })
  attachments: Attachment[];

  @prop()
  deletedAt?: Date;

  @prop({ type: () => Object })
  meta?: object;
}

export type TimesheetEntryDocument = db.DocumentType<TimesheetEntry>;

const timesheetModel = getModelForClass(TimesheetEntry);
export type TimesheetEntryModel = typeof timesheetModel;
export default timesheetModel;
