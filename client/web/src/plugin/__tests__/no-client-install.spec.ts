import fs from 'fs';
import path from 'path';

/**
 * Guard: nothing in the browser may install a plugin.
 *
 * What loads is the server's decision. Three doors used to exist — the plugin
 * store's install button, a paste-a-manifest tab, and
 * `window.tailchat.installPlugin`, which was reachable from the console
 * regardless of `DISABLE_PLUGIN_STORE` and so made that flag cosmetic.
 *
 * This is a source-text check because the real assertion is about absence: an
 * import-based test passes just as happily when someone adds a second install
 * path somewhere else.
 */
const pluginRoot = path.resolve(__dirname, '..');

/**
 * Comments are stripped before scanning. The files that removed these entry
 * points explain in prose what they removed, and a guard that fails on its own
 * subject's name is a guard nobody keeps.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : walk(full);
    }

    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe('the client cannot install plugins', () => {
  const files = walk(pluginRoot);

  test('finds the plugin sources', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test('no install or uninstall entry point exists', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = stripComments(fs.readFileSync(file, 'utf-8'));

      for (const banned of [
        'installPlugin',
        'uninstallPlugin',
        'loadSinglePlugin',
      ]) {
        if (source.includes(banned)) {
          offenders.push(`${path.relative(pluginRoot, file)}: ${banned}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  test('installs are not read back out of browser storage', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = stripComments(fs.readFileSync(file, 'utf-8'));

      if (source.includes('$TailchatInstalledPlugins')) {
        offenders.push(path.relative(pluginRoot, file));
      }
    }

    expect(offenders).toEqual([]);
  });
});
