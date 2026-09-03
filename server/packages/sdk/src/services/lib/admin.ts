import { SYSTEM_USERID } from '../../const';
import { config } from './settings';

/**
 * Whether a user id is a server administrator: the admin panel's system
 * identity, or an id listed in ADMIN_USER_IDS.
 */
export function isServerAdmin(userId: unknown): boolean {
  if (typeof userId !== 'string' || userId.length === 0) {
    return false;
  }

  return userId === SYSTEM_USERID || config.adminUserIds.includes(userId);
}
