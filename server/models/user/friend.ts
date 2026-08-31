import {
  getModelForClass,
  prop,
  DocumentType,
  Ref,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user';
import type { FilterQuery, Types } from 'mongoose';

/**
 * 好友请求
 * 单向好友结构
 */
export class Friend implements Base {
  _id: Types.ObjectId;
  id: string;

  @prop({
    ref: () => User,
    index: true,
  })
  from: Ref<User>;

  @prop({
    ref: () => User,
  })
  to: Ref<User>;

  /**
   * 好友昵称, 覆盖用户自己的昵称
   */
  @prop()
  nickname?: string;

  @prop()
  createdAt: Date;

  /**
   * typegoose 12 移除了 FindOrCreate / mongoose-findorcreate(已停止维护),
   * 改为原生 static 实现
   */
  static async findOrCreate(
    this: ReturnModelType<typeof Friend>,
    condition: FilterQuery<Friend>
  ): Promise<{ doc: FriendDocument; created: boolean }> {
    const existed = await this.findOne(condition);
    if (existed) {
      return { doc: existed, created: false };
    }
    const doc = await this.create(condition);
    return { doc, created: true };
  }

  static async buildFriendRelation(
    this: ReturnModelType<typeof Friend>,
    user1: string,
    user2: string
  ) {
    await Promise.all([
      this.findOrCreate({
        from: user1,
        to: user2,
      }),
      this.findOrCreate({
        from: user2,
        to: user1,
      }),
    ]);
  }
}

export type FriendDocument = DocumentType<Friend>;

const model = getModelForClass(Friend);

export type FriendModel = typeof model;

export default model;
