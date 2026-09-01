import { readFileSync } from 'node:fs';
import path from 'node:path';

const source = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');

describe('OpenAPI modern layout', () => {
  test('uses the shared Shadcn/Tailwind surface without legacy styling', () => {
    const main = source('MainPanel/index.tsx');
    const appInfo = source('MainPanel/AppInfo/index.tsx');
    const profile = source('MainPanel/AppInfo/Profile.tsx');
    const combined = `${main}\n${appInfo}\n${profile}`;

    expect(combined).not.toMatch(/styled-components|\.less['"]/);
    expect(main).toMatch(/rounded-xl border border-border bg-card/);
    expect(main).toMatch(/max-sm:flex-col/);
    expect(main).toMatch(
      /locale=\{\{ emptyText: Translate\.noApplications \}\}/
    );
    expect(appInfo).toMatch(/type: 'link'/);
    expect(appInfo).toMatch(/Translate\.backToApplications/);
    expect(appInfo).toContain('navigationLabel={Translate.openapi}');
    expect(appInfo).toContain('defaultContentPath="0.children.1.content"');
    expect(profile).toMatch(/md:grid-cols-/);
    expect(profile).toMatch(/aria-labelledby="openapi-danger-zone"/);
  });
});
