import {Box, CircularProgress, List, Typography} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";

import ArticleItem from "@/domain/article/components/ArticleItem";
import type {ArticleResponse} from "@/domain/article/types/article";

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
    const loadMoreRef = useRef<HTMLLIElement>(null);
    const isLoadingRef = useRef(isLoadingMore);
    const hasMoreRef = useRef(hasMore);
    const loadMoreTimerRef = useRef<NodeJS.Timeout | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const lastIntersectionTimeRef = useRef<number>(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // 타이머와 락 초기화 함수
    const clearLoadMoreTimer = useCallback(() => {
        if (loadMoreTimerRef.current) {
            clearTimeout(loadMoreTimerRef.current);
            loadMoreTimerRef.current = null;
        }
    }, []);
    
    // Observer 해제 함수
    const clearObserver = useCallback(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
            console.log("[ArticleListView] Observer 해제");
        }
    }, []);
    
    // 디바운스된 onLoadMore 호출 함수
    const debouncedLoadMore = useCallback(() => {
        // 현재 시간 체크
        const now = Date.now();
        
        // 마지막 인터섹션으로부터 1초 이내면 무시
        if (now - lastIntersectionTimeRef.current < 1000) {
            console.log("[ArticleListView] 인터섹션 너무 빠름, 무시됨");
            return;
        }
        
        // 마지막 인터섹션 시간 업데이트
        lastIntersectionTimeRef.current = now;
        
        // 락이 걸려있거나 로딩 중이거나 더 불러올 데이터가 없으면 무시
        if (isLocked || isLoadingRef.current || !hasMoreRef.current) {
            console.log("[ArticleListView] 요청 무시:", { isLocked, isLoading: isLoadingRef.current, hasMore: hasMoreRef.current });
            return;
        }
        
        clearLoadMoreTimer();
        
        // 락 걸기 - 중복 호출 방지
        setIsLocked(true);
        
        // 800ms 타이머 설정하여 디바운스 적용
        loadMoreTimerRef.current = setTimeout(() => {
            console.log("[ArticleListView] 디바운스 후 onLoadMore 호출");
            onLoadMore();
            
            // 5초 후에 락 해제 (API 호출에 충분한 시간 부여)
            setTimeout(() => {
                console.log("[ArticleListView] 락 해제");
                setIsLocked(false);
            }, 5000);
        }, 800);
    }, [clearLoadMoreTimer, onLoadMore, isLocked]);

    // isLoadingMore와 hasMore 값이 변경될 때마다 참조 업데이트
    useEffect(() => {
        isLoadingRef.current = isLoadingMore;
        hasMoreRef.current = hasMore;
        
        // hasMore가 false로 변경되면 락도 해제
        if (!hasMore && isLocked) {
            setIsLocked(false);
        }
    }, [isLoadingMore, hasMore, isLocked]);

    // Intersection Observer 설정
    useEffect(() => {
        // 기존 Observer 정리
        clearObserver();
        
        // 로딩 중이거나 더 불러올 데이터가 없거나 락이 걸려있으면 Observer 생성 중단
        if (isLoadingMore || !hasMore || isLocked) {
            console.log("[ArticleListView] Observer 생성 중단:", { isLoadingMore, hasMore, isLocked });
            return;
        }

        console.log("[ArticleListView] 무한 스크롤 Observer 생성");
        
        // 새 Observer 생성
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingRef.current && !isLocked) {
                    console.log("[ArticleListView] 마지막 아이템 교차됨, loadMore 호출 예정");
                    debouncedLoadMore();
                }
            },
            {
                threshold: 0.1, // 10%만 보여도 발동 (로딩 더 빠르게 시작)
                rootMargin: '0px 0px 300px 0px', // 아래쪽에 300px의 여백을 두어 미리 로드
                root: scrollContainerRef.current // 스크롤 컨테이너 지정
            }
        );

        // loadMoreRef 요소가 있을 때만 관찰 시작
        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
            console.log("[ArticleListView] Observer가 마지막 요소 감시 중");
        } else {
            console.warn("[ArticleListView] 관찰할 요소가 없음");
        }

        // 컴포넌트 언마운트 또는 의존성 변경 시 정리
        return () => {
            clearLoadMoreTimer();
            clearObserver();
        };
    }, [hasMore, isLoadingMore, debouncedLoadMore, clearLoadMoreTimer, clearObserver, isLocked]);

    // articles 배열이 변경될 때 Observer 다시 초기화
    useEffect(() => {
        // articles가 변경되면 Observer를 재설정하기 위해 기존 Observer 해제
        clearObserver();
        
        // articles 변경 시 Observer 재연결 (약간 지연시켜 UI 렌더링 완료 후 적용)
        const timer = setTimeout(() => {
            if (loadMoreRef.current && observerRef.current && !isLoadingMore && hasMore && !isLocked) {
                console.log("[ArticleListView] articles 변경으로 Observer 재연결");
                observerRef.current.observe(loadMoreRef.current);
            }
        }, 500);
        
        return () => clearTimeout(timer);
    }, [articles, clearObserver, hasMore, isLoadingMore, isLocked]);
    
    // articles의 길이가 바뀌었을 때 락 상태 확인
    useEffect(() => {
        // articles 길이가 변경되고 isLoadingMore가 false가 되면 5초 후 락 해제
        if (!isLoadingMore && isLocked) {
            const timer = setTimeout(() => {
                setIsLocked(false);
                console.log("[ArticleListView] articles 길이 변경으로 인한 락 해제");
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [articles.length, isLoadingMore, isLocked]);

    return (
        <Box
            ref={scrollContainerRef}
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
                                {/* 마지막 아이템일 때만 loadMoreRef 적용 */}
                                {index === articles.length - 1 && hasMore && !isLocked && !isLoadingMore && (
                                    <li ref={loadMoreRef} style={{
                                        height: 20, 
                                        margin: 0, 
                                        padding: 0
                                    }} />
                                )}
                            </React.Fragment>
                        ))}
                    </>
                )}

                {isLoadingMore && (
                    <Box sx={{
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        py: 3,
                        height: 60,
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        borderRadius: 1
                    }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                            더 많은 매물 로딩 중...
                        </Typography>
                    </Box>
                )}
            </List>
        </Box>
    );
};

export default ArticleListView; 