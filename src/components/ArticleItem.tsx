import { Box, Paper, Typography } from "@mui/material";
import type { ArticleResponse } from "../types/article";
import ArticleImage from "./article/ArticleImage";
import ArticleTypeBadge from "./article/ArticleTypeBadge";
import ArticlePrice from "./article/ArticlePrice";

interface ArticleItemProps {
    article: ArticleResponse;
    isSelected: boolean;
    onClick: () => void;
}

const ArticleItem = ({ article, isSelected, onClick }: ArticleItemProps) => {
    return (
        <Paper 
            elevation={0}
            sx={{ 
                m: 2, 
                p: 2,
                cursor: "pointer",
                bgcolor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                }
            }}
            onClick={onClick}
        >
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box 
                    sx={{ 
                        width: 100, 
                        height: 100, 
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                        flexShrink: 0
                    }}
                >
                    <ArticleImage
                        imageUrl={article.imageUrl}
                        realEstateType={article.realEstateType}
                        name={article.name}
                    />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {article.buildingName || article.name}
                    </Typography>
                    <ArticleTypeBadge 
                        realEstateType={article.realEstateType} 
                        tradeType={article.tradeType} 
                    />
                    <Typography variant="body2" color="text.secondary">
                        {article.direction && `${article.direction}`}
                        {article.subwayInfo && ` · ${article.subwayInfo}`}
                    </Typography>
                    <ArticlePrice 
                        tradeType={article.tradeType} 
                        price={article.price} 
                        rentPrice={article.rentPrice}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {article.cortarName || "-"}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default ArticleItem; 