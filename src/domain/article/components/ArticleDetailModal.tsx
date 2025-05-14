import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Apartment as ApartmentIcon,
  Home as HomeIcon,
  LocalOffer as PriceIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  Directions as DirectionsIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'; 
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Card,
  CardMedia,
  Stack,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';


import { Article } from '../types/article.types';

// 유틸리티 함수들을 이 파일 내에 간단히 정의하거나, 적절한 위치로 옮깁니다.
const formatPrice = (price?: number): string => {
  if (price === undefined || price === null) return '가격 문의';
  if (price === 0) return '무료'; // 0원일 경우 처리

  if (price >= 10000) {
    const eok = Math.floor(price / 10000);
    const cheonman = price % 10000;
    if (eok > 0 && cheonman > 0) {
      return `${eok}억 ${cheonman.toLocaleString()}만원`;
    }
    if (eok > 0) {
      return `${eok}억원`;
    }
    if (cheonman > 0) {
      return `${cheonman.toLocaleString()}만원`;
    }
    return '가격 문의'; // 억과 천만원이 모두 0인 경우는 거의 없겠지만, 방어 코드
  }
  return `${price.toLocaleString()}만원`;
};

const isZeroPrice = (price?: number): boolean => {
  return price === undefined || price === null || price === 0;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.error('날짜 변환 중 오류 발생:', e);
    return dateString; // 파싱 실패 시 원본 문자열 반환
  }
};

const getTypeColor = (buildingType?: string): string => {
  switch (buildingType) {
    case 'APT':
    case '아파트':
      return '#2196f3';
    case 'OFFICETEL':
    case '오피스텔':
      return '#4caf50';
    case 'VILLA':
    case '빌라':
      return '#ff9800';
    case 'HOUSE':
    case '단독/다가구':
      return '#9c27b0';
    case 'RETAIL':
    case '상가':
      return '#f44336';
    case 'OFFICE':
    case '사무실':
      return '#607d8b';
    default:
      return '#3E54AC';
  }
};

const getTypeEmoji = (buildingType?: string): string => {
  switch (buildingType) {
    case 'APT':
    case '아파트':
      return '🏢';
    case 'OFFICETEL':
    case '오피스텔':
      return '🏬';
    case 'VILLA':
    case '빌라':
      return '🏠';
    case 'HOUSE':
    case '단독/다가구':
      return '🏡';
    case 'RETAIL':
    case '상가':
    case '상가주택':
      return '🏪';
    case 'OFFICE':
    case '사무실':
      return '🏢';
    default:
      return '🏠';
  }
};

const ModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '800px',
  maxHeight: '90vh',
  backgroundColor: theme.palette.background.paper, // bgcolor 대신 backgroundColor 사용
  boxShadow: theme.shadows[24],
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const ModalHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const ModalBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  overflowY: 'auto',
  flexGrow: 1,
}));

const ModalFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'flex-end',
}));

interface ArticleDetailModalProps {
  open: boolean;
  onClose: () => void;
  article: Article | null;
}

