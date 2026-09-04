import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { CommonPanelWrapper } from '../common/Wrapper';
import { PanelActionButton } from '../common/PanelActionButton';
import { SearchIcon } from 'lucide-react';

let mockIsMobile = false;

jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile,
}));

jest.mock('@/hooks/useAppPortalContainer', () => ({
  useAppPortalContainer: () => document.body,
}));

jest.mock('tailchat-shared', () => ({
  localTrans: (value: Record<string, string>) => value['en-US'],
  t: (key: string) => key,
  createUseStorageState:
    () => (key: string, options?: { defaultValue?: unknown }) => {
      const react = require('react');
      const [state, setState] = react.useState(() => {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : options?.defaultValue;
      });

      return [
        state,
        (value: unknown) => {
          window.localStorage.setItem(key, JSON.stringify(value));
          setState(value);
        },
      ];
    },
}));

const PanelHarness: React.FC<{ withSidePanel?: boolean }> = ({
  withSidePanel = false,
}) => (
  <CommonPanelWrapper
    header="Lobby"
    sidePanel={
      withSidePanel
        ? {
            storageKey: 'panel:membersSidebar',
            name: 'Members',
            panel: <div>Member list</div>,
          }
        : undefined
    }
    actions={({ setRightPanel, sidePanelOpen, toggleSidePanel }) => [
      <PanelActionButton
        key="search"
        label="Search messages"
        icon={<SearchIcon />}
        onClick={() =>
          setRightPanel({
            name: 'Chat history',
            panel: <div>Search results</div>,
          })
        }
      />,
      <PanelActionButton
        key="members"
        label="Member list"
        icon={<SearchIcon />}
        active={sidePanelOpen}
        onClick={toggleSidePanel}
      />,
    ]}
  >
    <div>Conversation</div>
  </CommonPanelWrapper>
);

describe('Shadcn panel shell', () => {
  afterEach(() => {
    mockIsMobile = false;
    window.localStorage.clear();
  });

  test('renders accessible official panel actions and a desktop aside', () => {
    render(<PanelHarness />);

    expect(screen.getByRole('toolbar', { name: 'Panel actions' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Search messages' }));

    expect(screen.getByRole('complementary')).toBeTruthy();
    expect(
      screen.getByRole('toolbar', { name: 'Secondary panel actions' })
    ).toBeTruthy();
    expect(screen.getByText('Search results')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  test('uses an official Sheet for the mobile right panel', async () => {
    mockIsMobile = true;
    render(<PanelHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Search messages' }));

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Search results')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));

    await waitFor(() =>
      expect(screen.queryByText('Search results')).toBeNull()
    );
  });

  describe('persistent side panel', () => {
    test('is open on first load, without anyone clicking anything', () => {
      render(<PanelHarness withSidePanel={true} />);

      expect(screen.getByText('Member list')).toBeTruthy();
      expect(
        screen
          .getByRole('button', { name: 'Member list' })
          .getAttribute('aria-pressed')
      ).toBe('true');
    });

    test('closing it is remembered, so it stays shut on the next channel', () => {
      const { unmount } = render(<PanelHarness withSidePanel={true} />);
      fireEvent.click(screen.getByRole('button', { name: 'Member list' }));
      expect(screen.queryByText('Member list')).toBeNull();

      // 换频道 = 整个 wrapper 重新挂载, 状态只能靠 localStorage 撑住
      unmount();
      render(<PanelHarness withSidePanel={true} />);

      expect(screen.queryByText('Member list')).toBeNull();
      expect(
        screen
          .getByRole('button', { name: 'Member list' })
          .getAttribute('aria-pressed')
      ).toBe('false');
    });

    test('search takes over the slot, and closing it gives the members back', () => {
      render(<PanelHarness withSidePanel={true} />);

      fireEvent.click(screen.getByRole('button', { name: 'Search messages' }));
      expect(screen.getByText('Search results')).toBeTruthy();
      expect(screen.queryByText('Member list')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: '关闭' }));
      expect(screen.getByText('Member list')).toBeTruthy();
    });

    test('starts closed on mobile, where it would cover the conversation', () => {
      mockIsMobile = true;
      render(<PanelHarness withSidePanel={true} />);

      expect(screen.queryByText('Member list')).toBeNull();
    });

    test('a panel with no side panel configured is unaffected', () => {
      render(<PanelHarness />);

      expect(screen.queryByRole('complementary')).toBeNull();
    });
  });
});
