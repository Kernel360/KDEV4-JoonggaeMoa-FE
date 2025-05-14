import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Divider,
  Grid,
  Paper,
  Fade,
  Backdrop,
  Zoom
} from '@mui/material';
import React from 'react';

interface DetailItem {
  label: string;
  value: string | number | React.ReactNode;
}

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  items: DetailItem[];
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const DetailModal: React.FC<DetailModalProps> = ({
  open,
  onClose,
  title,
  items,
  actions,
  maxWidth = 'md'
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      TransitionComponent={Zoom}
      keepMounted
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        bgcolor: '#f8f9fa'
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {items.map((item, index) => (
            <Grid 
              size={{
                xs: 12,
                sm: 6
              }}
              key={index}
            >
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: '#f8f9fa',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 1
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary" 
                  sx={{ mb: 1, fontWeight: 500 }}
                >
                  {item.label}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 400,
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.value || '-'}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      {actions && (
        <>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            {actions}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default DetailModal; 