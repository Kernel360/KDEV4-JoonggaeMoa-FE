import {Box, Chip} from '@mui/material';

import {getTradeTypeColor, getTypeColor} from '@/domain/article/utils/articleDisplay';

interface ArticleTypeBadgeProps {
    articleType: string;
    tradeType: string;
}

const ArticleTypeBadge = ({articleType, tradeType}: ArticleTypeBadgeProps) => {
    return (
        <Box sx={{display: 'flex', gap: 1}}>
            <Chip
                label={articleType}
                size="small"
                sx={{
                    bgcolor: getTypeColor(articleType),
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