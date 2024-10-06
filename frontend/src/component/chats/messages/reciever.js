import axios from 'axios';

// Function for fetching the receiver's ID
export const getReceiverId = async (conversationId, userId) => {
  try {
    const { data } = await axios.get(`/api/v1/recieverId/${conversationId}`);
    const participants = data.participants;
    
    const receiver = participants.find((participant) => participant._id !== userId);
   
    return { success: true, receiverId: receiver };
  } catch (error) {
    console.error('Error fetching receiver ID:', error.message);
    return { success: false, error: error.message };
  }
};
