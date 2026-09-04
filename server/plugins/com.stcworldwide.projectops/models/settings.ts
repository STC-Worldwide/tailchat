import { db } from 'tailchat-server-sdk';
import { nanoid } from 'nanoid';
import type { Types } from 'mongoose';

const { getModelForClass, prop, modelOptions, Severity, TimeStamps } = db;

/**
 * One stage of an approval chain.
 *
 * Approvers are named by role or by user. Roles are the normal case (whoever
 * is foreman this month), user ids are the escape hatch for a small crew that
 * has not bothered to set roles up.
 */
export class ApprovalStage {
  @prop({ default: () => nanoid(8) })
  id: string;

  /** Shown in the UI and copied into ApprovalRecord: 'Foreman', 'PM' */
  @prop()
  name: string;

  @prop({ type: () => String, default: [] })
  roleIds: string[];

  @prop({ type: () => String, default: [] })
  userIds: string[];
}

/**
 * Per-group configuration for the project-ops panels.
 *
 * The approval chain is OPTIONAL and ordered. An empty array means approval is
 * switched off for that group: submitting an entry finalises it immediately,
 * because there is nobody to wait for. One stage is the common case; more than
 * one covers foreman-then-PM without needing a second model.
 */
@modelOptions({
  options: {
    customName: 'p_projectops_settings',
    // `meta` and revision `changes` are deliberately free-form;
    // without this typegoose warns on every model build.
    allowMixed: Severity.ALLOW,
  },
})
export class ProjectOpsSettings extends TimeStamps implements db.Base {
  _id: Types.ObjectId;
  id: string;

  @prop({ index: true, unique: true })
  groupId: string;

  /** Empty = no approval required. Order is the order approvals happen in. */
  @prop({ type: () => ApprovalStage, default: [] })
  timesheetApproval: ApprovalStage[];

  /** Free text for now — no cost-code collection until there is a real list. */
  @prop({ type: () => String, default: [] })
  costCodeSuggestions: string[];

  /** Prefix for human-readable refs: '861' gives 861-PL-014. */
  @prop()
  refPrefix?: string;

  @prop({ type: () => Object })
  meta?: object;
}

export type ProjectOpsSettingsDocument = db.DocumentType<ProjectOpsSettings>;

const settingsModel = getModelForClass(ProjectOpsSettings);
export type ProjectOpsSettingsModel = typeof settingsModel;
export default settingsModel;
