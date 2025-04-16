"use client"

import {
    AppBar,
    Box,
    Button,
    Chip,
    Drawer,
    FormControl,
    IconButton,
    InputLabel,
    List,
    MenuItem,
    Paper,
    Select,
    Toolbar,
    Typography
} from "@mui/material"
import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import ArticleDetail from "../components/ArticleDetail"
import MapView from '../components/map/MapView'
import { articleApi } from "../services/articleApi"
import { regionApi } from "../services/regionApi"
import type { ArticleResponse } from "../types/article"
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewMapIcon from '@mui/icons-material/Map';
import RegionSelector from '../components/region/RegionSelector'
import { Region, SelectedRegions } from '../utils/regions/regionUtils'

interface ArticleDetailProps {
    article: ArticleResponse;
    onClose: () => void;
    getTypeColor: (type: string) => string;
    getTypeEmoji: (type: string) => string;
    getTradeTypeColor: (type: string) => string;
    isZeroPrice: (price: number | string | null) => boolean;
    formatPrice: (price: number | string | null) => string;
    formatDate: (dateString: string) => string;
}

const ArticleItem = ({ 
    article, 
    isSelected, 
    onClick,
    getTypeColor,
    getTypeEmoji,
    getTradeTypeColor,
    isZeroPrice,
    formatPrice
}: { 
    article: ArticleResponse; 
    isSelected: boolean; 
    onClick: () => void;
    getTypeColor: (type: string) => string;
    getTypeEmoji: (type: string) => string;
    getTradeTypeColor: (type: string) => string;
    isZeroPrice: (price: number | string | null) => boolean;
    formatPrice: (price: number | string | null) => string;
}) => {
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
                        bgcolor: getTypeColor(article.realEstateType),
                        borderRadius: 1,
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontSize: '3rem', 
                            lineHeight: 1, 
                            color: 'white'
                        }}
                    >
                        {getTypeEmoji(article.realEstateType)}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                    <Typography 
                        variant="subtitle1" 
                        fontWeight="bold"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {article.cortarName ? `${article.cortarName} ${article.buildingName || article.name}` : article.buildingName || article.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={article.realEstateType}
                            size="small"
                            sx={{
                                bgcolor: getTypeColor(article.realEstateType),
                                color: "white",
                            }}
                        />
                        <Chip
                            label={article.tradeType}
                            size="small"
                            sx={{
                                bgcolor: getTradeTypeColor(article.tradeType),
                                color: "white",
                            }}
                        />
                    </Box>
                    <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {article.direction && `${article.direction}`}
                        {article.subwayInfo && ` · ${article.subwayInfo}`}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography 
                            variant="subtitle1" 
                            fontWeight="bold"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {article.tradeType === "매매" ? "매매가" : "보증금"} {isZeroPrice(article.price) ? "X" : formatPrice(article.price)}
                        </Typography>
                        {(article.tradeType === "전세" || article.tradeType === "월세" || article.tradeType === "단기임대") && article.rentPrice > 0 && (
                            <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                월세 {formatPrice(article.rentPrice)}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

const ArticleList = () => {
    const navigate = useNavigate()
    const [articles, setArticles] = useState<ArticleResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string[]>([])
    const [tradeTypeFilter, setTradeTypeFilter] = useState<string[]>([])
    const [minPrice, setMinPrice] = useState<string>("")
    const [maxPrice, setMaxPrice] = useState<string>("")
    const [selectedArticle, setSelectedArticle] = useState<ArticleResponse | null>(null)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const observerTarget = useRef<HTMLDivElement>(null)
    const [regions, setRegions] = useState<Region[]>([])
    const [selectedCity, setSelectedCity] = useState<string>("")
    const [selectedDistrict, setSelectedDistrict] = useState<string>("")
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string[]>([])
    const [locationSearch, setLocationSearch] = useState("")
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [drawerWidth] = useState(350)
    const [showMap, setShowMap] = useState(true)
    const [showList, setShowList] = useState(true)
    const [detailVisible, setDetailVisible] = useState(false)

    useEffect(() => {
        fetchArticles()
    }, [typeFilter, tradeTypeFilter, selectedNeighborhood])

    // Add intersection observer effect
    useEffect(() => {
        if (loading) return

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setPage(prev => {
                        const nextPage = prev + 1
                        fetchArticles(nextPage)
                        return nextPage
                    })
                }
            },
            { threshold: 1.0 }
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => {
            if (observer) {
                observer.disconnect()
            }
        }
    }, [loading, hasMore, isLoadingMore])

    // Modify fetchArticles to handle pagination and filtering
    const fetchArticles = async (pageNum: number = 0) => {
        try {
            if (pageNum === 0) {
                setLoading(true);
            } else {
                setIsLoadingMore(true);
            }
            
            const params: any = {
                page: pageNum,
                size: 20,
                sort: "id,desc"
            };
            
            // 이미 로드된 매물 ID를 제외하고 요청 (페이지 > 0인 경우)
            if (pageNum > 0 && articles.length > 0) {
                // 이미 로드된 매물 ID 목록을 백엔드에 전달하여 중복 방지
                const loadedIds = articles.map(article => article.id);
                if (loadedIds.length > 0) {
                    // exclude 파라미터를 추가하여 백엔드에서 해당 ID들을 제외
                    params.excludeIds = loadedIds;
                }
            }
            
            if (typeFilter.length > 0) {
                params.realEstateType = typeFilter;
            }
            
            if (tradeTypeFilter.length > 0) {
                params.tradeType = tradeTypeFilter;
            }
            
            if (searchTerm) {
                params.name = searchTerm;
            }
            
            // 지역 필터링 (cortarNo 기반)
            if (selectedCity) {
                let targetCortarNo: string | undefined;
                
                // 1. 동 수준 필터링
                if (selectedNeighborhood.length > 0) {
                    // 특정 동 선택 - 해당 동의 cortarNo 사용
                    const dongRegion = regions.find(r => 
                        r.cortarName === selectedNeighborhood[0] &&
                        r.cortarNo
                    );
                    
                    if (dongRegion && dongRegion.cortarNo) {
                        targetCortarNo = dongRegion.cortarNo;
                        console.log(`Using neighborhood level cortarNo: ${targetCortarNo}`);
                    }
                } 
                // 2. 구/군 수준 필터링 
                else if (selectedDistrict) {
                    // 구/군 선택 - 해당 구/군의 cortarNo 사용
                    const districtRegion = regions.find(r => 
                        r.cortarName === selectedDistrict &&
                        r.cortarNo
                    );
                    
                    if (districtRegion && districtRegion.cortarNo) {
                        targetCortarNo = districtRegion.cortarNo;
                        console.log(`Using district level cortarNo: ${targetCortarNo}`);
                    }
                } 
                // 3. 시/도 수준 필터링
                else {
                    // 시/도 선택 - 해당 시/도의 cortarNo 사용
                    const cityRegion = regions.find(r => 
                        r.cortarName === selectedCity &&
                        r.cortarNo
                    );
                    
                    if (cityRegion && cityRegion.cortarNo) {
                        targetCortarNo = cityRegion.cortarNo;
                        console.log(`Using city level cortarNo: ${targetCortarNo}`);
                    }
                }
                
                // 찾은 cortarNo로 필터링
                if (targetCortarNo) {
                    params.cortarNo = targetCortarNo;
                } 
                // cortarNo가 없으면 이름으로 필터링 (대안)
                else if (selectedNeighborhood.length > 0) {
                    params.cortarName = selectedNeighborhood[0];
                    console.log(`Falling back to cortarName filtering: ${selectedNeighborhood[0]}`);
                } else if (selectedDistrict) {
                    params.cortarName = selectedDistrict;
                    console.log(`Falling back to cortarName filtering: ${selectedDistrict}`);
                } else if (selectedCity) {
                    params.cortarName = selectedCity;
                    console.log(`Falling back to cortarName filtering: ${selectedCity}`);
                }
            }
            
            if (minPrice) {
                params.minPrice = convertKoreanPriceToNumber(minPrice);
            }
            
            if (maxPrice) {
                params.maxPrice = convertKoreanPriceToNumber(maxPrice);
            }
            
            const response = await articleApi.getAllArticles(params);
            console.log('API Response:', response.data);
            
            if (response.data.success && response.data.data) {
                const newArticles = response.data.data.content || [];
                console.log('Fetched articles:', newArticles);
                
                if (pageNum === 0) {
                    setArticles(newArticles);
                } else {
                    // 혹시 모를 중복을 한 번 더 클라이언트에서 필터링
                    setArticles(prev => {
                        // 현재 목록에 있는 매물의 ID 세트 생성
                        const existingIds = new Set(prev.map(article => article.id));
                        
                        // 새로 가져온 매물 중 기존 목록에 없는 것만 필터링
                        const uniqueNewArticles = newArticles.filter(
                            article => !existingIds.has(article.id)
                        );
                        
                        if (newArticles.length !== uniqueNewArticles.length) {
                            console.log(`Filtered out ${newArticles.length - uniqueNewArticles.length} duplicate articles`);
                        }
                        
                        // 중복이 제거된 새 매물만 기존 목록에 추가
                        return [...prev, ...uniqueNewArticles];
                    });
                }
                
                // 새로 가져온 항목이 없거나 마지막 페이지면 더 이상 로드하지 않음
                const noMoreData = newArticles.length === 0 || response.data.data.last;
                setHasMore(!noMoreData);
            } else {
                setError("매물 목록을 불러오는데 실패했습니다.");
            }
        } catch (err) {
            console.error("Error fetching articles:", err);
            setError("매물 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    }

    // Convert Korean price format to number
    const convertKoreanPriceToNumber = (priceStr: string): number => {
        // Remove all spaces and commas
        const cleanStr = priceStr.replace(/\s+/g, '').replace(/,/g, '')
        
        // Check if it contains "억"
        if (cleanStr.includes('억')) {
            const parts = cleanStr.split('억')
            const eok = parseInt(parts[0]) || 0
            
            // Check if there's a "만" part
            if (parts[1] && parts[1].includes('만')) {
                const man = parseInt(parts[1].replace('만', '')) || 0
                return eok * 10000 + man
            }
            
            return eok * 10000
        }
        
        // Check if it contains "만"
        if (cleanStr.includes('만')) {
            const man = parseInt(cleanStr.replace('만', '')) || 0
            return man
        }
        
        // If it's just a number, assume it's in "만원" unit
        const num = parseInt(cleanStr) || 0
        return num
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "아파트":
                return "#4CAF50" // Green for apartments
            case "오피스텔":
                return "#2196F3" // Blue for officetels
            case "빌라":
                return "#9C27B0" // Purple for villas
            case "아파트분양권":
                return "#FF9800" // Orange for apartment pre-sale rights
            case "오피스텔분양권":
                return "#00BCD4" // Cyan for officetel pre-sale rights
            case "재건축":
                return "#F44336" // Red for reconstruction
            case "전원주택":
                return "#8BC34A" // Light green for country houses
            case "단독/다가구":
                return "#673AB7" // Deep purple for single/multi-family houses
            case "상가주택":
                return "#E91E63" // Pink for commercial residential
            case "한옥주택":
                return "#795548" // Brown for hanok
            case "재개발":
                return "#FF5722" // Deep orange for redevelopment
            case "원룸":
                return "#03A9F4" // Light blue for one-room
            case "고시원":
                return "#9E9E9E" // Grey for goshiwon
            case "상가":
                return "#FFC107" // Amber for commercial
            case "사무실":
                return "#3F51B5" // Indigo for office
            case "공장/창고":
                return "#607D8B" // Blue grey for factory/warehouse
            case "건물":
                return "#009688" // Teal for building
            case "토지":
                return "#CDDC39" // Lime for land
            case "지식산업센터":
                return "#00BCD4" // Cyan for knowledge industry center
            default:
                return "#757575" // Gray for others
        }
    }

    const getTradeTypeColor = (type: string) => {
        switch (type) {
            case "매매":
                return "#E91E63" // Pink for sales
            case "전세":
                return "#2196F3" // Blue for jeonse
            case "월세":
                return "#4CAF50" // Green for monthly rent
            case "단기임대":
                return "#FF9800" // Orange for short-term rental
            default:
                return "#757575" // Gray for others
        }
    }

    const handleArticleClick = (article: ArticleResponse) => {
        // Toggle selection - if already selected, deselect it
        if (selectedArticle?.id === article.id) {
            setDetailVisible(false)
            // Wait for animation to complete before removing the article
            setTimeout(() => {
                setSelectedArticle(null)
            }, 300)
        } else {
            setSelectedArticle(article)
            // Show detail panel with a slight delay for smooth animation
            setTimeout(() => {
                setDetailVisible(true)
            }, 50)
        }
    }

    // Format price display
    const formatPrice = (price: number | string | null) => {
        if (price === null || price === undefined) return "-"
        
        // If price is a string, try to convert it to a number
        if (typeof price === 'string') {
            const numPrice = parseFloat(price);
            if (isNaN(numPrice)) return price; // Return original string if not a valid number
            price = numPrice;
        }
        
        // Format price in Korean style
        if (price < 10000) {
            // Less than 1억 (10,000만)
            return `${price}만원`;
        } else {
            // 1억 or more
            const eok = Math.floor(price / 10000);
            const man = price % 10000;
            
            if (man === 0) {
                return `${eok}억원`;
            } else {
                return `${eok}억 ${man}만원`;
            }
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "-"
        // Keep the original format if it's already in the desired format
        if (dateString.match(/^\d{2}\.\d{2}\.\d{2}\.$/)) {
            return dateString;
        }
        // Otherwise format it
        const date = new Date(dateString)
        return date.toLocaleDateString("ko-KR", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).replace(/년 /g, '년 ').replace(/월 /g, '월 ').replace(/일$/, '일');
    }

    // Check if price is zero
    const isZeroPrice = (price: number | string | null): boolean => {
        if (price === null || price === undefined) return false;
        if (typeof price === 'string') {
            return price === "0" || price === "0.0" || price === "0.00";
        }
        return price === 0;
    }

    const handleBack = () => {
        navigate(-1);
    }

    const handleSearch = () => {
        setPage(0);
        fetchArticles(0);
    }

    const handleTypeFilterChange = (e: any) => {
        const value = e.target.value as string[];
        setTypeFilter(value);
        setPage(0);
    }

    const handleTradeTypeFilterChange = (e: any) => {
        const value = e.target.value as string[];
        setTradeTypeFilter(value);
        setPage(0);
    }

    const handleCityChange = (value: string) => {
        console.log('ArticleList - City changing to:', value);
        setSelectedCity(value);
        
        // Reset district and neighborhood when city changes
        if (selectedDistrict) {
            console.log('Resetting district because city changed');
            setSelectedDistrict('');
        }
        
        if (selectedNeighborhood.length > 0) {
            console.log('Resetting neighborhood because city changed');
            setSelectedNeighborhood([]);
        }
    }

    const handleDistrictChange = (value: string) => {
        console.log('ArticleList - District changing to:', value);
        setSelectedDistrict(value);
        
        // Reset neighborhood when district changes
        if (selectedNeighborhood.length > 0) {
            console.log('Resetting neighborhood because district changed');
            setSelectedNeighborhood([]);
        }
    }

    const handleNeighborhoodChange = (value: string[]) => {
        setSelectedNeighborhood(value);
        setPage(0);
    }

    const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMinPrice(e.target.value);
    }

    const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMaxPrice(e.target.value);
    }

    const handlePriceFilter = () => {
        setPage(0);
        fetchArticles(0);
    }

    const handleLocationSearch = () => {
        setPage(0)
        fetchArticles(0)
    }

    useEffect(() => {
        // Fetch regions from regions API
        const fetchRegions = async () => {
            try {
                console.log('Fetching regions...');
                const response = await regionApi.getAllRegions()
                console.log('Regions API response:', response.data);
                
                if (response.data.success && response.data.data) {
                    const regionData = response.data.data;
                    console.log('Got region data length:', regionData.length);
                    
                    // Log a few sample region objects
                    if (regionData.length > 0) {
                        console.log('Sample region data:');
                        for (let i = 0; i < Math.min(3, regionData.length); i++) {
                            console.log(`Region ${i}:`, JSON.stringify(regionData[i], null, 2));
                        }
                    }
                    
                    // Check region structure
                    if (regionData.length > 0) {
                        console.log('Region object structure:', Object.keys(regionData[0]));
                        
                        // Check if areaFull property exists and has values
                        const withAreaFull = regionData.filter(r => r.areaFull).length;
                        console.log(`Regions with areaFull: ${withAreaFull}/${regionData.length}`);
                        
                        // Check if cortarType property exists and has values
                        const withCortarType = regionData.filter(r => r.cortarType).length;
                        console.log(`Regions with cortarType: ${withCortarType}/${regionData.length}`);
                    }
                    
                    // 디버깅: 데이터의 cortarType 값의 분포를 확인
                    const typeDistribution: { [key: string]: number } = {};
                    regionData.forEach((region: Region) => {
                        const type = region.cortarType || 'null';
                        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
                    });
                    console.log('Region cortarType distribution:', typeDistribution);
                    
                    setRegions(regionData);
                } else {
                    console.error('Failed to get region data:', response.data);
                }
            } catch (err) {
                console.error("Error fetching regions:", err)
            }
        }
        fetchRegions()
    }, [])

    const getTypeEmoji = (type: string) => {
        switch (type) {
            case "아파트":
                return "🏢"
            case "오피스텔":
                return "🏬"
            case "빌라":
            case "원룸":
            default:
                return "🏠"
            case "아파트분양권":
            case "오피스텔분양권": 
                return "📝"
            case "재건축":
            case "재개발":
                return "🏗️"
            case "전원주택":
            case "한옥주택":
                return "🏡"
            case "단독/다가구":
                return "🏘️"
            case "상가주택":
            case "상가":
                return "🏪"
            case "고시원":
            case "사무실":
            case "건물":
            case "지식산업센터":
                return "🏢"
            case "공장/창고":
                return "🏭"
            case "토지":
                return "🌳"
        }
    }

    // 시/도 목록을 필터링합니다.
    const filterCities = (regions: Region[]): string[] => {
        if (!regions || regions.length === 0) return [];
        
        console.log('Filtering cities using cortarNo pattern');
        
        // cortarNo 시도 패턴: 앞 2자리가 같고 나머지가 0으로 채워진 형태 (예: 1100000000)
        // 또는 앞 2자리만 추출하여 시도 코드 사용
        const citySet = new Set<string>();
        
        regions.forEach(region => {
            if (region.cortarNo && region.cortarNo.length === 10) {
                // 시도 코드만 추출 (앞 2자리)
                const cityCode = region.cortarNo.substring(0, 2);
                
                // 같은 시도 코드를 가진 region 중 한개만 추가
                const cityRegion = regions.find(r => 
                    r.cortarNo && r.cortarNo.startsWith(cityCode) && 
                    r.cortarName && !r.areaFull?.includes(' ')
                );
                
                if (cityRegion && cityRegion.cortarName) {
                    citySet.add(cityRegion.cortarName);
                } else if (region.areaFull) {
                    // 대안: areaFull에서 첫 부분 사용
                    const parts = region.areaFull.split(' ');
                    if (parts.length > 0) {
                        citySet.add(parts[0]);
                    }
                }
            }
        });
        
        const result = Array.from(citySet);
        console.log('Cities found:', result);
        return result;
    };

    // 구/군 목록을 필터링합니다.
    const filterDistricts = (regions: Region[], selectedCity: string): string[] => {
        if (!regions || regions.length === 0 || !selectedCity) return [];
        
        console.log('Filtering districts for city:', selectedCity);
        
        // 선택된 시의 cortarNo 패턴 찾기
        const cityRegion = regions.find(r => 
            r.cortarName === selectedCity || 
            (r.areaFull && r.areaFull.startsWith(selectedCity) && !r.areaFull.includes(' '))
        );
        
        if (!cityRegion || !cityRegion.cortarNo) {
            console.log('City region not found, falling back to text-based filtering');
            // 시 지역을 찾지 못하면 텍스트 기반 필터링으로 폴백
            const districtSet = new Set<string>();
            regions.forEach(region => {
                if (region.areaFull) {
                    const parts = region.areaFull.split(' ');
                    if (parts.length >= 2 && parts[0] === selectedCity) {
                        const district = parts[1];
                        if (district.endsWith('구') || district.endsWith('시') || district.endsWith('군')) {
                            districtSet.add(district);
                        }
                    }
                }
            });
            return Array.from(districtSet);
        }
        
        // 시도 코드 (앞 2자리)
        const cityCode = cityRegion.cortarNo.substring(0, 2);
        console.log('City code:', cityCode);
        
        // 구/군 패턴: 시도 코드 + 구군 코드 (3자리) + 나머지 0
        // 예: 서울시(11) + 강남구(680) + 000000 = 1168000000
        const districtSet = new Set<string>();
        
        // 시도 코드로 시작하고 5자리 이후가 000000인 지역 찾기
        const districtRegions = regions.filter(r => 
            r.cortarNo && 
            r.cortarNo.startsWith(cityCode) && 
            r.cortarNo.substring(5).endsWith('00000') &&
            r.cortarNo.substring(5, 8) !== '000' // 구/군 코드가 000이 아닌 경우
        );
        
        console.log('District regions found:', districtRegions.length);
        
        districtRegions.forEach(region => {
            if (region.cortarName) {
                districtSet.add(region.cortarName);
            } else if (region.areaFull) {
                const parts = region.areaFull.split(' ');
                if (parts.length >= 2 && parts[0] === selectedCity) {
                    districtSet.add(parts[1]);
                }
            }
        });
        
        // 결과가 없으면 대안 방법 사용
        if (districtSet.size === 0) {
            console.log('Using fallback method for districts');
            regions.forEach(region => {
                if (region.areaFull) {
                    const parts = region.areaFull.split(' ');
                    if (parts.length >= 2 && parts[0] === selectedCity) {
                        const district = parts[1];
                        if (district.endsWith('구') || district.endsWith('시') || district.endsWith('군')) {
                            districtSet.add(district);
                        }
                    }
                }
            });
        }
        
        const result = Array.from(districtSet);
        console.log('Districts found:', result);
        return result;
    };

    return (
        <Box sx={{ width: '100%', height: '82vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        부동산 매물
                    </Typography>
                    <IconButton color="inherit" onClick={() => setShowList(!showList)}>
                        {showList ? <ViewListIcon /> : <ViewMapIcon />}
                    </IconButton>
                    <IconButton color="inherit" onClick={() => setIsFilterDrawerOpen(true)}>
                        <FilterListIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            
            <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                {/* Map component */}
                {showMap && (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                        }}
                    >
                        <MapView
                            articles={articles}
                            selectedArticle={selectedArticle}
                            onArticleClick={handleArticleClick}
                            getTypeColor={getTypeColor}
                            getTypeEmoji={getTypeEmoji}
                            getTradeTypeColor={getTradeTypeColor}
                            formatPrice={formatPrice}
                            selectedRegions={{
                                city: selectedCity,
                                district: selectedDistrict,
                                neighborhoods: selectedNeighborhood
                            }}
                            allRegions={regions}
                        />
                    </Box>
                )}
                
                {/* Articles list */}
                <Box 
                    sx={{ 
                        width: `${drawerWidth}px`,
                        height: "100%",
                        overflowY: 'auto',
                        borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
                        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                        position: 'absolute',
                        left: showList ? 0 : -drawerWidth,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.1)',
                        transition: 'left 0.3s ease-in-out',
                        opacity: 0.9
                    }}
                >
                    <List>
                        {articles.map((article, index) => (
                            <ArticleItem 
                                key={`article-${article.id}-${index}`} 
                                article={article} 
                                isSelected={selectedArticle?.id === article.id}
                                onClick={() => handleArticleClick(article)}
                                getTypeColor={getTypeColor}
                                getTypeEmoji={getTypeEmoji}
                                getTradeTypeColor={getTradeTypeColor}
                                isZeroPrice={isZeroPrice}
                                formatPrice={formatPrice}
                            />
                        ))}
                        {(hasMore && !loading) && (
                            <div ref={observerTarget} style={{ height: '20px' }} />
                        )}
                    </List>
                </Box>

                {/* Article Detail */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: showList ? `${drawerWidth}px` : 0,
                        width: showList ? `calc(100% - ${drawerWidth}px)` : '100%',
                        bgcolor: 'background.paper',
                        zIndex: 2,
                        overflowY: 'auto',
                        transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out, left 0.3s ease-in-out',
                        transform: detailVisible ? 'translateX(0)' : 'translateX(-100%)',
                        boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.1)',
                        opacity: 0.97,
                        visibility: selectedArticle ? 'visible' : 'hidden'
                    }}
                >
                    {selectedArticle && (
                        <ArticleDetail
                            article={selectedArticle}
                            onClose={() => {
                                setDetailVisible(false)
                                setTimeout(() => {
                                    setSelectedArticle(null)
                                }, 300)
                            }}
                        />
                    )}
                </Box>
            </Box>
            
            {/* 필터 드로어 */}
            <Drawer
                anchor="right"
                open={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        padding: 2
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        필터
                    </Typography>
                    
                    <RegionSelector 
                        regions={regions}
                        selectedCity={selectedCity}
                        selectedDistrict={selectedDistrict}
                        selectedNeighborhood={selectedNeighborhood}
                        onCityChange={handleCityChange}
                        onDistrictChange={handleDistrictChange}
                        onNeighborhoodChange={handleNeighborhoodChange}
                    />
                    
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="property-type-label">매물 유형</InputLabel>
                        <Select
                            labelId="property-type-label"
                            id="property-type-select"
                            multiple
                            value={typeFilter}
                            onChange={handleTypeFilterChange}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} />
                                    ))}
                                </Box>
                            )}
                        >
                            {["아파트", "오피스텔", "빌라", "아파트분양권", "오피스텔분양권", "재건축", "전원주택", "단독/다가구", "상가주택", "한옥주택", "재개발", "원룸", "고시원", "상가", "사무실", "공장/창고", "건물", "토지", "지식산업센터"].map(type => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="trade-type-label">거래 유형</InputLabel>
                        <Select
                            labelId="trade-type-label"
                            id="trade-type-select"
                            multiple
                            value={tradeTypeFilter}
                            onChange={handleTradeTypeFilterChange}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} />
                                    ))}
                                </Box>
                            )}
                        >
                            {["매매", "전세", "월세", "단기임대"].map(type => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={() => {
                                setIsFilterDrawerOpen(false);
                                fetchArticles(0);
                            }}
                        >
                            필터 적용
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    )
}

export default ArticleList