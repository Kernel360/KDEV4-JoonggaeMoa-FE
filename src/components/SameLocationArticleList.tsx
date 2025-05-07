import { useState, useEffect } from 'react';
import { Box, List, Typography, IconButton, Paper, Slide, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArticleItem from './ArticleItem';
import type { ArticleResponse } from '../types/article';

interface SameLocationArticleListProps {
    articles: ArticleResponse[];
    isOpen: boolean;
    onClose: () => void;
    onArticleClick: (article: ArticleResponse) => void;
    selectedArticle: ArticleResponse | null;
    location: { lat: number, lng: number };
    isListHidden?: boolean;
}

const SameLocationArticleList = ({
    articles,
    isOpen,
    onClose,
    onArticleClick,
    selectedArticle,
    location,
    isListHidden = false
}: SameLocationArticleListProps) => {
    const [transition, setTransition] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (isOpen) {
            setTransition(true);
        } else {
            setTimeout(() => {
                setTransition(false);
            }, 300); // 트랜지션이 완료된 후 상태 업데이트
        }
    }, [isOpen]);

    if (!transition && !isOpen) return null;

    return (
        <Slide direction={isMobile ? "up" : "left"} in={isOpen} mountOnEnter unmountOnExit>
            <Paper
                elevation={3}
                sx={{
                    position: 'absolute',
                    ...(isMobile ? {
                        // 모바일에서의 스타일
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40%', // 화면의 40%로 높이 조정
                        width: '100%',
                        borderRadius: '16px 16px 0 0',
                        zIndex: 1300, // 기존 리스트 위에 표시되도록 z-index 증가
                        boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)',
                        transform: 'translate3d(0, 0, 0)', // 하드웨어 가속 활성화
                        ...(isListHidden && {
                            bottom: 0,
                            maxHeight: 'calc(50vh - 28px)'
                        })
                    } : {
                        // 데스크톱에서의 스타일
                        right: 0,
                        top: 0,
                        width: '300px',
                        height: '100%',
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        zIndex: 1000
                    }),
                    overflowY: 'auto',
                    bgcolor: 'background.paper'
                }}
            >
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: isMobile ? 1 : 2, // 모바일에서는 패딩 줄임
                    borderBottom: '1px solid', 
                    borderColor: 'divider',
                    ...(isMobile && {
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'background.paper',
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    })
                }}>
                    <Typography variant={isMobile ? "subtitle1" : "h6"}>
                        동일 위치 매물 ({articles.length}개)
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                
                <List sx={{ p: isMobile ? 1 : 2 }}>
                    {articles.map((article) => (
                        <ArticleItem
                            key={article.id}
                            article={article}
                            isSelected={selectedArticle?.id === article.id}
                            onClick={() => onArticleClick(article)}
                        />
                    ))}
                </List>
            </Paper>
        </Slide>
    );
};

export default SameLocationArticleList; 