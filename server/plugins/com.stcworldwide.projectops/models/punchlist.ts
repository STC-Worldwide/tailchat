import { db } from 'tailchat-server-sdk';
import type { Types } from 'mongoose';
import { Attachment, Comment } from './shared';

const { getModelForClass, prop, modelOptions, Severity, index } = db;

/**
 * A deficiency found on a project.
 *
 * Scoped to the group rather than to a panel: 861 is a group, and the same
 * items need to be queryable group-wide (a report, the MCP server, a second
 * panel filtered to one system) rather than trapped in whichever panel
 * happened to create them.
 *
 * Location and asset fields are free text on purpose. Field naming drifts —
 * a box is 'N-TB-0118' on the sheet, 'NTB0118' in a message and 'the one
 * above the lobby' out loud — and a model that rejects the third one just
 * moves the deficiency into someone's notebook.
 */
@index({ groupId: 1, status: 1 })
@index({ groupId: 1, deviceName: 1 })
@modelOptions({
  options: {
    customName: 'p_punchlist',
    // `meta` and revision `changes` are deliberately free-form;
    // without this typegoose warns on every model build.
    allowMixed: Severity.ALLOW,
  },
})
export class PunchlistItem extends db.TimeStamps implements db.Base {
  _id: Types.ObjectId;
  id: string;

  @prop({ index: true })
  groupId: string;

  /** Per-group sequence; rendered as 861-PL-014 with the settings prefix. */
  @prop()
  seq: number;

  @prop()
  title: string;

  @prop()
  description?: string;

  /** open | inProgress | readyForReview | closed | wontFix */
  @prop({ default: 'open' })
  status: string;

  /** low | normal | high | blocker — blocker means it stops turnover */
  @prop({ default: 'normal' })
  priority: string;

  /** controls | mechanical | electrical | general — who owns the fix */
  @prop()
  trade?: string;

  // --- where it is ---

  /** 'N' (north tower) | 'M' (mid tower) */
  @prop()
  building?: string;

  /** 'L1'..'L9' | 'SL' */
  @prop()
  level?: string;

  @prop()
  room?: string;

  // --- what it is against ---

  /** 'N-TB-0118' */
  @prop()
  deviceName?: string;

  /** 'N-AHU-01' */
  @prop()
  systemName?: string;

  /** NRIO/terminal panel, 'R2' */
  @prop()
  panel?: string;

  /** BACnet instance number */
  @prop()
  instance?: number;

  /** 'RoomTemperature' */
  @prop()
  pointName?: string;

  // --- people ---

  @prop()
  reporter: string;

  @prop({ type: () => String, default: [] })
  assignee: string[];

  @prop()
  dueDate?: Date;

  // --- closing it out ---

  /**
   * Fixing and verifying are deliberately two steps. On site the person who
   * fixes it is rarely the person who signs it off, and collapsing both into
   * a single `done` flag is what makes a punchlist stop being trusted.
   */
  @prop()
  resolvedBy?: string;

  @prop()
  resolvedAt?: Date;

  @prop()
  resolutionNote?: string;

  @prop()
  verifiedBy?: string;

  @prop()
  verifiedAt?: Date;

  // --- provenance ---

  /** checkout | fieldWalk | client | commissioning */
  @prop()
  source?: string;

  /**
   * Where in the checkout workbook this came from. Free text until the sheet
   * side has a stable address format — the workbook has 5,833 checkpoints and
   * inventing a scheme before reading it would be guessing.
   */
  @prop()
  checkoutRef?: string;

  @prop({ type: () => Attachment, default: [] })
  attachments: Attachment[];

  @prop({ type: () => Comment, default: [] })
  comments: Comment[];

  /** Soft delete: these records may have to be defended a year later. */
  @prop()
  deletedAt?: Date;

  @prop({ type: () => Object })
  meta?: object;
}

export type PunchlistItemDocument = db.DocumentType<PunchlistItem>;

const punchlistModel = getModelForClass(PunchlistItem);
export type PunchlistItemModel = typeof punchlistModel;
export default punchlistModel;
