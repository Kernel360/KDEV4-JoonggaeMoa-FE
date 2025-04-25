import { Box, IconButton, Paper, Typography, Chip } from "@mui/material";
import { Close } from "@mui/icons-material";
import type { ArticleResponse } from "../types/article";
import { formatDate, getTypeColor, getTypeEmoji } from "../utils/articleUtils";
import { useEffect, useRef } from "react";
import ArticleImage from "./article/ArticleImage";
import ArticleTypeBadge from "./article/ArticleTypeBadge";
import ArticlePrice from "./article/ArticlePrice";

interface ArticleDetailProps {
    article: ArticleResponse;
    onClose: () => void;
}

const ArticleDetail = ({ article, onClose }: ArticleDetailProps) => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        const markerPosition = new window.kakao.maps.LatLng(article.latitude, article.longitude);

        // 마커 이미지 생성
        const markerImage = new (window.kakao.maps as any).MarkerImage(
            `data:image/svg+xml,${encodeURIComponent(`
                <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="28" fill="${getTypeColor(article.articleType)}" stroke="white" stroke-width="3" />
                    <text x="30" y="38" font-size="28" text-anchor="middle" fill="white">
                        ${getTypeEmoji(article.articleType)}
                    </text>
                </svg>
            `)}`,
            new (window.kakao.maps as any).Size(60, 60),
            { offset: new (window.kakao.maps as any).Point(30, 30) }
        );

        const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            image: markerImage,
            title: article.articleName
        });

        // 지도 초기화
        const options = {
            center: markerPosition,
            level: 3,
            draggable: false,
            scrollwheel: false,
            disableDoubleClickZoom: true,
            mapTypeControl: false,
            zoomControl: false
        };
        const map = new window.kakao.maps.Map(mapRef.current, options);
        mapInstance.current = map;

        marker.setMap(map);

        return () => {
            marker.setMap(null);
        };
    }, [article]);

    return (
        <Paper sx={{ m: 2, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" fontWeight="bold">
                    {article.buildingName || article.articleName}
                </Typography>
                <IconButton size="small" onClick={onClose}>
                    <Close />
                </IconButton>
            </Box>
            
            {/* 지도 섹션 */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>위치</Typography>
                <Box 
                    ref={mapRef} 
                    sx={{ 
                        width: '100%', 
                        height: '200px', 
                        borderRadius: 1,
                        overflow: 'hidden'
                    }}
                />
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {/* 왼쪽: 이미지 */}
                <Box sx={{ 
                    width: { xs: '100%', md: '50%' },
                    height: { xs: 'auto', md: '400px' },
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 1,
                    bgcolor: 'grey.100',
                    flexShrink: 0
                }}>
                    <ArticleImage
                        imageUrl={article.imageUrl}
                        articleType={article.articleType}
                        name={article.articleName}
                    />
                </Box>
                
                {/* 오른쪽: 정보 컨테이너 */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    width: { xs: '100%', md: '50%' },
                    flex: 1
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>기본 정보</Typography>
                        {article.isChecked && (
                            <Chip 
                                label="실매물 확인 완료" 
                                color="error" 
                                variant="outlined" 
                                sx={{ 
                                    borderRadius: 1, 
                                    fontWeight: 'bold',
                                    height: 28
                                }} 
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>매물 유형:</Typography>
                            <ArticleTypeBadge 
                                articleType={article.articleType} 
                                tradeType={article.tradeType} 
                            />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>가격:</Typography>
                            <ArticlePrice 
                                tradeType={article.tradeType} 
                                priceSale={article.priceSale} 
                                priceRent={article.priceRent}
                                priceRoomMin={article.priceRoomMin}
                                priceRoomMax={article.priceRoomMax}
                            />
                        </Box>
                        {article.floors && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>층수:</Typography>
                                <Typography variant="body2">{article.floors}</Typography>
                            </Box>
                        )}
                        {article.areaExclusive && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>전용면적:</Typography>
                                <Typography variant="body2">{article.areaExclusive}㎡</Typography>
                            </Box>
                        )}
                        {article.areaSupply && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>공급면적:</Typography>
                                <Typography variant="body2">{article.areaSupply}㎡</Typography>
                            </Box>
                        )}
                        {article.articleType === '고시원' && article.emptyRoomCount !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>빈방 수:</Typography>
                                <Typography variant="body2">{article.emptyRoomCount}개</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>등록일:</Typography>
                            <Typography variant="body2">{formatDate(article.confirmedAt)}</Typography>
                        </Box>
                    </Box>

                    {(article.articleDescRoom || article.articleDescMw) && (
                        <Box>
                            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>매물 설명</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {article.articleDescRoom && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="body2" fontWeight="bold">기본 정보</Typography>
                                        <Typography variant="body2">{article.articleDescRoom}</Typography>
                                    </Box>
                                )}
                                {article.articleDescMw && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="body2" fontWeight="bold">특징</Typography>
                                        <Typography variant="body2">{article.articleDescMw}</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                    <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>위치 정보</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>법정동:</Typography>
                                <Typography variant="body2">{article.cortarName || "-"}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>주소:</Typography>
                                <Typography variant="body2">
                                    {article.roadAddress || article.lotAddress || "-"}
                                </Typography>
                            </Box>
                            {article.direction && article.direction !== "" && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>방향:</Typography>
                                    <Typography variant="body2">{article.direction}</Typography>
                                </Box>
                            )}
                            {article.subwayInfo && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>지하철:</Typography>
                                    <Typography variant="body2">{article.subwayInfo}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>중개사 정보</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>정보 제공:</Typography>
                                <Typography variant="body2">{article.companyName ? `${article.companyName} 제공` : "-"}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>담당:</Typography>
                                <Typography variant="body2">{article.agentName || "-"}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

export default ArticleDetail; 