import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { PillTabs, PillTabPane } from '../PillTabs';

describe('PillTabs', () => {
  test('supports the legacy pane API with accessible tab behavior', () => {
    const handleChange = jest.fn();

    render(
      <PillTabs onChange={handleChange}>
        <PillTabPane tab="t1" key="1">
          1
        </PillTabPane>
        <PillTabPane tab="t2" key="2">
          2
        </PillTabPane>
      </PillTabs>
    );

    expect(
      screen.getByRole('tab', { name: 't1' }).getAttribute('aria-selected')
    ).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('1');

    fireEvent.click(screen.getByRole('tab', { name: 't2' }));

    expect(handleChange).toHaveBeenCalledWith('2');
    expect(
      screen.getByRole('tab', { name: 't2' }).getAttribute('aria-selected')
    ).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('2');
  });
});
