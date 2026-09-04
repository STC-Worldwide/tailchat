import { db } from 'tailchat-server-sdk';
import type { Types } from 'mongoose';

const { getModelForClass, prop, modelOptions, index } = db;

/**
 * Per-group sequence numbers.
 *
 * People in the field say "punch item 14", never a 24-character ObjectId, so
 * every record carries a short number. Mongo has no sequences, so this is the
 * usual counter document, bumped with a single atomic findOneAndUpdate($inc)
 * so two people creating an item at once cannot collide.
 *
 * `name` is the record kind: 'punchlist' | 'timesheet' | 'part'.
 */
@index({ groupId: 1, name: 1 }, { unique: true })
@modelOptions({
  options: {
    customName: 'p_projectops_counters',
  },
})
export class ProjectOpsCounter implements db.Base {
  _id: Types.ObjectId;
  id: string;

  @prop()
  groupId: string;

  @prop()
  name: string;

  @prop({ default: 0 })
  value: number;
}

export type ProjectOpsCounterDocument = db.DocumentType<ProjectOpsCounter>;

const counterModel = getModelForClass(ProjectOpsCounter);
export type ProjectOpsCounterModel = typeof counterModel;
export default counterModel;
