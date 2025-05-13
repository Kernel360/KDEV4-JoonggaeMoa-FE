import AddIcon from '@mui/icons-material/Add';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Button } from '@mui/material';

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
  // 디버깅을 위한 이벤트 핸들러
  const onZoomInClick = () => {
    console.log('줌인 버튼 클릭됨');
    handleZoomIn();
  };

  const onZoomOutClick = () => {
    console.log('줌아웃 버튼 클릭됨');
    handleZoomOut();
  };

  const onCurrentLocationClick = () => {
    console.log('현재 위치 버튼 클릭됨');
    handleCurrentLocation();
  };

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
          onClick={onZoomInClick}
          sx={{minWidth: '36px', height: '36px', p: 0, borderRadius: '4px 4px 0 0'}}
        >
          <AddIcon />
        </Button>
        <Box sx={{height: '1px', bgcolor: 'divider', width: '100%'}} />
        <Button
          onClick={onZoomOutClick}
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
          onClick={onCurrentLocationClick}
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