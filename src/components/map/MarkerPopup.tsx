import { Box, Typography } from '@mui/material';
import type { ArticleResponse } from '../../types/article';

interface MarkerPopupProps {
    article: ArticleResponse;
    getTypeColor: (type: string) => string;
    getTypeEmoji: (type: string) => string;
    getTradeTypeColor: (type: string) => string;
    formatPrice: (price: number | string | null) => string;
}

const MarkerPopup = ({
    article,
    getTypeColor,
    getTypeEmoji,
    getTradeTypeColor,
    formatPrice
}: MarkerPopupProps) => {
    // 좌표값 유효성 검사
    const lat = typeof article.latitude === 'number' ? article.latitude : parseFloat(article.latitude);
    const lng = typeof article.longitude === 'number' ? article.longitude : parseFloat(article.longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('Invalid coordinates:', article.latitude, article.longitude);
        return null;
    }

    return (
        <Box
            sx={{
                bgcolor: 'white',
                borderRadius: 1,
                p: 1,
                boxShadow: 1,
                minWidth: 200,
                maxWidth: 300
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                    sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: getTypeColor(article.realEstateType),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Typography variant="body2" sx={{ color: 'white' }}>
                        {getTypeEmoji(article.realEstateType)}
                    </Typography>
                </Box>
                <Typography variant="subtitle2" fontWeight="bold">
                    {article.name}
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
                {article.tradeType === "매매" ? "매매가" : "보증금"} {formatPrice(article.price)}
            </Typography>
            {article.tradeType === "월세" && article.rentPrice > 0 && (
                <Typography variant="body2" color="text.secondary">
                    월세 {formatPrice(article.rentPrice)}
                </Typography>
            )}
        </Box>
    );
};

export default MarkerPopup; 