import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box 
      sx={{ 
        p: 2, 
        textAlign: "center", 
        // mt: 4,
        // borderTop: '1px solid #e0e0e0',
        // backgroundColor: '#f8f9fa'
      }}
    >
      <Typography variant="caption" color="textSecondary">
        © 2025 중개모아. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer; 