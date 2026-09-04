import { app } from 'electron';

export function generateInjectedScript(): string {
  return [generateDeviceInfo()].join(';');
}

function getPlatform() {
  if (process.platform === 'darwin') {
    return 'mac';
  } else if (process.platform === 'win32') {
    return 'windows';
  } else if (process.platform === 'linux') {
    return 'linux';
  } else {
    return process.platform;
  }
}

function generateDeviceInfo() {
  return `window.__electronDeviceInfo = { version: "${app.getVersion()}", name: "${app.getName()}", platform: "${getPlatform()}" }`;
}
