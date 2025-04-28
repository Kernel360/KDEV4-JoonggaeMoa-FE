import { Box, Typography } from '@mui/material';
import { formatPrice, isZeroPrice } from '../../utils/articleUtils';

interface ArticlePriceProps {
    tradeType: string;
    priceSale: number;
    priceRent: number;
    priceRoomMin?: number;
    priceRoomMax?: number;
}

const ArticlePrice = ({ tradeType, priceSale, priceRent, priceRoomMin, priceRoomMax }: ArticlePriceProps) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {tradeType === "단기임대" ? (
                <Typography variant="subtitle1" fontWeight="bold">
                    {priceRoomMin && priceRoomMax 
                        ? `단기임대 ${formatPrice(priceRoomMin)}원 ~ ${formatPrice(priceRoomMax)}원` 
                        : `단기임대 가격 정보 없음`}
                </Typography>
            ) : isZeroPrice(priceSale) ? (
                <Typography variant="subtitle1" fontWeight="bold">월세 {formatPrice(priceRent)}</Typography>
            ) : (
                <>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {tradeType === "매매" ? `매매가 ${formatPrice(priceSale)}원` : `보증금 ${formatPrice(priceSale)}원 / 월세 ${formatPrice(priceRent)}원`}
                    </Typography>
                </>
            )}
        </Box>
    );
};

export default ArticlePrice; 