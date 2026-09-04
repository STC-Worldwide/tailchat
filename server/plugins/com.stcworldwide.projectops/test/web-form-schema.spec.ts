import fs from 'fs';
import path from 'path';

/**
 * Guard against calling a fieldSchema builder that does not exist.
 *
 * `fieldSchema` (react-fastify-form) exposes only `string`, `ref` and `mixed`.
 * A call like `fieldSchema.number()` type-checks — the plugin's `@capital/*`
 * modules are declared as untyped `any` — bundles cleanly, and then throws at
 * module load in the browser, which fails the whole plugin rather than one
 * field. That is exactly how it reached production once.
 *
 * This is a source-text check rather than an import: the panels import
 * `@capital/*`, which only resolves inside the Tailchat web bundle.
 */
const ALLOWED = ['string', 'ref', 'mixed'];

const srcRoot = path.resolve(
  __dirname,
  '../web/plugins/com.stcworldwide.projectops/src'
);

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(full);
    }
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe('web plugin form schemas', () => {
  const files = walk(srcRoot);

  test('finds the panel sources', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test('only use fieldSchema builders that exist', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8');
      const calls = source.match(/fieldSchema\.(\w+)/g) ?? [];

      for (const call of calls) {
        const name = call.split('.')[1];
        if (!ALLOWED.includes(name)) {
          offenders.push(`${path.relative(srcRoot, file)}: ${call}()`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