const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({ open, onClose, article }) => {
  if (!article) {
    return null;
  }

  const handleOpenMapLink = () => {
    if (article && (article.addressFullRoad || article.addressFullLot)) {
      window.open(
        `https://map.naver.com/v5/search/${encodeURIComponent(
          article.addressFullRoad || article.addressFullLot || ''
        )}`,
        '_blank'
      );
    }
  };
  
  const BuildingIcon = () => {
    const color = getTypeColor(article.buildingType);
    switch (article.buildingType) {
      case 'APT':
      case '아파트':
        return <ApartmentIcon sx={{ color }} />;
      case 'OFFICETEL':
      case '오피스텔':
        return <BusinessIcon sx={{ color }} />;
      case 'VILLA':
      case '빌라':
      case 'HOUSE':
      case '단독/다가구':
        return <HomeIcon sx={{ color }} />;
      case 'RETAIL':
      case '상가':
      case '상가주택':
        return <StoreIcon sx={{ color }} />;
      case 'OFFICE':
      case '사무실':
        return <BusinessIcon sx={{ color }} />;
      default:
        return <LocationIcon sx={{ color }} />;
    }
  };

  // 평수 계산 함수 (숫자 타입으로 변환 후 계산)
  const calculatePyeong = (area?: string | number) => {
    if (area === undefined || area === null) return '-';
    const numArea = typeof area === 'string' ? parseFloat(area) : area;
    if (isNaN(numArea) || numArea === 0) return '-';
    return (numArea / 3.30578).toFixed(1);
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="article-detail-modal-title">
      <ModalContent>
        <ModalHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: getTypeColor(article.buildingType),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '18px',
              }}
            >
              {getTypeEmoji(article.buildingType)}
            </Box>
            <Typography id="article-detail-modal-title" variant="h6" component="h2">
              {article.articleName || '매물 상세 정보'}
            </Typography>
          </Box>
          <IconButton aria-label="close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </ModalHeader>

        <ModalBody>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: '40%' } }}>
              <Stack spacing={2}>
                <Card>
                  {article.imageUrl ? (
                    <CardMedia
                      component="img"
                      height="250"
                      image={article.imageUrl}
                      alt={article.articleName || '매물 이미지'}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 250,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.200',
                      }}
                    >
                      <Typography color="text.secondary">이미지 없음</Typography>
                    </Box>
                  )}
                </Card>
              </Stack>
            </Box>

            <Box sx={{ width: { xs: '100%', md: '60%' } }}>
              <Stack spacing={2}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.12)'}}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {article.tradeType === '매매' ? '매매가' : '보증금'}{' '}
                    {isZeroPrice(article.priceSale) ? '가격 문의' : formatPrice(article.priceSale)}
                  </Typography>
                  {(article.tradeType === '전세' || article.tradeType === '월세' || article.tradeType === '단기임대') &&
                    article.priceRent && article.priceRent > 0 && (
                    <Typography variant="h6" color="text.secondary">
                      월세 {formatPrice(article.priceRent)}
                    </Typography>
                  )}
                </Paper>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    icon={<BuildingIcon />}
                    label={article.buildingType || '-'} 
                    size="small" 
                    variant="outlined"
                    sx={{ borderColor: getTypeColor(article.buildingType), color: getTypeColor(article.buildingType) }}
                  />
                  <Chip 
                    icon={<PriceIcon />}
                    label={article.tradeType || '-'} 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom display="flex" alignItems="center">
                    <LocationIcon sx={{ verticalAlign: 'middle', mr: 0.5, color: 'text.secondary' }} />
                    주소
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ mb: 0.5 }}>
                    {article.addressFullRoad || article.addressFullLot || '-'}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DirectionsIcon />}
                    endIcon={<OpenInNewIcon />}
                    onClick={handleOpenMapLink}
                  >
                    네이버 지도
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Box>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.12)' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                상세 정보
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ width: '25%', fontWeight: 'medium', borderBottom: 'none', py: 0.5 }}>층수</TableCell>
                      <TableCell sx={{ width: '25%', borderBottom: 'none', py: 0.5 }}>{article.floors || '-'}</TableCell>
                      <TableCell sx={{ width: '25%', fontWeight: 'medium', borderBottom: 'none', py: 0.5 }}>방향</TableCell>
                      <TableCell sx={{ width: '25%', borderBottom: 'none', py: 0.5 }}>{article.direction || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'medium', borderBottom: 'none', py: 0.5 }}>공급면적</TableCell>
                      <TableCell sx={{ borderBottom: 'none', py: 0.5 }}>
                        {article.areaSupply ? `${article.areaSupply}㎡ (${calculatePyeong(article.areaSupply)}평)` : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'medium', borderBottom: 'none', py: 0.5 }}>전용면적</TableCell>
                      <TableCell sx={{ borderBottom: 'none', py: 0.5 }}>
                        {article.areaExclusive ? `${article.areaExclusive}㎡ (${calculatePyeong(article.areaExclusive)}평)` : '-'}
                      </TableCell>
                    </TableRow>
                     <TableRow>
                      <TableCell sx={{ fontWeight: 'medium', borderBottom: 'none', py: 0.5 }}>사용승인일</TableCell>
                      <TableCell sx={{ borderBottom: 'none', py: 0.5 }}>{article.confirmedAt ? formatDate(article.confirmedAt) : '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 'medium', borderBottom: 'none', py: 0.5 }}>주변 지하철역</TableCell>
                      <TableCell sx={{ borderBottom: 'none', py: 0.5 }}>{article.subway || '-'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            
            <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.12)' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                매물 설명
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {article.articleDesc || '등록된 매물 설명이 없습니다.'}
                </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0,0,0,0.12)' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                중개사 정보
              </Typography>
              <Typography variant="body2">
                <strong>공인중개사:</strong> {article.agency || '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>정보 제공 출처:</strong> {article.companyName || '-'}
              </Typography>
            </Paper>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="contained" 
            onClick={onClose}
            sx={{ 
              bgcolor: '#3E54AC',
              '&:hover': {
                bgcolor: '#2E3D80'
              }
            }}
          >
            닫기
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ArticleDetailModal; 