import { Box, Typography } from '@mui/material';
import { formatPrice, isZeroPrice } from '../../utils/articleUtils';

interface ArticlePriceProps {
    tradeType: string;
    price: string | number | null;
    rentPrice?: number;
}

const ArticlePrice = ({ tradeType, price, rentPrice }: ArticlePriceProps) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="subtitle1" fontWeight="bold">
                {tradeType === "매매" ? "매매가" : "보증금"} {isZeroPrice(price) ? "X" : formatPrice(price)}
            </Typography>
            {(tradeType === "전세" || tradeType === "월세" || tradeType === "단기임대") && rentPrice && rentPrice > 0 && (
                <Typography variant="body2" color="text.secondary">
                    월세 {formatPrice(rentPrice)}
                </Typography>
            )}
        </Box>
    );
};

export default ArticlePrice; 