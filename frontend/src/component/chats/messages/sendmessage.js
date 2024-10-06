import axios from 'axios';

// Function for sending a message to the backend
export const sendMessage = async (senderId, receiverId, newMessage) => {
  if (!newMessage.trim()) return;

  try {
    await axios.post(`/api/v1/sendmessage/${senderId}`, {
      message: newMessage,
      receiverId,
    });
    return { success: true }; // Return success response if needed
  } catch (error) {
    console.error('Error sending message:', error.message);
    return { success: false, error: error.message }; // Return failure response if needed
  }
};
