import {
  getModelForClass,
  prop,
  DocumentType,
  index,
  Ref,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import type { Types } from 'mongoose';
import { User } from './user';

/**
 * A personal access token.
 *
 * The key belongs to a user and authenticates AS that user, so it inherits
 * their groups and permissions and needs no bot account and no membership
 * setup. Scopes narrow it down from there.
 *
 * Only the SHA-256 of the secret half is stored. The plaintext is shown once,
 * when the key is created. See packages/sdk/src/services/lib/apikey.ts for
 * the format and the scope catalog.
 */
@index({ keyId: 1 }, { unique: true })
@index({ userId: 1 })
export class UserApiKey extends TimeStamps implements Base {
  _id: Types.ObjectId;
  id: string;

  /**
   * The user this key acts as, and whose permissions bound it.
   */
  @prop({
    ref: () => User,
  })
  userId: Ref<User>;

  /**
   * Public half of the key, embedded in the key string for lookup.
   */
  @prop()
  keyId: string;

  /**
   * sha256 hex of the secret half.
   */
  @prop()
  secretHash: string;

  /**
   * Human label, e.g. "ops agent".
   */
  @prop()
  name: string;

  @prop({
    type: () => String,
  })
  scopes: string[];

  @prop()
  expiresAt?: Date;

  @prop()
  lastUsedAt?: Date;

  @prop()
  revokedAt?: Date;
}

export type UserApiKeyDocument = DocumentType<UserApiKey>;

const model = getModelForClass(UserApiKey);

export type UserApiKeyModel = typeof model;

export default model;
