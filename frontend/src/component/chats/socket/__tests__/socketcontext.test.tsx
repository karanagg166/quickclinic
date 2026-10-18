import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SocketProvider, useSocket } from '../socketcontext';
import { useAuth } from '../../../auth/AuthContext';
import { io } from 'socket.io-client';

jest.mock('../../../auth/AuthContext', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

jest.mock('socket.io-client');

process.env.REACT_APP_SOCKET_URL = 'http://localhost:5000';

describe('SocketProvider Connection Lifecycle & Operations', () => {
  let mockSocket: any;
  let eventHandlers: Record<string, Function>;
  let ioHandlers: Record<string, Function>;

  beforeEach(() => {
    eventHandlers = {};
    ioHandlers = {};

    mockSocket = {
      connected: false,
      active: true,
      on: jest.fn((event: string, handler: Function) => {
        eventHandlers[event] = handler;
        return mockSocket;
      }),
      off: jest.fn((event: string) => {
        delete eventHandlers[event];
        return mockSocket;
      }),
      emit: jest.fn(),
      disconnect: jest.fn(() => {
        mockSocket.connected = false;
      }),
      removeAllListeners: jest.fn(() => {
        eventHandlers = {};
      }),
      io: {
        on: jest.fn((event: string, handler: Function) => {
          ioHandlers[event] = handler;
        }),
      },
    };

    (io as jest.Mock).mockReturnValue(mockSocket);

    (useAuth as jest.Mock).mockReturnValue({
      authState: {
        success: true,
        user: { _id: 'user-123', name: 'Test User' },
        token: 'valid-test-token',
        loading: false,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const TestConsumer: React.FC = () => {
    const {
      status,
      isConnected,
      presence,
      joinConversation,
      sendMessage,
      checkPresence,
      reconnectCount,
    } = useSocket();

    return (
      <div>
        <div data-testid="status">{status}</div>
        <div data-testid="connected">{isConnected ? 'yes' : 'no'}</div>
        <div data-testid="reconnect-count">{reconnectCount}</div>
        <button onClick={() => joinConversation('conv-123')}>Join Conv</button>
        <button
          onClick={() =>
            sendMessage({
              conversationId: 'conv-123',
              message: 'Hello world',
              idempotencyKey: 'idemp-key-test',
            })
          }
        >
          Send
        </button>
        <button onClick={() => checkPresence('user-target-456', 'conv-123')}>Check Presence</button>
        <div data-testid="target-presence">
          {presence['user-target-456']
            ? presence['user-target-456'].isOnline
              ? 'online'
              : 'offline'
            : 'unknown'}
        </div>
      </div>
    );
  };

  test('Connects after verified authentication and updates status', async () => {
    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    expect(screen.getByTestId('status').textContent).toBe('connecting');
    expect(io).toHaveBeenCalledWith('http://localhost:5000', expect.any(Object));

    // Simulate socket connect event
    act(() => {
      mockSocket.connected = true;
      if (eventHandlers['connect']) {
        eventHandlers['connect']();
      }
    });

    expect(screen.getByTestId('status').textContent).toBe('connected');
    expect(screen.getByTestId('connected').textContent).toBe('yes');
  });

  test('Disconnects and clears state on logout or unauthenticated session', async () => {
    const { rerender } = render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    act(() => {
      mockSocket.connected = true;
      if (eventHandlers['connect']) {
        eventHandlers['connect']();
      }
    });

    expect(screen.getByTestId('status').textContent).toBe('connected');

    // User logs out
    (useAuth as jest.Mock).mockReturnValue({
      authState: {
        success: false,
        user: null,
        loading: false,
      },
    });

    rerender(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(screen.getByTestId('status').textContent).toBe('disconnected');
    expect(screen.getByTestId('connected').textContent).toBe('no');
  });

  test('Rejoins active conversations and increments reconnectCount on reconnect', async () => {
    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    act(() => {
      mockSocket.connected = true;
      if (eventHandlers['connect']) {
        eventHandlers['connect']();
      }
    });

    // Component joins conversation
    act(() => {
      screen.getByText('Join Conv').click();
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('joinConversation', { conversationId: 'conv-123' });

    // Simulate reconnect event
    act(() => {
      if (ioHandlers['reconnect']) {
        ioHandlers['reconnect']();
      }
    });

    expect(screen.getByTestId('reconnect-count').textContent).toBe('1');
    expect(screen.getByTestId('status').textContent).toBe('connected');
    expect(mockSocket.emit).toHaveBeenCalledWith('joinConversation', { conversationId: 'conv-123' });
  });

  test('Checks and caches presence status for authorized targets', async () => {
    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>
    );

    act(() => {
      mockSocket.connected = true;
      if (eventHandlers['connect']) {
        eventHandlers['connect']();
      }
    });

    // Mock response for checkPresence
    mockSocket.emit.mockImplementation((event: string, data: any, callback: Function) => {
      if (event === 'checkPresence') {
        callback({ userId: data.targetUserId, isOnline: true });
      }
    });

    await act(async () => {
      screen.getByText('Check Presence').click();
    });

    expect(screen.getByTestId('target-presence').textContent).toBe('online');
  });
});
