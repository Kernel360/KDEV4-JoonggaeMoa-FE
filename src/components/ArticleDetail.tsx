import { Box, IconButton, Paper, Typography } from "@mui/material";
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
        if (!mapRef.current || !article) return;

        // 좌표값 유효성 검사
        const lat = typeof article.latitude === 'number' ? article.latitude : parseFloat(article.latitude);
        const lng = typeof article.longitude === 'number' ? article.longitude : parseFloat(article.longitude);
        
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.error('Invalid coordinates:', article.latitude, article.longitude);
            return;
        }

        const markerPosition = new window.kakao.maps.LatLng(lat, lng);

        // 마커 이미지 생성
        const markerImage = new (window.kakao.maps as any).MarkerImage(
            `data:image/svg+xml,${encodeURIComponent(`
                <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="28" fill="${getTypeColor(article.realEstateType)}" stroke="white" stroke-width="3" />
                    <text x="30" y="38" font-size="28" text-anchor="middle" fill="white">
                        ${getTypeEmoji(article.realEstateType)}
                    </text>
                </svg>
            `)}`,
            new (window.kakao.maps as any).Size(60, 60),
            { offset: new (window.kakao.maps as any).Point(30, 30) }
        );

        const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            image: markerImage,
            title: article.name
        });

        // 지도 초기화
        const options = {
            center: markerPosition,
            level: 3
        };
        const map = new window.kakao.maps.Map(mapRef.current, options);
        mapInstance.current = map;

        marker.setMap(map);

        return () => {
            marker.setMap(null);
        };
    }, [article, getTypeColor, getTypeEmoji]);

    return (
        <Paper sx={{ m: 2, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                    {article.buildingName || article.name}
                </Typography>
                <IconButton size="small" onClick={onClose}>
                    <Close />
                </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                    width: '100%',
                    aspectRatio: '1/1',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 1,
                    bgcolor: 'grey.100'
                }}>
                    <ArticleImage
                        imageUrl={article.imageUrl}
                        realEstateType={article.realEstateType}
                        name={article.name}
                    />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>기본 정보</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>매물 유형:</Typography>
                                <ArticleTypeBadge 
                                    realEstateType={article.realEstateType} 
                                    tradeType={article.tradeType} 
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>가격:</Typography>
                                <ArticlePrice 
                                    tradeType={article.tradeType} 
                                    price={article.price} 
                                    rentPrice={article.rentPrice}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>등록일:</Typography>
                                <Typography variant="body2">{formatDate(article.confirmedAt)}</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>위치 정보</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>법정동:</Typography>
                                <Typography variant="body2">{article.cortarName || "-"}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ width: '80px', fontWeight: 'bold' }}>주소:</Typography>
                                <Typography variant="body2">
                                    {article.roadAddressName || article.lotAddressName || "-"}
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
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>중개사 정보</Typography>
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