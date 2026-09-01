import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../renderer/App';

const addServer = jest.fn();
const removeServer = jest.fn();

jest.mock('../renderer/store/server', () => ({
  defaultServerList: [
    {
      name: 'Tailchat',
      url: 'https://nightly.paw.msgbyte.com/',
      version: 'nightly',
    },
  ],
  useServerStore: () => ({
    addServer,
    removeServer,
    serverList: [],
  }),
}));

describe('App', () => {
  beforeEach(() => {
    addServer.mockReset();
    removeServer.mockReset();
  });

  it('renders the modern server launcher', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Choose a server' })
    ).not.toBeNull();
    expect(screen.getByRole('button', { name: /Tailchat/i })).not.toBeNull();
    expect(
      screen.getByRole('button', { name: /Add Server/i })
    ).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Website' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Exit' })).not.toBeNull();
  });

  it('validates a server address before connecting', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Add Server/i }));

    const input = screen.getByLabelText('Server address');
    fireEvent.change(input, { target: { value: 'not a server' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add server' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Enter a complete HTTP or HTTPS server address.'
    );
    expect(addServer).not.toHaveBeenCalled();
  });

  it('adds a valid server and closes the dialog', async () => {
    addServer.mockResolvedValue(undefined);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Add Server/i }));

    fireEvent.change(screen.getByLabelText('Server address'), {
      target: { value: 'https://chat.example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add server' }));

    await waitFor(() =>
      expect(addServer).toHaveBeenCalledWith('https://chat.example.com/')
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).toBeNull()
    );
  });
});
