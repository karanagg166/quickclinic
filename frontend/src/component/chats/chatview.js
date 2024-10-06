import React, { useState } from 'react';
import PreviousConversations from './PreviousConversation'; // Import your previous conversations component
import SearchPage from './search'; // Import your search page component
import { Box, TextField, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ChatViewPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const id = JSON.parse(localStorage.getItem('authState')).user._id;

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Search Bar */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          variant="outlined"
          fullWidth
          placeholder="Search for a user..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Conditional Rendering */}
      {showSearchResults ? (
        <SearchPage searchQuery={searchQuery} /> // Pass searchQuery to SearchPage if needed
      ) : (
        <PreviousConversations userId={id} />
      )}
    </Box>
  );
};

export default ChatViewPage;
