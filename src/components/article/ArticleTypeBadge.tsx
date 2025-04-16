import { Box, Chip } from '@mui/material';
import { getTypeColor, getTradeTypeColor } from '../../utils/articleUtils';

interface ArticleTypeBadgeProps {
    realEstateType: string;
    tradeType: string;
}

const ArticleTypeBadge = ({ realEstateType, tradeType }: ArticleTypeBadgeProps) => {
    return (
        <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
                label={realEstateType}
                size="small"
                sx={{
                    bgcolor: getTypeColor(realEstateType),
                    color: "white",
                }}
            />
            <Chip
                label={tradeType}
                size="small"
                sx={{
                    bgcolor: getTradeTypeColor(tradeType),
                    color: "white",
                }}
            />
        </Box>
    );
};

export default ArticleTypeBadge; 