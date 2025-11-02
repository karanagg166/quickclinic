import React from 'react';
import { useParams } from 'react-router-dom';

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-24">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-4">Chat Messages</h1>
          <p className="text-gray-300">
            Chat messages functionality will be implemented here.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Conversation ID: {conversationId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

