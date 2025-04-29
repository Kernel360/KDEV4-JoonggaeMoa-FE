import { Box, Paper, Typography } from "@mui/material";
import type { ArticleResponse } from "../types/article";
import { getTypeColor, getTypeEmoji } from "../utils/articleUtils";
import ArticlePrice from "./ArticlePrice";

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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 24,
                            height: 24,
                            borderRadius: article.tradeType === "매매" ? '50%' : 
                                        article.tradeType === "전세" ? '4px' : '0',
                            bgcolor: getTypeColor(article.articleType),
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 0
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
                            {getTypeEmoji(article.articleType)}
                        </Typography>
                    </Box>
                    <Typography 
                        variant="subtitle1" 
                        fontWeight="bold"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                        }}
                    >
                        {article.cortarName ? `${article.cortarName} ${article.buildingName || article.articleName}` : article.buildingName || article.articleName}
                    </Typography>
                </Box>
                
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        whiteSpace: 'normal'
                    }}
                >
                    {article.district && `${article.district}`}{article.town && ` ${article.town}`} · {article.articleType}
                </Typography>
                
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        whiteSpace: 'normal'
                    }}
                >
                    {article.atclFetrDesc}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <ArticlePrice 
                        tradeType={article.tradeType}
                        priceSale={article.priceSale}
                        priceRent={article.priceRent}
                    />
                </Box>
            </Box>
        </Paper>
    );
};

export default ArticleItem; 