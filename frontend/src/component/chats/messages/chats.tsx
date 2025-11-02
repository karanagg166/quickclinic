import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import axios from 'axios';
import { api } from '../../../utils/api';
import { useAuth } from '../../auth/AuthContext';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
  };
  receiverId: string;
  conversationId: string;
  message: string;
  createdAt: string;
}

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const currentUserId = authState?.user?._id;

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(api.getUrl(`message/getmessages/${conversationId}`));
      // Messages are returned newest first, reverse to show oldest first
      const reversedMessages = Array.isArray(response.data) ? [...response.data].reverse() : [];
      setMessages(reversedMessages);
      
      // Get other participant info
      if (reversedMessages.length > 0) {
        const firstMessage = reversedMessages[0];
        const senderId = typeof firstMessage.senderId === 'object' && firstMessage.senderId?._id 
          ? firstMessage.senderId._id 
          : (typeof firstMessage.senderId === 'string' ? firstMessage.senderId : null);
        const otherId = senderId === currentUserId 
          ? firstMessage.receiverId 
          : senderId;
        
        // Fetch other participant details
        if (otherId) {
          try {
            const userResponse = await axios.get(api.getUrl(`users/${otherId}`));
            if (userResponse.data.success) {
              setOtherParticipant(userResponse.data.user[0] || userResponse.data.user);
            }
          } catch (error) {
            console.error('Error fetching participant:', error);
          }
        }
      } else {
        // If no messages, get participant from conversation
        try {
          const convResponse = await axios.get(api.getUrl(`message/recieverId/${conversationId}`));
          if (convResponse.data.success && convResponse.data.participants.length > 0) {
            const otherParticipant = convResponse.data.participants.find((p: any) => p._id !== currentUserId);
            if (otherParticipant) {
              setOtherParticipant(otherParticipant);
            }
          }
        } catch (error) {
          console.error('Error fetching conversation participants:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Setup Socket.io connection
  useEffect(() => {
    if (!currentUserId) return;

    // Connect to socket server (only if not on Vercel, as serverless doesn't support persistent connections)
    const socketUrl = process.env.REACT_APP_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');
    
    if (socketUrl) {
      const socket = io(socketUrl, {
        query: { userId: currentUserId },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      // Listen for new messages
      socket.on('receiveMessage', (message: Message) => {
        if (message.conversationId === conversationId) {
          setMessages(prev => [...prev, message]);
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [currentUserId, conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !conversationId || sending) return;

    try {
      setSending(true);
      
      // Get receiver ID from messages (the other participant)
      let receiverId = '';
      if (messages.length > 0) {
        const firstMessage = messages[0];
        const senderId = typeof firstMessage.senderId === 'object' && firstMessage.senderId?._id 
          ? firstMessage.senderId._id 
          : (typeof firstMessage.senderId === 'string' ? firstMessage.senderId : '');
        receiverId = senderId === currentUserId 
          ? firstMessage.receiverId 
          : (senderId || '');
      } else {
        // If no messages, we need to get it from conversation
        const convResponse = await axios.get(api.getUrl(`message/recieverId/${conversationId}`));
        if (convResponse.data.success) {
          const participants = convResponse.data.participants;
          receiverId = participants.find((p: any) => p._id !== currentUserId)?._id;
        }
      }

      if (!receiverId) {
        alert('Unable to determine receiver. Please refresh the page.');
        return;
      }

      const response = await axios.post(api.getUrl(`message/sendmessage/${currentUserId}`), {
        message: newMessage,
        receiverId,
        conversationId,
      });

      if (response.data) {
        // Populate sender info
        const messageWithSender = {
          ...response.data,
          senderId: {
            _id: currentUserId,
            name: authState.user?.name || 'You',
          },
        };
        setMessages(prev => [...prev, messageWithSender]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(dateString)) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20">
      {/* Chat Header */}
      <div className="bg-white shadow-md sticky top-20 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-semibold">
              {otherParticipant?.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">
                {otherParticipant?.name || 'Doctor'}
              </h2>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-280px)] flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDh2NDhIMHoiLz48cGF0aCBkPSJNMjQgMGMtMTMuMjU0IDAtMjQgMTAuNzQ2LTI0IDI0czEwLjc0NiAyNCAyNCAyNCAyNC0xMC43NDYgMjQtMjRTMzcuMjU0IDAgMjQgMHptMCA0NGMtMTEuMDQ2IDAtMjAtOC45NTQtMjAtMjBTMTIuOTU0IDQgMjQgNHMyMCA4Ljk1NCAyMCAyMC04Ljk1NCAyMC0yMCAyMHoiIGZpbGw9IiNhYmFkYmEiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvZz48L3N2Zz4=')]">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const senderId = typeof message.senderId === 'object' && message.senderId?._id 
                  ? message.senderId._id 
                  : (typeof message.senderId === 'string' ? message.senderId : null);
                const senderName = typeof message.senderId === 'object' && message.senderId?.name
                  ? message.senderId.name
                  : 'Unknown';
                const isOwnMessage = senderId === currentUserId;
                const showDateSeparator = index === 0 || 
                  formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

                return (
                  <React.Fragment key={message._id}>
                    {showDateSeparator && (
                      <div className="text-center my-4">
                        <span className="bg-white/80 px-3 py-1 rounded-full text-xs text-gray-600">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-[#dcf8c6] rounded-tr-none ml-auto'
                              : 'bg-white rounded-tl-none'
                          } shadow-sm`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-semibold text-[#128c7e] mb-1">
                              {senderName}
                            </p>
                          )}
                          <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                          <p className={`text-xs mt-1 flex items-center gap-1 ${isOwnMessage ? 'text-gray-500 justify-end' : 'text-gray-400'}`}>
                            {formatTime(message.createdAt)}
                            {isOwnMessage && (
                              <span className="text-[#128c7e]">✓</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-gray-50 p-3">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={sending}
              />
              <motion.button
                type="submit"
                disabled={!newMessage.trim() || sending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-full ${
                  newMessage.trim()
                    ? 'bg-[#128c7e] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-colors`}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
