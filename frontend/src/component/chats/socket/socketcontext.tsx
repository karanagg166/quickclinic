import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../auth/AuthContext';
import { getSocketUrl } from '../../../utils/api';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'unavailable'
  | 'failed';

export interface PresenceInfo {
  isOnline: boolean;
  lastChecked: number;
}

export interface SendMessagePayload {
  conversationId: string;
  message: string;
  receiverId?: string;
  idempotencyKey?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: any;
  duplicate?: boolean;
  error?: string;
}

export interface SocketContextType {
  socket: Socket | null;
  status: ConnectionStatus;
  isConnected: boolean;
  reconnectCount: number;
  presence: Record<string, PresenceInfo>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (payload: SendMessagePayload) => Promise<SendMessageResponse>;
  checkPresence: (
    targetUserId: string,
    conversationId?: string
  ) => Promise<{ isOnline: boolean; error?: string }>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { authState } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});
  const [reconnectCount, setReconnectCount] = useState<number>(0);

  const socketRef = useRef<Socket | null>(null);
  const activeConversationsRef = useRef<Set<string>>(new Set());
  const currentUserIdRef = useRef<string | null>(null);

  const currentUserId = authState?.user?._id;
  const token = authState?.token;

  // Cleanup active connection
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    activeConversationsRef.current.clear();
    setPresence({});
    setStatus('disconnected');
  }, []);

  // Connect and manage Socket lifecycle
  useEffect(() => {
    // Verified authentication check
    if (!authState?.success || !authState?.user || authState?.loading) {
      disconnectSocket();
      currentUserIdRef.current = null;
      return;
    }

    // Account switch check
    if (currentUserIdRef.current && currentUserIdRef.current !== currentUserId) {
      disconnectSocket();
    }
    currentUserIdRef.current = currentUserId || null;

    // Determine configured realtime server endpoint
    const socketUrl = getSocketUrl();
    if (!socketUrl) {
      // In serverless / unconfigured environment, declare honestly as unavailable
      setStatus('unavailable');
      return;
    }

    setStatus('connecting');

    const socket: Socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');

      // Re-join active conversations upon connect / reconnect
      activeConversationsRef.current.forEach((conversationId) => {
        socket.emit('joinConversation', { conversationId });
      });
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        setStatus('disconnected');
      } else {
        setStatus('reconnecting');
      }
    });

    socket.on('connect_error', (error) => {
      console.warn('Realtime connection error:', error?.message || error);
      if (socket.active) {
        setStatus('reconnecting');
      } else {
        setStatus('failed');
      }
    });

    socket.io.on('reconnect_attempt', () => {
      setStatus('reconnecting');
    });

    socket.io.on('reconnect', () => {
      setStatus('connected');
      setReconnectCount((prev) => prev + 1);

      // Re-join conversations after reconnection
      activeConversationsRef.current.forEach((conversationId) => {
        socket.emit('joinConversation', { conversationId });
      });
    });

    socket.io.on('reconnect_failed', () => {
      setStatus('failed');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authState?.success, authState?.user, authState?.loading, currentUserId, token, disconnectSocket]);

  // Join a conversation room and track for reconnects
  const joinConversation = useCallback((conversationId: string) => {
    if (!conversationId) return;
    activeConversationsRef.current.add(conversationId);
    if (socketRef.current?.connected) {
      socketRef.current.emit('joinConversation', { conversationId });
    }
  }, []);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId: string) => {
    if (!conversationId) return;
    activeConversationsRef.current.delete(conversationId);
    if (socketRef.current?.connected) {
      socketRef.current.emit('leaveConversation', { conversationId });
    }
  }, []);

  // Send message through socket with client-generated idempotency key and timeout
  const sendMessage = useCallback(
    async (payload: SendMessagePayload): Promise<SendMessageResponse> => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return {
          success: false,
          error: 'Realtime service is currently unavailable. Please send via standard connection.',
        };
      }

      // Generate client idempotency key if not supplied
      const idempotencyKey =
        payload.idempotencyKey ||
        `msg_${currentUserId || 'anon'}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      return new Promise<SendMessageResponse>((resolve) => {
        const timeout = setTimeout(() => {
          resolve({
            success: false,
            error: 'Message send timed out. Please try again.',
          });
        }, 10000);

        socket.emit(
          'sendMessage',
          {
            ...payload,
            idempotencyKey,
          },
          (response: any) => {
            clearTimeout(timeout);
            if (response && response.success) {
              resolve({
                success: true,
                message: response.message,
                duplicate: response.duplicate,
              });
            } else {
              resolve({
                success: false,
                error: response?.error || 'Failed to deliver message',
              });
            }
          }
        );
      });
    },
    [currentUserId]
  );

  // Check user presence with relationship authorization
  const checkPresence = useCallback(
    async (
      targetUserId: string,
      conversationId?: string
    ): Promise<{ isOnline: boolean; error?: string }> => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        return { isOnline: false, error: 'Socket disconnected' };
      }

      return new Promise<{ isOnline: boolean; error?: string }>((resolve) => {
        socket.emit(
          'checkPresence',
          { targetUserId, conversationId },
          (response: any) => {
            if (response && typeof response.isOnline === 'boolean') {
              setPresence((prev) => ({
                ...prev,
                [targetUserId]: {
                  isOnline: response.isOnline,
                  lastChecked: Date.now(),
                },
              }));
              resolve({ isOnline: response.isOnline });
            } else {
              resolve({
                isOnline: false,
                error: response?.error || 'Not authorized to check presence',
              });
            }
          }
        );
      });
    },
    []
  );

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        status,
        isConnected: status === 'connected',
        reconnectCount,
        presence,
        joinConversation,
        leaveConversation,
        sendMessage,
        checkPresence,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
