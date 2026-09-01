import React from 'react';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { BarChart, Button, Card, LineChart } from './components';

test('renders shared primitives with local Shadcn components', () => {
  const button = renderToStaticMarkup(<Button>Save</Button>);
  assert.match(button, /data-slot="button"/);
  assert.match(button, /button-secondary/);
  assert.match(renderToStaticMarkup(<Card>Content</Card>), /class="card\s*"/);
  assert.doesNotMatch(button, /arco-/);
});

test('renders line and bar charts with Recharts', () => {
  const data = [
    { label: 'Monday', value: 3 },
    { label: 'Tuesday', value: 7 },
  ];

  for (const Chart of [LineChart, BarChart]) {
    assert.match(
      renderToStaticMarkup(<Chart data={data} />),
      /recharts-responsive-container/
    );
  }
});

test('styles Shadcn controls and data tables', () => {
  const styles = readFileSync(`${__dirname}/styles.css`, 'utf8');

  assert.match(styles, /@import "tailwindcss"/);
  assert.match(styles, /\.admin-table \[data-slot="table"\]/);
  assert.match(styles, /\.pagination-controls/);
  assert.doesNotMatch(styles, /\.arco-/);
});

test('maps Shadcn semantic tokens to the admin palette', () => {
  const styles = readFileSync(`${__dirname}/styles.css`, 'utf8');

  assert.match(styles, /--color-background:\s*var\(--background\)/);
  assert.match(styles, /--color-primary:\s*var\(--primary\)/);
  assert.match(styles, /--color-control-border:\s*var\(--control-border\)/);
});

test('uses Shadcn-backed controls for forms, tables, and confirmations', () => {
  const app = readFileSync(`${__dirname}/App.tsx`, 'utf8');
  const pages = readFileSync(`${__dirname}/pages.tsx`, 'utf8');
  const resources = readFileSync(`${__dirname}/resources.tsx`, 'utf8');
  const adminControls = readFileSync(
    `${__dirname}/components/ui/admin.tsx`,
    'utf8'
  );

  assert.match(app, /components\/ui\/input/);
  assert.match(pages, /<Radio\.Group/);
  assert.match(pages, /<Upload/);
  assert.match(resources, /<Table/);
  assert.match(resources, /<Pagination/);
  assert.match(resources, /<Popconfirm/);
  assert.match(adminControls, /from '\.\/dialog'/);
  assert.match(adminControls, /from '\.\/table'/);
  assert.match(adminControls, /from '\.\/dropdown-menu'/);
  assert.match(adminControls, /t\('common\.loading'\)/);
  assert.match(adminControls, /t\('resource\.pageSize'\)/);
  assert.doesNotMatch(adminControls, /> Loading/);
  assert.doesNotMatch(adminControls, /aria-label="(?:Clear|Remove|Rows per page)"/);
  assert.doesNotMatch(`${app}\n${pages}\n${resources}`, /@arco-design/);
  assert.doesNotMatch(`${pages}\n${resources}`, /window\.confirm/);
});

test('keeps inactive navigation neutral and groups user actions in a dropdown', () => {
  const styles = readFileSync(`${__dirname}/styles.css`, 'utf8');
  const resources = readFileSync(`${__dirname}/resources.tsx`, 'utf8');

  assert.match(styles, /\.sidebar \.nav button:not\(\.active\)/);
  assert.match(resources, /<Dropdown/);
  assert.match(resources, /<Menu\.Item key="delete"/);
  assert.match(resources, /icon="more"/);
  assert.match(styles, /grid-template-columns:\s*24px 1fr/);
  assert.match(styles, /column-gap:\s*12px/);
});
