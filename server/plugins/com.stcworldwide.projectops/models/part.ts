import { db } from 'tailchat-server-sdk';
import type { Types } from 'mongoose';
import { Attachment, Comment } from './shared';

const { getModelForClass, prop, modelOptions, Severity, index } = db;

/**
 * A part on a project, from "we need one" through to "it is installed".
 *
 * Procurement and consumption in one record (Tim, 2026-09-04): the question
 * being answered is "did the MPV7A for N-TB-0118 arrive and is it in yet",
 * not "how many are on the shelf". There is deliberately no stock level and
 * no transfer history — van/shop inventory is a different model and would
 * need its own collection if it is ever wanted.
 *
 * One record is one line: a quantity of one part number for one purpose. Ten
 * controllers ordered together are one line; the same controller ordered
 * twice for two devices is two, because each has its own fate.
 */
@index({ groupId: 1, status: 1 })
@index({ groupId: 1, deviceName: 1 })
@modelOptions({
  options: {
    customName: 'p_parts',
    // `meta` and revision `changes` are deliberately free-form;
    // without this typegoose warns on every model build.
    allowMixed: Severity.ALLOW,
  },
})
export class PartLine extends db.TimeStamps implements db.Base {
  _id: Types.ObjectId;
  id: string;

  @prop({ index: true })
  groupId: string;

  /** Per-group sequence; rendered as 861-PT-032 with the settings prefix. */
  @prop()
  seq: number;

  // --- what it is ---

  /** 'Schneider Electric' */
  @prop()
  manufacturer?: string;

  /** 'MPV7A' */
  @prop()
  partNumber?: string;

  @prop()
  description: string;

  @prop({ default: 1 })
  quantity: number;

  @prop({ default: 'ea' })
  unit: string;

  /**
   * needed | quoted | ordered | shipped | received | installed | returned
   *
   * Ordered as a lifecycle, but not enforced as one — parts turn up without
   * ever having been ordered, and a status machine that forbids that is a
   * status machine people work around.
   */
  @prop({ default: 'needed' })
  status: string;

  // --- procurement ---

  @prop()
  supplier?: string;

  @prop()
  poNumber?: string;

  @prop()
  unitCost?: number;

  @prop()
  currency?: string;

  @prop()
  expectedAt?: Date;

  @prop()
  receivedAt?: Date;

  @prop()
  receivedBy?: string;

  // --- consumption ---

  @prop()
  installedAt?: Date;

  @prop()
  installedBy?: string;

  /** 'N-TB-0118' — what it went into */
  @prop()
  deviceName?: string;

  @prop()
  building?: string;

  @prop()
  level?: string;

  /** Matters for warranty claims, which is the whole reason to record it. */
  @prop()
  serialNumber?: string;

  /** The deficiency this part is for. */
  @prop({ type: () => String, default: [] })
  punchlistIds: string[];

  @prop({ type: () => Attachment, default: [] })
  attachments: Attachment[];

  @prop({ type: () => Comment, default: [] })
  comments: Comment[];

  @prop()
  deletedAt?: Date;

  @prop({ type: () => Object })
  meta?: object;
}

export type PartLineDocument = db.DocumentType<PartLine>;

const partModel = getModelForClass(PartLine);
export type PartLineModel = typeof partModel;
export default partModel;
