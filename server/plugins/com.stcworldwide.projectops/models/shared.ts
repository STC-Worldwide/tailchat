import { db } from 'tailchat-server-sdk';
import { nanoid } from 'nanoid';

const { prop } = db;

/**
 * Sub-documents shared by punchlist items, timesheet entries and part lines.
 *
 * These are embedded rather than referenced on purpose: an attachment or a
 * comment has no life of its own, and a field record that has to join three
 * collections to render one row is a record nobody reads on a phone in a
 * mechanical room.
 */

/** A file in MinIO. `url` is what the panel renders; the rest is for display. */
export class Attachment {
  @prop({ default: () => nanoid(8) })
  id: string;

  @prop()
  url: string;

  @prop()
  name?: string;

  @prop()
  mimeType?: string;

  @prop()
  size?: number;

  @prop()
  uploadedBy: string;

  @prop()
  uploadedAt: Date;
}

/** Same shape as the topic plugin's comment, so the UI can be borrowed. */
export class Comment {
  @prop({ default: () => nanoid(8) })
  id: string;

  @prop()
  content: string;

  @prop()
  author: string;

  @prop()
  createdAt: Date;
}

/**
 * One edit, kept forever.
 *
 * `changes` is {field: [from, to]}. This exists because timesheet hours reach
 * payroll and client invoices: "it always said 6" needs to be answerable a
 * year later, and an overwrite cannot answer it.
 */
export class Revision {
  @prop()
  by: string;

  @prop()
  at: Date;

  @prop({ type: () => Object })
  changes: Record<string, [unknown, unknown]>;

  @prop()
  note?: string;
}

/** One decision at one stage of an approval chain. Append-only. */
export class ApprovalRecord {
  @prop()
  stageId: string;

  /** Copied, not referenced — renaming a stage must not rewrite history. */
  @prop()
  stageName: string;

  /** approved | rejected */
  @prop()
  decision: string;

  @prop()
  by: string;

  @prop()
  at: Date;

  @prop()
  note?: string;
}
