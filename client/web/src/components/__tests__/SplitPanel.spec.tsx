import { render, screen } from '@testing-library/react';
import React from 'react';
import { SplitPanel } from '../SplitPanel';

const saveSizes = jest.fn();
let layoutChanged:
  | ((
      layout: Record<string, number>,
      meta: { isUserInteraction: boolean }
    ) => void)
  | undefined;

jest.mock('tailchat-shared', () => ({
  t: (value: string) => value,
  useStorage: () => [[72, 28], { save: saveSizes }],
}));

jest.mock('@/components/ui/official/resizable', () => ({
  ResizablePanelGroup: ({
    children,
    defaultLayout,
    onLayoutChanged,
  }: React.PropsWithChildren<{
    defaultLayout: Record<string, number>;
    onLayoutChanged: typeof layoutChanged;
  }>) => {
    layoutChanged = onLayoutChanged;
    return (
      <div data-testid="panel-group" data-layout={JSON.stringify(defaultLayout)}>
        {children}
      </div>
    );
  },
  ResizablePanel: ({
    children,
    id,
  }: React.PropsWithChildren<{ id: string }>) => (
    <section data-testid={`panel-${id}`}>{children}</section>
  ),
  ResizableHandle: ({
    withHandle: _withHandle,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { withHandle?: boolean }) => (
    <div role="separator" {...props} />
  ),
}));

describe('SplitPanel', () => {
  beforeEach(() => {
    saveSizes.mockClear();
    layoutChanged = undefined;
  });

  test('restores the persisted layout and exposes an accessible separator', () => {
    render(
      <SplitPanel>
        <div>Primary</div>
        <div>Pinned</div>
      </SplitPanel>
    );

    expect(screen.getByTestId('panel-group').getAttribute('data-layout')).toBe(
      JSON.stringify({ primary: 72, pinned: 28 })
    );
    expect(screen.getByRole('separator').getAttribute('aria-label')).toBe(
      '调整分栏大小'
    );
  });

  test('persists only user-initiated resize changes', () => {
    render(
      <SplitPanel>
        <div>Primary</div>
        <div>Pinned</div>
      </SplitPanel>
    );

    layoutChanged?.(
      { primary: 60, pinned: 40 },
      { isUserInteraction: false }
    );
    expect(saveSizes).not.toHaveBeenCalled();

    layoutChanged?.(
      { primary: 62, pinned: 38 },
      { isUserInteraction: true }
    );
    expect(saveSizes).toHaveBeenCalledWith([62, 38]);
  });
});
