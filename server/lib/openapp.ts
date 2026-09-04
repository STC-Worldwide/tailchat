import { config, isServerAdmin } from 'tailchat-server-sdk';

/**
 * May this user mint an open app?
 *
 * Creating one hands out bot and OAuth credentials, and upstream lets any
 * authenticated user do it. `DISABLE_OPEN_APP_CREATE` moves that to the admin,
 * for deployments where members are clients of the server and nothing more.
 *
 * The flag is off by default, so upstream's self-service behaviour is what a
 * deployment gets until it says otherwise.
 */
export function canCreateOpenApp(userId: unknown): boolean {
  if (!config.feature.disableOpenAppCreate) {
    return true;
  }

  return isServerAdmin(userId);
}
