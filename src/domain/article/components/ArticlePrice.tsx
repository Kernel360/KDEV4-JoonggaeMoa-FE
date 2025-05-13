import {Box, Typography} from '@mui/material';
import {formatPrice, isZeroPrice} from '@/domain/article/utils/articlePrice';

interface ArticlePriceProps {
    tradeType: string;
    priceSale: number;
    priceRent: number;
    priceRoomMin?: number;
    priceRoomMax?: number;
}

const ArticlePrice = ({tradeType, priceSale, priceRent, priceRoomMin, priceRoomMax}: ArticlePriceProps) => {
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
            {isZeroPrice(priceSale) ? (
                <Typography variant="subtitle1" fontWeight="bold">월세 {formatPrice(priceRent)}원</Typography>
            ) : (
                <>
                    {tradeType === "매매" ? (
                        <Typography variant="subtitle1" fontWeight="bold">
                            매매가 {formatPrice(priceSale)}원
                        </Typography>
                    ) : (
                        <>
                            <Typography variant="subtitle1" fontWeight="bold">
                                보증금 {formatPrice(priceSale)}원
                            </Typography>

                            {!isZeroPrice(priceRent) && (
                                <Typography variant="subtitle1" fontWeight="bold" color="error.main">
                                    월세 {formatPrice(priceRent)}원
                                </Typography>
                            )}
                        </>
                    )}
                </>
            )}
        </Box>
    );
};

export default ArticlePrice; 