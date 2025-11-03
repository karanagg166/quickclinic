import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Search } from 'lucide-react';
import axios from 'axios';
import { api } from '../../utils/api';
import SimpleParticleBackground from '../common/SimpleParticleBackground';
import GlassCard from '../common/GlassCard';

interface Conversation {
  conversationId: string;
  otherParticipantId: string;
  otherParticipantName: string;
  lastMessage: string;
}

const ChatViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await axios.get(api.getUrl(`message/conversations/${id}`));
        setConversations(response.data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    
    // Refresh conversations when page gains focus
    const handleFocus = () => {
      fetchConversations();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id]);

  const filteredConversations = conversations.filter(conv =>
    conv.otherParticipantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (message: string) => {
    // This would need the actual timestamp from conversation
    // For now, just return empty
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <SimpleParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-28">
          <GlassCard glow className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading conversations...</p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SimpleParticleBackground />
      <div className="relative z-10 min-h-screen pt-28 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="overflow-hidden">
              <div className="bg-gradient-to-r from-neon-500/20 to-cyan-500/20 backdrop-blur-sm border-b border-white/20 p-6">
                <h1 className="text-3xl font-bold mb-4 flex items-center gap-3 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                  <MessageCircle className="w-8 h-8 text-neon-400" />
                  Messages
                </h1>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="overflow-hidden">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <p className="text-white/70 mb-2">
                      {searchTerm ? 'No conversations found' : 'No conversations yet'}
                    </p>
                    {!searchTerm && (
                      <p className="text-white/50 text-sm">
                        Start a conversation by booking an appointment with a doctor
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {filteredConversations.map((conversation, index) => (
                      <motion.div
                        key={conversation.conversationId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link
                          to={`/chats/${conversation.conversationId}`}
                          className="flex items-center gap-4 p-4 hover:bg-white/10 transition-colors"
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-neon-400 to-cyan-400 flex items-center justify-center text-white font-semibold flex-shrink-0 border-2 border-white/20">
                            {conversation.otherParticipantName.charAt(0).toUpperCase()}
                          </div>

                          {/* Conversation Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-white truncate">
                                {conversation.otherParticipantName}
                              </h3>
                              <span className="text-xs text-white/50 ml-2">
                                {formatTime(conversation.lastMessage)}
                              </span>
                            </div>
                            <p className="text-sm text-white/70 truncate">
                              {conversation.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChatViewPage;
