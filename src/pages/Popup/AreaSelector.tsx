
import React from 'react';
import { Typography, Button, Box, Paper, Divider } from '@mui/material';

interface AreaSelectorProps {
  onSelectArea: (type: 'input' | 'output') => void;
}

const AreaSelector: React.FC<AreaSelectorProps> = ({ onSelectArea }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Wybór obszarów czatu
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Zaznacz obszary do wysyłania i odbierania wiadomości na dowolnej stronie z czatem.
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => onSelectArea('input')}
          fullWidth
        >
          Wybierz obszar do wysyłania wiadomości
        </Button>
        
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={() => onSelectArea('output')}
          fullWidth
        >
          Wybierz obszar do odbierania wiadomości
        </Button>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="body2" color="text.secondary">
        Po wybraniu obszarów, Taxy będzie mógł automatycznie wysyłać i analizować wiadomości na tej stronie.
      </Typography>
    </Paper>
  );
};

export default AreaSelector;
