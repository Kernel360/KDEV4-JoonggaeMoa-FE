import React, {useRef} from 'react';
import {Box} from '@mui/material';
import MapView from '@/domain/article/map/components/MapView';
import type {ArticleResponse, ClusterInfo} from '@/domain/article/types/article';
import {validateCoordinates} from '@/domain/article/utils/articleFormat';
import type {Region} from '@/domain/article/map/utils/regionUtils';

interface ArticleListMapProps {
    articles: ArticleResponse[];
    selectedArticle: ArticleResponse | null;
    selectedRegions: {
        city: string;
        district: string;
        neighborhoods: string[];
    };
    allRegions: Region[];
    initialCenter: { lat: number; lng: number };
    initialZoom: number;
    clusterMode: boolean;
    clusters: ClusterInfo[];
    onArticleClick: (article: ArticleResponse) => void;
    onClusterClick: (cluster: ClusterInfo) => void;
    onBoundsChanged: (bounds: {
        ne: { lat: number; lng: number };
        sw: { lat: number; lng: number }
    }, zoom: number) => void;
    mapRef?: React.RefObject<any>;
    isListHidden?: boolean;
}

const ArticleListMap: React.FC<ArticleListMapProps> = ({
                                                           articles,
                                                           selectedArticle,
                                                           selectedRegions,
                                                           allRegions,
                                                           initialCenter,
                                                           initialZoom,
                                                           clusterMode,
                                                           clusters,
                                                           onArticleClick,
                                                           onClusterClick,
                                                           onBoundsChanged,
                                                           mapRef,
                                                           isListHidden
                                                       }) => {
    // 유효한 좌표가 있는 매물만 필터링 (메모이제이션 적용)
    const validArticles = React.useMemo(() => {
        return articles.filter(article =>
            validateCoordinates(article.latitude, article.longitude)
        );
    }, [articles]);

    // 로컬 mapRef가 없는 경우 새로 생성
    const localMapRef = useRef<any>(null);
    // 실제로 사용할 mapRef (외부에서 전달된 것이 있으면 그것을 사용, 없으면 로컬 참조 사용)
    const effectiveMapRef = mapRef || localMapRef;

    return (
        <Box
            sx={{
                flexGrow: 1,
                height: "100%",
                position: "relative",
                overflow: "hidden",
                touchAction: "none",
                pointerEvents: "auto"
            }}
        >
            <MapView
                articles={validArticles}
                selectedArticle={selectedArticle}
                onArticleClick={onArticleClick}
                onClusterClick={onClusterClick}
                selectedRegions={selectedRegions}
                allRegions={allRegions}
                initialCenter={initialCenter}
                initialZoom={initialZoom}
                onBoundsChanged={onBoundsChanged}
                clusterMode={clusterMode}
                clusters={clusters}
                mapRef={effectiveMapRef}
                isListHidden={isListHidden}
            />
        </Box>
    );
};

export default ArticleListMap; 