import ApartmentIcon from '@mui/icons-material/Apartment';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsIcon from '@mui/icons-material/Directions';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
    Box,
    Button,
    Card,
    CardMedia,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography
} from '@mui/material';
import {useEffect, useRef, useState} from 'react';
import {ArticleResponse, ComplexResponse} from '@/domain/article/types/article';
import {getTypeColor, getTypeEmoji} from '@/domain/article/utils/articleDisplay';
import {formatDate} from '@/domain/article/utils/articleFormat';
import {formatPrice, isZeroPrice} from '@/domain/article/utils/articlePrice';
import ArticleTypeBadge from '@/domain/article/components/ArticleTypeBadge';

interface ArticleDetailProps {
    article: ArticleResponse | null;
    complex?: ComplexResponse | null;
    onClose: () => void;
}

const ArticleDetail = ({article, onClose}: ArticleDetailProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [showAnimation, setShowAnimation] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        // article이 있으면 애니메이션 시작
        if (article) {
            setIsClosing(false);
            setShowAnimation(true);
        } else {
            setShowAnimation(false);
        }
    }, [article]);

    const handleClose = () => {
        // 닫기 애니메이션 시작
        setIsClosing(true);

        // 애니메이션 완료 후 onClose 호출
        setTimeout(() => {
            onClose();
        }, 500);
    };

    useEffect(() => {
        if (!article) return;

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
                {offset: new maps.Point(30, 30)}
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
                zoomControl: false,
                scaleControl: false
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

                    // 스케일 컨트롤 비활성화 (줌 레벨 표시 제거)
                    if (maps.ScaleControl) {
                        const scaleControl = map.getScaleControl();
                        if (scaleControl) {
                            scaleControl.setMap(null);
                        }
                    }

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
        if (!article) return;
        if (article.latitude && article.longitude) {
            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(article.addressFullRoad || article.addressFullLot)}`, '_blank');
        }
    };

    // 단지 정보 컴포넌트 추가
    const ComplexInfoSection = ({complex}: { complex: ComplexResponse }) => {
        return (
            <Paper elevation={0} sx={{p: 2, border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 2, mb: 3}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <ApartmentIcon/> 단지 정보
                </Typography>

                <TableContainer component={Box} sx={{mt: 2}}>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell component="th"
                                           sx={{width: '40%', borderBottom: 'none', py: 1}}>단지명</TableCell>
                                <TableCell sx={{borderBottom: 'none', py: 1}}>{complex.complexName}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" sx={{width: '40%', borderBottom: 'none', py: 1}}>총 동
                                    수</TableCell>
                                <TableCell sx={{borderBottom: 'none', py: 1}}>{complex.countDong}동</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" sx={{borderBottom: 'none', py: 1}}>총 세대 수</TableCell>
                                <TableCell sx={{borderBottom: 'none', py: 1}}>{complex.countHousehold}세대</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" sx={{borderBottom: 'none', py: 1}}>사용 승인일</TableCell>
                                <TableCell
                                    sx={{borderBottom: 'none', py: 1}}>{formatDate(complex.confirmedAt)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" sx={{borderBottom: 'none', py: 1}}>면적 범위</TableCell>
                                <TableCell sx={{borderBottom: 'none', py: 1}}>{complex.sizeMin}㎡
                                    ~ {complex.sizeMax}㎡</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" sx={{borderBottom: 'none', py: 1}}>총 엘리베이터 수</TableCell>
                                <TableCell sx={{borderBottom: 'none', py: 1}}>{complex.countElevator}대</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" sx={{borderBottom: 'none', py: 1}}>내진 설계 여부</TableCell>
                                <TableCell
                                    sx={{borderBottom: 'none', py: 1}}>{complex.isSeismic ? '적용' : '미적용'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" sx={{borderBottom: 'none', py: 1}}>현재 매물 현황</TableCell>
                                <TableCell sx={{borderBottom: 'none', py: 1}}>
                                    매매 {complex.countDeal}건, 전세 {complex.countLease}건, 월세 {complex.countRent}건
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        );
    };

    if (!article) return null;

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                overflow: 'auto',
                opacity: isClosing ? 0 : showAnimation ? 1 : 0,
                position: 'fixed',
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
                zIndex: 1000,
                transform: isClosing ? 'translateX(100%)' : showAnimation ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
                boxShadow: '-5px 0 15px rgba(0, 0, 0, 0.1)'
            }}
        >
            {/* 헤더 부분 */}
            <Box sx={{p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)'}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
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
                        onClick={handleClose}
                        sx={{
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon/>
                    </IconButton>
                </Box>
            </Box>
            {/* 컨텐츠 부분 */}
            <Box sx={{p: 3, flexGrow: 1, overflow: 'auto'}}>
                <Grid container spacing={3}>
                    {/* 상단: 이미지 섹션, 가격 정보, 주소 섹션 (전체 너비) */}
                    <Grid size={12}>
                        <Grid container spacing={3}>
                            {/* 이미지 섹션 */}
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 5
                                }}>
                                <Card sx={{height: '100%'}}>
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
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 7
                                }}>
                                <Stack spacing={2}>
                                    {/* 가격 정보 */}
                                    <Paper sx={{p: 2}}>
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
                                    <Box sx={{display: 'flex', gap: 1}}>
                                        <ArticleTypeBadge
                                            articleType={article.buildingType}
                                            tradeType={article.tradeType}
                                        />
                                    </Box>

                                    {/* 주소 정보 */}
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            <LocationOnIcon sx={{verticalAlign: 'middle', mr: 0.5}}/>
                                            주소
                                        </Typography>
                                        <Typography variant="body1">
                                            {article.addressFullRoad || article.addressFullLot}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<DirectionsIcon/>}
                                            endIcon={<OpenInNewIcon/>}
                                            onClick={handleOpenMap}
                                            size="small"
                                        >
                                            네이버 지도
                                        </Button>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* 중간 섹션: 2열 레이아웃 - 상세 정보 (왼쪽) / 매물 설명 + 중개사 정보 (오른쪽) */}
                    <Grid size={12}>
                        <Grid container spacing={3}>
                            {/* 왼쪽 열: 상세 정보 */}
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                                <Paper sx={{p: 3, height: '100%'}}>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        상세 정보
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                층수
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.floors || '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                방향
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.direction || '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                공급면적
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.areaSupply ? `${article.areaSupply}㎡` : '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                전용면적
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.areaExclusive ? `${article.areaExclusive}㎡` : '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                사용승인일
                                            </Typography>
                                            <Typography variant="body1">
                                                {article.confirmedAt ? formatDate(article.confirmedAt) : '-'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* 오른쪽 열: 매물 설명 + 중개사 정보 */}
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6
                                }}>
                                <Paper sx={{p: 3, height: '100%'}}>
                                    {/* 매물 설명 */}
                                    <Box mb={4}>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            매물 설명
                                        </Typography>
                                        <Typography variant="body1" sx={{whiteSpace: 'pre-line'}}>
                                            {article.articleDesc || '등록된 매물 설명이 없습니다.'}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{my: 3}}/>

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
                    <Grid size={12}>
                        <Box sx={{mb: 2}}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                <LocationOnIcon sx={{verticalAlign: 'middle', mr: 0.5}}/>
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

                    {/* 아파트 단지 정보 추가 (아파트인 경우만) */}
                    {article.buildingType === '아파트' && article.complexResponse && (
                        <Grid size={12}>
                            <ComplexInfoSection complex={article.complexResponse}/>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Box>
    );
};

export default ArticleDetail; 