import {
    Box,
    Button,
    Card,
    CardMedia,
    Chip,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsIcon from '@mui/icons-material/Directions';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { ArticleResponse, ComplexResponse } from '../types/article';
import { formatDate, formatPrice, getTradeTypeColor, getTypeColor, getTypeEmoji, isZeroPrice } from '../utils/articleUtils';
import { useRef, useEffect } from 'react';

interface ArticleDetailProps {
    article: ArticleResponse;
    complex?: ComplexResponse;
    onClose: () => void;
}

const ArticleDetail = ({ article, complex, onClose }: ArticleDetailProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        // window.kakao.maps를 any로 가져와 TS 타입 검사를 우회
        const maps: any = (window as any).kakao?.maps;
        if (!maps || !mapRef.current) return;

        try {
            const position = new maps.LatLng(article.latitude, article.longitude);

            const markerImage = new maps.MarkerImage(
                `data:image/svg+xml,${encodeURIComponent(`
                    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="30" cy="30" r="28" fill="${getTypeColor(article.buildingType)}" stroke="white" stroke-width="3"/>
                        <text x="30" y="38" font-size="28" text-anchor="middle" fill="white">
                            ${getTypeEmoji(article.buildingType)}
                        </text>
                    </svg>
                `)}`,
                new maps.Size(60, 60),
                { offset: new maps.Point(30, 30) }
            );

            const marker = new maps.Marker({
                position: position,
                image: markerImage,
                title: article.articleName
            });

            const mapOptions: any = {
                center: position,
                level: 3,
                draggable: false,
                scrollwheel: false,
                disableDoubleClickZoom: true,
                mapTypeControl: false,
                zoomControl: false
            };

            // 지도 초기화 함수
            const initMap = () => {
                if (!mapRef.current) return;
                
                // 이전 인스턴스 정리
                if (mapInstance.current) {
                    mapInstance.current = null;
                }
                
                try {
                    // 지도 생성
                    const map = new maps.Map(mapRef.current, mapOptions);
                    mapInstance.current = map;
                    marker.setMap(map);
                    
                    // 지도 크기 재설정
                    map.relayout();
                    
                    // 지도가 완전히 로드된 후 다시 한번 relayout 호출
                    setTimeout(() => {
                        if (map) {
                            map.relayout();
                            map.setCenter(position);
                        }
                    }, 300);
                    
                    // 크기 변경 감지
                    const resizeObserver = new ResizeObserver(() => {
                        if (map) {
                            map.relayout();
                            map.setCenter(position);
                        }
                    });
                    
                    resizeObserver.observe(mapRef.current);
                    
                    return () => {
                        marker.setMap(null);
                        resizeObserver.disconnect();
                    };
                } catch (err) {
                    console.error('맵 초기화 오류:', err);
                }
            };
            
            // 컴포넌트가 렌더링된 후 지도 초기화
            setTimeout(initMap, 100);
            
            // 500ms 후 다시 한번 실행하여 안정성 확보
            const secondAttempt = setTimeout(initMap, 500);
            
            return () => {
                clearTimeout(secondAttempt);
                if (mapInstance.current) {
                    marker.setMap(null);
                    mapInstance.current = null;
                }
            };
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }, [article]);

    const handleOpenMap = () => {
        if (article.latitude && article.longitude) {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(article.addressFullRoad || article.addressFullLot)}`, '_blank');
        }
    };

    return (
        <Box 
            sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                bgcolor: 'background.paper',
                overflow: 'auto'
            }}
        >
            {/* 헤더 부분 */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 24,
                                height: 24,
                                borderRadius: article.tradeType === "매매" ? '50%' : 
                                            article.tradeType === "전세" ? '4px' : '24%',
                                bgcolor: getTypeColor(article.buildingType),
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: 'white', 
                                    fontSize: '12px',
                                    lineHeight: 1
                                }}
                            >
                                {getTypeEmoji(article.buildingType)}
                            </Typography>
                        </Box>
                        <Typography variant="h6" component="div">
                            {article.articleName}
                        </Typography>
                    </Box>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* 컨텐츠 부분 */}
            <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
                <Grid container spacing={3}>
                    {/* 상단: 이미지 섹션, 가격 정보, 주소 섹션 (전체 너비) */}
                    <Grid item xs={12}>
                        <Grid container spacing={3}>
                            {/* 이미지 섹션 */}
                            <Grid item xs={12} md={5}>
                                <Card sx={{ height: '100%' }}>
                                    {article.imageUrl ? (
                                        <CardMedia
                                            component="img"
                                            height="300"
                                            image={article.imageUrl}
                                            alt={article.articleName}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                height: 300,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: 'grey.100'
                                            }}
                                        >
                                            <Typography color="text.secondary">
                                                이미지 없음
                                            </Typography>
                                        </Box>
                                    )}
                                </Card>
                            </Grid>

                            {/* 가격 정보, 주소 섹션 */}
                            <Grid item xs={12} md={7}>
                                <Stack spacing={2}>
                                    {/* 가격 정보 */}
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                                            {article.tradeType === "매매" ? "매매가" : "보증금"} {isZeroPrice(article.priceSale) ? "X" : formatPrice(article.priceSale)}
                                        </Typography>
                                        {(article.tradeType === "전세" || article.tradeType === "월세" || article.tradeType === "단기임대") && article.priceRent > 0 && (
                                            <Typography variant="h6" color="text.secondary">
                                                월세 {formatPrice(article.priceRent)}
                                            </Typography>
                                        )}
                                    </Paper>

                                    {/* 거래 유형 및 건물 유형 */}
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip
                                            label={article.tradeType}
                                            color={getTradeTypeColor(article.tradeType) as "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"}
                                            size="small"
                                        />
                                        <Chip
                                            label={article.buildingType}
                                            color="default"
                                            size="small"
                                        />
                                    </Box>

                                    {/* 주소 정보 */}
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            <LocationOnIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                            주소
                                        </Typography>
                                        <Typography variant="body1" paragraph>
                                            {article.addressFullRoad || article.addressFullLot}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<DirectionsIcon />}
                                            onClick={handleOpenMap}
                                            size="small"
                                        >
                                            지도에서 보기
                                        </Button>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* 중간 섹션: 2열 레이아웃 - 상세 정보 (왼쪽) / 매물 설명 + 중개사 정보 (오른쪽) */}
                    <Grid item xs={12}>
                        <Grid container spacing={3}>
                            {/* 왼쪽 열: 상세 정보 */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3, height: '100%' }}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        상세 정보
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                층수
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.floors || '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                방향
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.direction || '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                공급면적
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.areaSupply ? `${article.areaSupply}㎡` : '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                전용면적
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.areaExclusive ? `${article.areaExclusive}㎡` : '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                사용승인일
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.confirmedAt ? formatDate(article.confirmedAt) : '-'}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    {/* 단지 정보 */}
                                    {complex && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                <ApartmentIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                                단지 정보
                                            </Typography>
                                            <Paper sx={{ p: 2 }}>
                                                <Typography variant="body1" gutterBottom>
                                                    {complex.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {complex.type}
                                                </Typography>
                                                {complex.approvedAt && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        사용승인일: {complex.approvedAt}
                                                    </Typography>
                                                )}
                                            </Paper>
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>

                            {/* 오른쪽 열: 매물 설명 + 중개사 정보 */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3, height: '100%' }}>
                                    {/* 매물 설명 */}
                                    <Box mb={4}>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            매물 설명
                                        </Typography>
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                            {article.articleDesc || '등록된 매물 설명이 없습니다.'}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 3 }} />

                                    {/* 중개사 정보 */}
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            중개사 정보
                                        </Typography>
                                        <Typography variant="body1">
                                            {article.agency || '-'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {article.companyName || '-'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* 지도 섹션 */}
                    <Grid item xs={12}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                <LocationOnIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                위치
                            </Typography>
                            <Box 
                                ref={mapRef} 
                                sx={{ 
                                    width: '100%', 
                                    height: '300px', 
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        pointerEvents: 'none',
                                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                                    }
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* 푸터 부분 */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={onClose}>닫기</Button>
            </Box>
        </Box>
    );
};

export default ArticleDetail; 