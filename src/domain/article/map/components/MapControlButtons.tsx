import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import MyLocationIcon from '@mui/icons-material/MyLocation';

interface MapControlButtonsProps {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleCurrentLocation: () => void;
  isLocating: boolean;
}

const MapControlButtons = ({
  handleZoomIn,
  handleZoomOut,
  handleCurrentLocation,
  isLocating
}: MapControlButtonsProps) => {
  return (
    <>
      {/* 줌 컨트롤 버튼 */}
      <Box sx={{
        position: 'absolute',
        right: '10px',
        bottom: '20px',
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Button
          onClick={handleZoomIn}
          sx={{minWidth: '36px', height: '36px', p: 0, borderRadius: '4px 4px 0 0'}}
        >
          <AddIcon />
        </Button>
        <Box sx={{height: '1px', bgcolor: 'divider', width: '100%'}} />
        <Button
          onClick={handleZoomOut}
          sx={{minWidth: '36px', height: '36px', p: 0, borderRadius: '0 0 4px 4px'}}
        >
          <RemoveIcon />
        </Button>
      </Box>

      {/* 현재 위치 버튼 */}
      <Box sx={{
        position: 'absolute',
        right: '10px',
        bottom: '100px',
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Button
          onClick={handleCurrentLocation}
          disabled={isLocating}
          sx={{
            minWidth: '36px',
            height: '36px',
            p: 0,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <MyLocationIcon color={isLocating ? "disabled" : "primary"} />
        </Button>
      </Box>
    </>
  );
};

export default MapControlButtons; 