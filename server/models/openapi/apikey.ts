import {
  getModelForClass,
  prop,
  DocumentType,
  index,
  Ref,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import type { Types } from 'mongoose';
import { User } from '../user/user';

/**
 * API key of an OpenApp.
 *
 * Only the SHA-256 of the secret half is stored. The plaintext key is shown
 * once, when it is created. See packages/sdk/src/services/lib/apikey.ts for
 * the format and the scope catalog.
 */
@index({ keyId: 1 }, { unique: true })
@index({ appId: 1 })
export class OpenAppApiKey extends TimeStamps implements Base {
  _id: Types.ObjectId;
  id: string;

  @prop()
  appId: string;

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

  @prop({
    ref: () => User,
  })
  createdBy: Ref<User>;

  @prop()
  expiresAt?: Date;

  @prop()
  lastUsedAt?: Date;

  @prop()
  revokedAt?: Date;
}

export type OpenAppApiKeyDocument = DocumentType<OpenAppApiKey>;

const model = getModelForClass(OpenAppApiKey);

export type OpenAppApiKeyModel = typeof model;

export default model;
