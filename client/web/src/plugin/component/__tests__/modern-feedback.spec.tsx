import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FeedbackHost } from '@/components/ui/feedback';
import { notification, Popconfirm } from '../modern-feedback';

jest.mock('@/hooks/useAppPortalContainer', () => ({
  useAppPortalContainer: () => document.body,
}));

describe('modern plugin feedback compatibility controls', () => {
  afterEach(() => {
    notification.destroy();
  });

  test('confirms an anchored action and closes after async work resolves', async () => {
    const handleConfirm = jest.fn().mockResolvedValue(undefined);
    render(
      <Popconfirm title="Delete this topic?" onConfirm={handleConfirm}>
        <button type="button">Delete topic</button>
      </Popconfirm>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete topic' }));
    expect(await screen.findByRole('alertdialog')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(handleConfirm).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  test('preserves cancellation labels and legacy visibility callbacks', async () => {
    const handleCancel = jest.fn();
    const handleVisibleChange = jest.fn();
    render(
      <Popconfirm
        title="Leave this meeting?"
        description="You can rejoin from the invitation later."
        cancelText="Stay"
        okText="Leave"
        onCancel={handleCancel}
        onVisibleChange={handleVisibleChange}
      >
        <button type="button">Leave meeting</button>
      </Popconfirm>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Leave meeting' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
    expect(
      document.getElementById(dialog.getAttribute('aria-describedby') ?? '')
        ?.textContent
    ).toBe('You can rejoin from the invitation later.');
    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));

    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleVisibleChange).toHaveBeenLastCalledWith(false);
  });

  test('renders keyed persistent notifications with rich content and actions', async () => {
    const handleClose = jest.fn();
    render(<FeedbackHost />);

    notification.open({
      key: 'meeting-invite',
      message: 'Video meeting invitation',
      description: 'Taylor invited you to join the meeting.',
      duration: 0,
      btn: <button type="button">Join now</button>,
      onClose: handleClose,
    });

    expect(await screen.findByText('Video meeting invitation')).not.toBeNull();
    expect(
      screen.getByText('Taylor invited you to join the meeting.')
    ).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Join now' })).not.toBeNull();
    expect(
      document.querySelector('[data-feedback-key="meeting-invite"]')
    ).not.toBeNull();

    notification.close('meeting-invite');
    await waitFor(() =>
      expect(screen.queryByText('Video meeting invitation')).toBeNull()
    );
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('updates an existing keyed notification instead of duplicating it', async () => {
    render(<FeedbackHost />);

    notification.info({
      key: 'update',
      message: 'Version 1 is available',
      duration: 0,
    });
    notification.success({
      key: 'update',
      message: 'Version 2 is ready',
      duration: 0,
    });

    expect(await screen.findByText('Version 2 is ready')).not.toBeNull();
    expect(screen.queryByText('Version 1 is available')).toBeNull();
    expect(
      document.querySelectorAll('[data-feedback-key="update"]')
    ).toHaveLength(1);
  });

  test('makes clickable notifications keyboard operable without hijacking actions', async () => {
    const handleNotificationClick = jest.fn();
    const handleActionClick = jest.fn();
    render(<FeedbackHost />);

    notification.open({
      key: 'keyboard-notice',
      message: 'Open meeting details',
      duration: 0,
      onClick: handleNotificationClick,
      btn: (
        <button type="button" onClick={handleActionClick}>
          Join meeting
        </button>
      ),
    });

    const notificationItem = (
      await screen.findByText('Open meeting details')
    ).closest('[data-feedback-key]') as HTMLElement;
    expect(notificationItem.tabIndex).toBe(0);

    fireEvent.keyDown(notificationItem, { key: 'Enter' });
    expect(handleNotificationClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Join meeting' }));
    expect(handleActionClick).toHaveBeenCalledTimes(1);
    expect(handleNotificationClick).toHaveBeenCalledTimes(1);
  });
});
