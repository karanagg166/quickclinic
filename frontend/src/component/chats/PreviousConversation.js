import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, IconButton } from '@mui/material';
import { ChatBubbleOutline } from '@mui/icons-material';
import axios from 'axios';
import { motion } from 'framer-motion';

const PreviousConversations = ({ userId }) => {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(`/api/v1/conversations/${userId}`);
        setConversations(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    fetchConversations();
  }, [userId]);

  const handleConversationClick = (conversationId) => {
    navigate(`/user/chats/${conversationId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <motion.h1 
        className="text-3xl font-bold text-green-600 mb-6"
        initial={{ y: -30 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 60 }}
      >
      Chats
      </motion.h1>

      <div className="grid grid-cols-1 gap-4">
        {conversations.map(conversation => (
          <motion.div
            key={conversation.conversationId}
            className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center hover:bg-blue-50 cursor-pointer"
            onClick={() => handleConversationClick(conversation.conversationId)}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <Avatar src={conversation.avatarUrl || 'https://via.placeholder.com/50'} />
              <div className="ml-4">
                <h2 className="text-lg font-medium">{conversation.otherParticipantName}</h2>
                <p className="text-sm text-gray-500">{conversation.lastMessage || 'No messages yet'}</p>
              </div>
            </div>
            <IconButton>
              <ChatBubbleOutline />
            </IconButton>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PreviousConversations;
