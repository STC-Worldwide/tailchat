import log from 'electron-log';
import { startScreenshots } from '../screenshots';
import { BrowserWindow } from 'electron';

export function handleTailchatMessage(
  type: string,
  payload: any,
  webview: Electron.WebContents,
  win: BrowserWindow
) {
  log.info('onMessage receive:', type, payload);

  // 'init' used to trigger a window.tailchat.installPlugin() call for the
  // Electron environment plugin. That plugin is built into the web client for
  // Electron now, so there is nothing to inject.
  if (type === 'init') {
    return;
  }

  if (type === 'callScreenshotsTool') {
    startScreenshots();
    return;
  }

  if (type === 'receiveUnmutedMessage') {
    if (!win.isFocused()) {
      win.flashFrame(true);
    }
    return;
  }
}
