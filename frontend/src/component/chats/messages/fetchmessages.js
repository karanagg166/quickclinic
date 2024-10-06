import axios from 'axios';

// Function for fetching messages from the backend
export const fetchMessages = async (conversationId) => {
  try {
    const { data: messagesResponse } = await axios.get(`/api/v1/getmessages/${conversationId}`);
    return { success: true, messages: messagesResponse };
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    return { success: false, error: error.message }; // Return failure response if needed
  }
};
