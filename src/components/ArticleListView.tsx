import {Box, CircularProgress, List, Typography} from "@mui/material";
import React from "react";
import type {ArticleResponse} from "../types/article";
import ArticleItem from "./ArticleItem";

interface ArticleListViewProps {
    articles: ArticleResponse[];
    selectedArticle: ArticleResponse | null;
    isLoadingMore: boolean;
    hasMore: boolean;
    onArticleClick: (article: ArticleResponse) => void;
    onLoadMore: () => void;
    isClusterView?: boolean; // 클러스터 뷰인지 여부
}

const ArticleListView: React.FC<ArticleListViewProps> = ({
                                                             articles,
                                                             selectedArticle,
                                                             isLoadingMore,
                                                             hasMore,
                                                             onArticleClick,
                                                             onLoadMore,
                                                             isClusterView = false
                                                         }) => {
    const loadMoreRef = React.useRef<HTMLLIElement>(null);

    React.useEffect(() => {
        if (!hasMore || isLoadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onLoadMore();
                }
            },
            {threshold: 1.0}
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, onLoadMore]);

    return (
        <Box
            sx={{
                height: "100%",
                overflow: "auto",
                bgcolor: "background.default"
            }}
        >
            <List sx={{p: 2}}>
                {articles.length === 0 ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8
                    }}>
                        <Typography variant="body1" sx={{color: 'text.secondary', mb: 1}}>
                            {isClusterView
                                ? '해당 지역에 매물이 없습니다.'
                                : '표시할 매물이 없습니다.'}
                        </Typography>
                        <Typography variant="body2" sx={{color: 'text.disabled'}}>
                            {isClusterView
                                ? '다른 지역으로 이동해보세요.'
                                : '원을 클릭하거나 필터 조건을 변경해보세요.'}
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {articles.map((article, index) => (
                            <React.Fragment key={`article-${article.id}-${index}`}>
                                <ArticleItem
                                    article={article}
                                    isSelected={selectedArticle?.id === article.id}
                                    onClick={() => onArticleClick(article)}
                                />
                                {index === articles.length - 1 && (
                                    <li ref={loadMoreRef} style={{height: 1}}/>
                                )}
                            </React.Fragment>
                        ))}
                    </>
                )}

                {isLoadingMore && (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 2}}>
                        <CircularProgress size={24}/>
                    </Box>
                )}
            </List>
        </Box>
    );
};

export default ArticleListView; 