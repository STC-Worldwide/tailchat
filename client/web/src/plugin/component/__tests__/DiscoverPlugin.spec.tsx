import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

const mockLocalTrans = jest.fn(
  (translations: Record<'zh-CN' | 'en-US', string>) => translations['en-US']
);
const mockUseAsyncRefresh = jest.fn();
const mockUseAsyncRequest = jest.fn();
const mockUseEvent = jest.fn((fn) => fn);
const mockUseGroupInfo = jest.fn();
const mockUseNavigate = jest.fn();

jest.mock('@capital/common', () => ({
  createPluginRequest: () => ({ get: jest.fn(), post: jest.fn() }),
  localTrans: mockLocalTrans,
  postRequest: jest.fn(),
  useAsyncRefresh: mockUseAsyncRefresh,
  useAsyncRequest: mockUseAsyncRequest,
  useEvent: mockUseEvent,
  useGroupInfo: mockUseGroupInfo,
  useNavigate: mockUseNavigate,
}));

const {
  DiscoverPanel,
} = require('../../../../../../server/plugins/com.msgbyte.discover/web/plugins/com.msgbyte.discover/src/DiscoverPanel');
const {
  DiscoverServerCard,
} = require('../../../../../../server/plugins/com.msgbyte.discover/web/plugins/com.msgbyte.discover/src/DiscoverPanel/DiscoverServerCard');

const group = {
  avatar: null,
  description: 'A public collaboration group.',
  memberCount: 12,
  name: 'Tailchat Community',
};

describe('Discover plugin Shadcn states', () => {
  const refresh = jest.fn();
  const handleJoin = jest.fn();
  const navigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalTrans.mockImplementation(
      (translations: Record<'zh-CN' | 'en-US', string>) => translations['en-US']
    );
    mockUseEvent.mockImplementation((fn) => fn);
    mockUseNavigate.mockReturnValue(navigate);
    mockUseGroupInfo.mockReturnValue(null);
    mockUseAsyncRequest.mockReturnValue([{ loading: false }, handleJoin]);
  });

  test('renders the page heading and mirrored loading cards', () => {
    mockUseAsyncRefresh.mockReturnValue({
      error: undefined,
      loading: true,
      refresh,
      value: undefined,
    });

    render(<DiscoverPanel />);

    expect(
      screen.getByRole('heading', { name: 'Discover', level: 1 })
    ).not.toBeNull();
    expect(screen.getAllByLabelText('Loading group')).toHaveLength(3);
  });

  test('renders the empty state when no public groups are available', () => {
    mockUseAsyncRefresh.mockReturnValue({
      error: undefined,
      loading: false,
      refresh,
      value: [],
    });

    render(<DiscoverPanel />);

    expect(screen.getByText('No public groups yet')).not.toBeNull();
    expect(
      screen.getByText(
        'Public groups will appear here when they become available.'
      )
    ).not.toBeNull();
  });

  test('renders a recoverable page error', () => {
    mockUseAsyncRefresh.mockReturnValue({
      error: new Error('Network unavailable'),
      loading: false,
      refresh,
      value: undefined,
    });

    render(<DiscoverPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Could not load public groups')).not.toBeNull();
    expect(screen.getByText('Network unavailable')).not.toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  test('renders a recoverable unavailable-card state', () => {
    mockUseAsyncRefresh.mockReturnValue({
      error: new Error('Missing group'),
      loading: false,
      refresh,
      value: undefined,
    });

    render(<DiscoverServerCard groupId="group-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      screen.getByText('This group is currently unavailable.')
    ).not.toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  test('keeps the Join action disabled and dimensionally stable while loading', () => {
    mockUseAsyncRefresh.mockReturnValue({
      error: undefined,
      loading: false,
      refresh,
      value: group,
    });
    mockUseAsyncRequest.mockReturnValue([{ loading: true }, handleJoin]);

    render(<DiscoverServerCard groupId="group-1" />);

    const joinButton = screen.getByRole('button', {
      name: 'Join: Tailchat Community',
    });
    expect((joinButton as HTMLButtonElement).disabled).toBe(true);
    expect(joinButton.getAttribute('aria-busy')).toBe('true');
    expect(joinButton.className).toContain('min-h-11');
    expect(joinButton.className).toContain('sm:min-h-8');
  });

  test('transitions from Join to Open group when membership updates', () => {
    let joined = false;
    mockUseAsyncRefresh.mockReturnValue({
      error: undefined,
      loading: false,
      refresh,
      value: group,
    });
    mockUseGroupInfo.mockImplementation(() =>
      joined ? { _id: 'group-1' } : null
    );

    const { rerender } = render(
      <DiscoverServerCard key="not-joined" groupId="group-1" />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Join: Tailchat Community' })
    );
    expect(handleJoin).toHaveBeenCalledTimes(1);

    joined = true;
    rerender(<DiscoverServerCard key="joined" groupId="group-1" />);
    const openButton = screen.getByRole('button', {
      name: 'Open group: Tailchat Community',
    });
    expect(openButton.className).toContain('min-h-11');
    fireEvent.click(openButton);
    expect(navigate).toHaveBeenCalledWith('/main/group/group-1');
  });
});
