import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
  modelOptions,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { Converse } from '../chat/converse';
import { User } from './user';
import type { FilterQuery, Types } from 'mongoose';

/**
 * 用户私信列表管理
 */

@modelOptions({
  schemaOptions: {
    collection: 'userdmlist',
  },
})
export class UserDMList implements Base {
  _id: Types.ObjectId;
  id: string;

  @prop({
    ref: () => User,
    index: true,
  })
  userId: Ref<User>;

  @prop({
    ref: () => Converse,
  })
  converseIds: Ref<Converse>[];

  /**
   * typegoose 12 移除了 FindOrCreate / mongoose-findorcreate(已停止维护),
   * 改为原生 static 实现
   */
  static async findOrCreate(
    this: ReturnModelType<typeof UserDMList>,
    condition: FilterQuery<UserDMList>
  ): Promise<{ doc: UserDMListDocument; created: boolean }> {
    const existed = await this.findOne(condition);
    if (existed) {
      return { doc: existed, created: false };
    }
    const doc = await this.create(condition);
    return { doc, created: true };
  }
}

export type UserDMListDocument = DocumentType<UserDMList>;

const model = getModelForClass(UserDMList);

export type UserDMListModel = typeof model;

export default model;
