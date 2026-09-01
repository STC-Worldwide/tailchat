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
}));

const PanelHarness: React.FC = () => (
  <CommonPanelWrapper
    header="Lobby"
    actions={({ setRightPanel }) => [
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
    ]}
  >
    <div>Conversation</div>
  </CommonPanelWrapper>
);

describe('Shadcn panel shell', () => {
  afterEach(() => {
    mockIsMobile = false;
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
});
