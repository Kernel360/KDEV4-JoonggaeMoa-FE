import {Box, Paper, Typography} from "@mui/material";
import type {ArticleResponse} from "../types/article";
import {getTypeColor, getTypeEmoji} from "../utils/articleDisplay";
import ArticlePrice from "./ArticlePrice";

interface ArticleItemProps {
    article: ArticleResponse;
    isSelected: boolean;
    onClick: () => void;
}

// 색상의 채도를 낮추는 함수
const desaturateColor = (color: string, factor: number = 0.9): string => {
    // hex 색상을 파싱
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 채도를 낮추기 위해 흰색을 혼합
    const newR = Math.floor(r + (255 - r) * factor);
    const newG = Math.floor(g + (255 - g) * factor);
    const newB = Math.floor(b + (255 - b) * factor);

    // RGB를 16진수로 변환하여 반환
    return `rgba(${newR}, ${newG}, ${newB}, 0.15)`;
};

// 제곱미터를 평으로 변환하는 함수
const sqMeterToPyeong = (sqMeter: string | number): string => {
    if (!sqMeter) return '';

    // 문자열을 숫자로 변환
    const numValue = typeof sqMeter === 'string' ? parseFloat(sqMeter) : sqMeter;

    // 평으로 변환 (1평 = 약 3.3058㎡)
    const pyeong = numValue / 3.3058;

    // 정수로 반올림하여 표시
    return `${Math.round(pyeong)}평`;
};

const ArticleItem = ({article, isSelected, onClick}: ArticleItemProps) => {
    const typeColor = getTypeColor(article.articleType || article.buildingType);
    const backgroundColor = desaturateColor(typeColor);

    return (
        <Paper
            elevation={0}
            sx={{
                m: 2,
                p: 2,
                cursor: "pointer",
                bgcolor: isSelected ? 'rgba(0, 0, 0, 0.04)' : backgroundColor,
                '&:hover': {
                    bgcolor: isSelected ? 'rgba(0, 0, 0, 0.08)' : desaturateColor(typeColor, 0.85)
                },
                borderLeft: `3px solid ${typeColor}`,
                transition: 'all 0.2s ease-in-out'
            }}
            onClick={onClick}
        >
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0}}>
                <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            // iOS 앱 아이콘 스타일의 border-radius 적용
                            borderRadius: '6px',
                            bgcolor: typeColor,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 0,
                            // 그림자 효과 추가
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            // 약간의 그라데이션 효과 추가
                            background: `linear-gradient(135deg, ${typeColor} 0%, ${typeColor}cc 100%)`,
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'white',
                                fontSize: '14px',
                                lineHeight: 1,
                                fontWeight: 'bold',
                                textShadow: '0 1px 1px rgba(0,0,0,0.2)'
                            }}
                        >
                            {getTypeEmoji(article.articleType || article.buildingType)}
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
                    {[
                        article.district && `${article.district}`,
                        article.town && `${article.town}`,
                        article.buildingType || article.articleType,
                        article.floors && `${article.floors}층`,
                        // 제곱미터를 평으로 변환하여 표시
                        article.areaExclusive && sqMeterToPyeong(article.areaExclusive)
                    ].filter(Boolean).join(' · ')}
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
                    {article.atclFetrDesc || article.articleDesc || (article.subway && `지하철: ${article.subway}`)}
                </Typography>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 0.5}}>
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