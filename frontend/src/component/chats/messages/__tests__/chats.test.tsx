import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ChatPage from '../chats';
import { useAuth } from '../../../auth/AuthContext';
import { useSocket } from '../../socket/socketcontext';
import axios from 'axios';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../socket/socketcontext', () => ({
  useSocket: jest.fn(),
}));

jest.mock('axios');

// Mock framer-motion to render plain HTML elements
jest.mock('framer-motion', () => ({
  __esModule: true,
  motion: {
    div: ({ children, className, whileHover, whileTap, initial, animate, transition, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    button: ({ children, className, onClick, whileHover, whileTap, initial, animate, transition, ...props }: any) => (
      <button className={className} onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
}));

// Mock particle background
jest.mock('../../../common/SimpleParticleBackground', () => () => <div data-testid="particles" />);

describe('ChatPage Component Rendering, Realtime Deduplication, & Accessibility', () => {
  let mockSocketListeners: Record<string, Function>;
  let mockSocket: any;
  let mockSocketContext: any;

  beforeEach(() => {
    mockSocketListeners = {};
    mockSocket = {
      on: jest.fn((event: string, handler: Function) => {
        mockSocketListeners[event] = handler;
        return mockSocket;
      }),
      off: jest.fn((event: string) => {
        delete mockSocketListeners[event];
        return mockSocket;
      }),
    };

    mockSocketContext = {
      socket: mockSocket,
      status: 'connected',
      isConnected: true,
      reconnectCount: 0,
      presence: {
        'doc-456': { isOnline: true, lastChecked: Date.now() },
      },
      joinConversation: jest.fn(),
      leaveConversation: jest.fn(),
      sendMessage: jest.fn(),
      checkPresence: jest.fn(),
    };

    (useSocket as jest.Mock).mockReturnValue(mockSocketContext);

    (useAuth as jest.Mock).mockReturnValue({
      authState: {
        success: true,
        user: { _id: 'patient-123', name: 'John Patient' },
        token: 'token-xyz',
      },
    });

    (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('message/getmessages')) {
        return Promise.resolve({
          data: [
            {
              _id: 'msg-1',
              senderId: { _id: 'doc-456', name: 'Dr. Smith' },
              receiverId: 'patient-123',
              conversationId: 'conv-999',
              message: 'Hello, how can I assist you?',
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }
      if (url.includes('users/doc-456')) {
        return Promise.resolve({
          data: {
            success: true,
            user: { _id: 'doc-456', name: 'Dr. Smith' },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderChat = () =>
    render(
      <MemoryRouter initialEntries={['/chats/conv-999']}>
        <Routes>
          <Route path="/chats/:conversationId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    );

  test('Renders chat page with honest presence, join room lifecycle, and accessibility', async () => {
    renderChat();

    // Verify loading transitions to loaded messages
    await waitFor(() => {
      expect(screen.getByText('Hello, how can I assist you?')).toBeInTheDocument();
    });

    // Check conversation join was dispatched
    expect(mockSocketContext.joinConversation).toHaveBeenCalledWith('conv-999');

    // Check participant name & presence display
    expect(screen.getAllByText('Dr. Smith').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Online')).toBeInTheDocument();

    // Check inactive call controls are disabled with accessible names
    const audioCallBtn = screen.getByRole('button', {
      name: /audio call \(feature currently unavailable\)/i,
    });
    const videoCallBtn = screen.getByRole('button', {
      name: /video call \(feature currently unavailable\)/i,
    });

    expect(audioCallBtn).toBeDisabled();
    expect(videoCallBtn).toBeDisabled();
  });

  test('Deduplicates duplicate incoming realtime messages by message ID', async () => {
    renderChat();

    await waitFor(() => {
      expect(screen.getByText('Hello, how can I assist you?')).toBeInTheDocument();
    });

    const duplicateMessage = {
      _id: 'dup-msg-id-1',
      senderId: { _id: 'doc-456', name: 'Dr. Smith' },
      receiverId: 'patient-123',
      conversationId: 'conv-999',
      message: 'Take your prescription twice daily.',
      createdAt: new Date().toISOString(),
    };

    // Simulate receiving message event first time
    act(() => {
      if (mockSocketListeners['receiveMessage']) {
        mockSocketListeners['receiveMessage'](duplicateMessage);
      }
    });

    expect(screen.getByText('Take your prescription twice daily.')).toBeInTheDocument();
    expect(screen.getAllByText('Take your prescription twice daily.')).toHaveLength(1);

    // Simulate receiving duplicate message event second time
    act(() => {
      if (mockSocketListeners['receiveMessage']) {
        mockSocketListeners['receiveMessage'](duplicateMessage);
      }
    });

    // Verify still rendered exactly once
    expect(screen.getAllByText('Take your prescription twice daily.')).toHaveLength(1);
  });

  test('Handles send failure and displays clear user error notification', async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Network connection dropped' } },
    });
    mockSocketContext.isConnected = false; // Force fallback to REST to test error branch

    renderChat();

    await waitFor(() => {
      expect(screen.getByText('Hello, how can I assist you?')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox', { name: /message text/i });
    const sendButton = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(input, { target: { value: 'This send will fail' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Network connection dropped')).toBeInTheDocument();
    });
  });

  test('Fetches missed history after reconnection', async () => {
    const { rerender } = renderChat();

    await waitFor(() => {
      expect(screen.getByText('Hello, how can I assist you?')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledTimes(2); // messages + user

    // Reconnection occurs: reconnectCount increments
    mockSocketContext.reconnectCount = 1;
    (useSocket as jest.Mock).mockReturnValue({
      ...mockSocketContext,
      reconnectCount: 1,
    });

    rerender(
      <MemoryRouter initialEntries={['/chats/conv-999']}>
        <Routes>
          <Route path="/chats/:conversationId" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify fetchMessages was triggered again to sync missed history
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
  });
});
