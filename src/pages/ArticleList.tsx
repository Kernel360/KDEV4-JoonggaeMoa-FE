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
    Typography,
    TextField,
    InputAdornment,
    Popover
} from "@mui/material"
import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import ArticleDetail from "../components/ArticleDetail"
import MapView from '../components/MapView'
import { articleApi } from "../services/articleApi"
import { regionApi } from "../services/regionApi"
import type { ArticleResponse, ComplexResponse } from "../types/article"
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewMapIcon from '@mui/icons-material/Map';
import RegionSelector from '../components/RegionSelector'
import { Region, SelectedRegions } from '../utils/regionUtils'
import { getCityOptions, getDistrictOptions, getNeighborhoodOptions, KOREA_REGIONS } from '../utils/regionData'
import { formatDate, formatPrice, getTradeTypeColor, getTypeColor, getTypeEmoji, isZeroPrice, convertKoreanPriceToNumber } from '../utils/articleUtils'
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface ArticleDetailProps {
    article: ArticleResponse;
    complex?: ComplexResponse;
    onClose: () => void;
}

const ArticleItem = ({ 
    article, 
    isSelected, 
    onClick
}: { 
    article: ArticleResponse; 
    isSelected: boolean; 
    onClick: () => void;
}) => {
    return (
        <Paper 
            elevation={0}
            sx={{ 
                m: 2, 
                p: 2,
                cursor: "pointer",
                bgcolor: isSelected ? 'rgba(0, 0, 0, 0.04)' : `${getTypeColor(article.buildingType)}10`,
                '&:hover': {
                    bgcolor: `${getTypeColor(article.buildingType)}15`
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
                                        article.tradeType === "전세" ? '4px' : '24%',
                            bgcolor: getTypeColor(article.buildingType),
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            filter: 'brightness(1.1)',
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: article.tradeType === "매매" ? '50%' : 
                                            article.tradeType === "전세" ? '4px' : '24%',
                                background: 'rgba(255, 255, 255, 0.2)',
                                pointerEvents: 'none'
                            }
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
                            {getTypeEmoji(article.buildingType)}
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
                        {article.articleName}
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
                    {article.address1SiDo && `${article.address1SiDo}`}
                    {article.address2SiGunGu && ` ${article.address2SiGunGu}`}
                    {article.address3DongEupMyeon && ` ${article.address3DongEupMyeon}`}
                    {article.floors && ` · ${article.floors}층`}
                    {article.areaExclusive && ` · ${article.areaExclusive}㎡ (${Math.round(Number(article.areaExclusive) * 0.3025)}평)`}
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
                    {article.articleDesc}
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
                        {article.tradeType === "매매" ? "매매가" : "보증금"} {isZeroPrice(article.priceSale) ? "X" : formatPrice(article.priceSale)}
                    </Typography>
                    {(article.tradeType === "전세" || article.tradeType === "월세") && article.priceRent > 0 && (
                        <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            월세 {formatPrice(article.priceRent)}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

// 매물 유형 상수 정의
const ARTICLE_TYPES = {
    APT: { code: 'APT', name: '아파트' },
    OPST: { code: 'OPST', name: '오피스텔' },
    VL: { code: 'VL', name: '빌라' },
    JWJT: { code: 'JWJT', name: '전원주택' },
    DDDGG: { code: 'DDDGG', name: '단독/다가구' },
    SGJT: { code: 'SGJT', name: '상가주택' },
    HOJT: { code: 'HOJT', name: '한옥주택' },
    SG: { code: 'SG', name: '상가' },
    SMS: { code: 'SMS', name: '사무실' }
};

// 매물 유형 코드를 한글로 변환하는 함수
const getArticleTypeName = (code: string) => {
    return ARTICLE_TYPES[code as keyof typeof ARTICLE_TYPES]?.name || code;
};

// 매물 유형 한글을 코드로 변환하는 함수
const getArticleTypeCode = (name: string) => {
    return Object.entries(ARTICLE_TYPES).find(([_, value]) => value.name === name)?.[0] || name;
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
    const [isPriceSelectionMin, setIsPriceSelectionMin] = useState<boolean>(true)
    const [priceRange, setPriceRange] = useState<number[]>([])
    const [selectedArticle, setSelectedArticle] = useState<ArticleResponse | null>(null)
    const [selectedComplex, setSelectedComplex] = useState<ComplexResponse | null>(null)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [isFetchingMore, setIsFetchingMore] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const observerTarget = useRef<HTMLDivElement>(null)
    const [regions, setRegions] = useState<Region[]>(KOREA_REGIONS)
    const [selectedCity, setSelectedCity] = useState<string>("")
    const [selectedDistrict, setSelectedDistrict] = useState<string>("")
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string[]>([])
    const [locationSearch, setLocationSearch] = useState("")
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [drawerWidth] = useState(350)
    const [showMap, setShowMap] = useState(true)
    const [showList, setShowList] = useState(true)
    const [detailVisible, setDetailVisible] = useState(false)
    const [cityOptions, setCityOptions] = useState<Region[]>(getCityOptions());
    const [districtOptions, setDistrictOptions] = useState<Region[]>([]);
    const [neighborhoodOptions, setNeighborhoodOptions] = useState<Region[]>([]);
    const [sortField, setSortField] = useState<string>("id");
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const ALLOWED_SORT_FIELDS = ["id", "priceSale", "confirmedAt"];
    const ALLOWED_SORT_DIRECTIONS = ["asc", "desc"];
    const [regionPopoverAnchor, setRegionPopoverAnchor] = useState<null | HTMLElement>(null)
    const [regionSelectStep, setRegionSelectStep] = useState<'city' | 'district' | 'neighborhood'>('city')
    const [isRegionFiltered, setIsRegionFiltered] = useState(false)
    const [noMatchingArticles, setNoMatchingArticles] = useState(false)
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>({
        lat: 37.5665,
        lng: 126.9780,
    });
    const [zoom, setZoom] = useState(14);

    useEffect(() => {
        // 초기 데이터 설정
        fetchArticles()
    }, [typeFilter, tradeTypeFilter, selectedNeighborhood])

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
        setLoading(true);
        setNoMatchingArticles(false);
        if (pageNum > 0) {
            setIsLoadingMore(true);
        }

        try {
            const params: any = {
                page: pageNum,
                size: 100,
                sortBy: sortField,
                direction: sortOrder
            };

            if (typeFilter.length > 0) {
                params.realEstateType = typeFilter;
            }

            if (tradeTypeFilter.length > 0) {
                params.tradeType = tradeTypeFilter;
            }

            if (minPrice) {
                params.minPrice = minPrice;
            }

            if (maxPrice) {
                params.maxPrice = maxPrice;
            }

            // 지역 필터가 적용되었는지 확인
            let isRegionFilterApplied = false;

            // 법정동코드 패턴에 따라 적절한 prefix 설정
            if (selectedNeighborhood.length > 0) {
                // 동이 선택된 경우: 하드코딩된 데이터에서 법정동코드 찾기
                const neighborhood = neighborhoodOptions.find(r => r.cortarName === selectedNeighborhood[0]);
                if (neighborhood?.cortarNo) {
                    params.regionPrefix = neighborhood.cortarNo;
                    isRegionFilterApplied = true;
                }
            } else if (selectedDistrict) {
                // 구가 선택된 경우: 하드코딩된 데이터에서 법정동코드 찾기
                const district = districtOptions.find(r => r.cortarName === selectedDistrict);
                if (district?.cortarNo) {
                    params.regionPrefix = district.cortarNo.substring(0, 5);
                    isRegionFilterApplied = true;
                }
            } else if (selectedCity) {
                // 시가 선택된 경우: 하드코딩된 데이터에서 법정동코드 찾기
                const city = cityOptions.find(r => r.cortarName === selectedCity);
                if (city?.cortarNo) {
                    params.regionPrefix = city.cortarNo.substring(0, 2);
                    isRegionFilterApplied = true;
                }
            }

            setIsRegionFiltered(isRegionFilterApplied);
            console.log("Fetching articles with params:", params); // 디버깅 로그 추가

            const response = await articleApi.getAllArticles(params);
            
            if (response.data.success && response.data.data) {
                const newArticles = response.data.data.content || [];
                
                if (pageNum === 0) {
                    setArticles(newArticles);
                    setCurrentPage(0);
                    
                    // 지역 필터가 적용되었는데 결과가 없는 경우
                    if (isRegionFilterApplied && newArticles.length === 0) {
                        setNoMatchingArticles(true);
                    }
                } else {
                    setArticles(prev => [...prev, ...newArticles]);
                }
                
                const isLastPage = response.data.data.last;
                setHasMore(!isLastPage && newArticles.length > 0);
                
                if (newArticles.length > 0) {
                    setCurrentPage(pageNum);
                }
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
    };

    const handleArticleClick = async (article: ArticleResponse) => {
        setSelectedArticle(article);
        // 단지 정보 가져오기
        if (article.complexId) {
            try {
                const response = await articleApi.getComplex(article.complexId);
                if (response.data.success) {
                    setSelectedComplex(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching complex:', error);
            }
        }
        setTimeout(() => {
            setDetailVisible(true);
        }, 50);
    };

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

    // 지역 선택 팝오버 열기
    const handleRegionPopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        // regionData에서 시/도 목록 가져오기 (API 호출 대신)
        setCityOptions(getCityOptions());
        setRegionPopoverAnchor(event.currentTarget);
        setRegionSelectStep('city');
    };

    // 지역 선택 팝오버 닫기
    const handleRegionPopoverClose = () => {
        setRegionPopoverAnchor(null);
    };

    // 시/도 선택 핸들러
    const handleCitySelect = (value: string) => {
        setSelectedCity(value);
        setSelectedDistrict("");
        setSelectedNeighborhood([]);
        setRegionSelectStep('district');
        
        // 시/도에 해당하는 구/군 목록 가져오기 (API 호출 대신 하드코딩 데이터 활용)
        const districts = getDistrictOptions(value);
        setDistrictOptions(districts);
    };

    // 구/군 선택 핸들러
    const handleDistrictSelect = async (value: string) => {
        setSelectedDistrict(value);
        setSelectedNeighborhood([]);
        setRegionSelectStep('neighborhood');
        
        // 구/군에 해당하는 동/읍/면 목록을 백엔드에서 API로 가져오기
        const district = districtOptions.find(r => r.cortarName === value);
        if (district && district.cortarNo) {
            try {
                // 시/군/구 코드는 앞 5자리 + 0 5개 (XXXXX00000)
                // API 호출 시에는 앞 5자리만 전달
                const prefix = district.cortarNo.substring(0, 5);
                const res = await regionApi.getChildRegions(prefix);
                if (res.data.success) {
                    // 읍/면/동은 00000으로 끝나지 않거나, 마지막 5자리가 전부 0이 아닌 코드만 필터링
                    const neighborhoods = res.data.data.filter(r => 
                        r.cortarNo.startsWith(prefix) && 
                        !r.cortarNo.endsWith("00000")
                    );
                    setNeighborhoodOptions(neighborhoods);
                }
            } catch (err) {
                console.error("Failed to load neighborhoods:", err);
                setNeighborhoodOptions([]);
            }
        } else {
            setNeighborhoodOptions([]);
        }
    };

    // 동/읍/면 선택 핸들러
    const handleNeighborhoodSelect = (value: string) => {
        setSelectedNeighborhood([value]);
        handleRegionPopoverClose();
    };

    // 지역 선택 초기화
    const handleResetRegion = () => {
        setSelectedCity("");
        setSelectedDistrict("");
        setSelectedNeighborhood([]);
        setRegionSelectStep('city');
        handleRegionPopoverClose();
        setNoMatchingArticles(false);
        // 지역 필터가 초기화된 후 매물을 다시 불러옵니다
        fetchArticles(0);
    };

    const isRegionPopoverOpen = Boolean(regionPopoverAnchor);

    // 거래 유형별 매물 수 계산하는 함수
    const getTradeTypeCounts = () => {
        const counts = {
            매매: 0,
            전세: 0,
            월세: 0,
            기타: 0
        };
        
        articles.forEach(article => {
            if (article.tradeType === "매매") {
                counts.매매++;
            } else if (article.tradeType === "전세") {
                counts.전세++;
            } else if (article.tradeType === "월세" || article.tradeType === "단기임대") {
                counts.월세++;
            } else {
                counts.기타++;
            }
        });
        
        return counts;
    };

    // 가격을 한글로 포맷팅하는 함수
    const formatPriceToKorean = (price: number): string => {
        if (price >= 10000) {
            const uk = Math.floor(price / 10000);
            const rest = price % 10000;
            if (rest === 0) {
                return `${uk}억`;
            } else {
                const chun = Math.floor(rest / 1000);
                const remainder = rest % 1000;
                if (chun > 0 && remainder === 0) {
                    return `${uk}억 ${chun}천`;
                } else if (chun > 0) {
                    return `${uk}억 ${chun}천${remainder}`;
                } else {
                    return `${uk}억 ${rest}`;
                }
            }
        } else if (price >= 1000) {
            const chun = Math.floor(price / 1000);
            const remainder = price % 1000;
            if (remainder === 0) {
                return `${chun}천`;
            } else {
                return `${chun}천${remainder}`;
            }
        } else {
            return `${price}`;
        }
    };

    // 가격 버튼 클릭 핸들러
    const handlePriceButtonClick = (price: number) => {
        if (isPriceSelectionMin) {
            // 최소값 설정
            setMinPrice(price.toString());
            setIsPriceSelectionMin(false);
            // 중간 범위 업데이트
            if (maxPrice && Number(maxPrice) > price) {
                updatePriceRange(price, Number(maxPrice));
            } else {
                setPriceRange([price]);
            }
        } else {
            // 최대값을 선택할 때
            const minPriceNum = Number(minPrice);
            
            // 최소값보다 작은 값을 최대값으로 설정하려는 경우
            if (minPriceNum > price) {
                // 기존 최소값을 최대값으로, 선택한 값을 최소값으로 설정
                setMaxPrice(minPrice);
                setMinPrice(price.toString());
                // 중간 범위 업데이트
                updatePriceRange(price, minPriceNum);
            } else {
                setMaxPrice(price.toString());
                // 중간 범위 업데이트
                updatePriceRange(minPriceNum, price);
            }
            setIsPriceSelectionMin(true);
        }
    };

    // 가격 범위 업데이트
    const updatePriceRange = (min: number, max: number) => {
        // min과 max 사이의 가격들을 배열로 생성
        const prices = [5000, 6000, 7000, 8000, 9000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200];
        const rangeArray = prices.filter(price => price >= min && price <= max);
        setPriceRange(rangeArray);
    };

    // 최소 가격 입력 핸들러
    const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMinPrice = e.target.value;
        setMinPrice(newMinPrice);
        
        // 유효한 숫자고 최대 가격이 설정되어 있는 경우
        if (newMinPrice && !isNaN(Number(newMinPrice)) && maxPrice) {
            const minNum = Number(newMinPrice);
            const maxNum = Number(maxPrice);
            
            // 최소 가격이 최대 가격보다 크면 최대 가격을 최소 가격으로 설정
            if (minNum > maxNum) {
                setMaxPrice(newMinPrice);
                updatePriceRange(maxNum, minNum);
            } else {
                updatePriceRange(minNum, maxNum);
            }
        } else if (!newMinPrice || isNaN(Number(newMinPrice))) {
            // 유효하지 않은 값이면 범위 비우기
            setPriceRange([]);
        }
    };

    // 최대 가격 입력 핸들러
    const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMaxPrice = e.target.value;
        setMaxPrice(newMaxPrice);
        
        // 유효한 숫자고 최소 가격이 설정되어 있는 경우
        if (newMaxPrice && !isNaN(Number(newMaxPrice)) && minPrice) {
            const minNum = Number(minPrice);
            const maxNum = Number(newMaxPrice);
            
            // 최대 가격이 최소 가격보다 작으면 최소 가격을 최대 가격으로 설정
            if (maxNum < minNum) {
                setMinPrice(newMaxPrice);
                updatePriceRange(maxNum, minNum);
            } else {
                updatePriceRange(minNum, maxNum);
            }
        } else if (!newMaxPrice || isNaN(Number(newMaxPrice))) {
            // 유효하지 않은 값이면 범위만 최소 가격으로 설정
            if (minPrice && !isNaN(Number(minPrice))) {
                setPriceRange([Number(minPrice)]);
            } else {
                setPriceRange([]);
            }
        }
    };

    // 가격 입력 필드 초기화
    const handleResetPrices = () => {
        setMinPrice("");
        setMaxPrice("");
        setIsPriceSelectionMin(true);
        setPriceRange([]);
    };

    // 더 불러오기 버튼을 클릭했을 때 호출될 함수
    const fetchMoreArticles = async () => {
        try {
            setIsFetchingMore(true);
            
            // 다음 페이지 번호 계산
            const nextPage = currentPage + 1;
            console.log(`매물 더 불러오기: 페이지 ${nextPage} 요청`);
            
            // 안전한 정렬 필드/순서 적용
            let safeSortField = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : "id";
            let safeSortOrder = ALLOWED_SORT_DIRECTIONS.includes(sortOrder.toLowerCase()) ? sortOrder : "desc";
            const params: any = {
                page: nextPage,
                size: 100,
                sortBy: safeSortField,
                direction: safeSortOrder
            };
            
            if (typeFilter.length > 0) {
                params.realEstateType = typeFilter;
            }
            
            if (tradeTypeFilter.length > 0) {
                params.tradeType = tradeTypeFilter;
            }
            
            if (searchTerm) {
                params.articleName = searchTerm;
            }
            
            // 지역 필터가 적용되었는지 확인
            let isRegionFilterApplied = false;

            // 법정동코드 패턴에 따라 적절한 prefix 설정
            if (selectedNeighborhood.length > 0) {
                // 동이 선택된 경우: 하드코딩된 데이터에서 법정동코드 찾기
                const neighborhood = neighborhoodOptions.find(r => r.cortarName === selectedNeighborhood[0]);
                if (neighborhood?.cortarNo) {
                    params.regionPrefix = neighborhood.cortarNo;
                    isRegionFilterApplied = true;
                }
            } else if (selectedDistrict) {
                // 구가 선택된 경우: 하드코딩된 데이터에서 법정동코드 찾기
                const district = districtOptions.find(r => r.cortarName === selectedDistrict);
                if (district?.cortarNo) {
                    params.regionPrefix = district.cortarNo.substring(0, 5);
                    isRegionFilterApplied = true;
                }
            } else if (selectedCity) {
                // 시가 선택된 경우: 하드코딩된 데이터에서 법정동코드 찾기
                const city = cityOptions.find(r => r.cortarName === selectedCity);
                if (city?.cortarNo) {
                    params.regionPrefix = city.cortarNo.substring(0, 2);
                    isRegionFilterApplied = true;
                }
            }

            if (minPrice) {
                params.minPriceSale = convertKoreanPriceToNumber(minPrice);
            }
            
            if (maxPrice) {
                params.maxPriceSale = convertKoreanPriceToNumber(maxPrice);
            }
            
            const response = await articleApi.getAllArticles(params);
            
            if (response.data.success && response.data.data) {
                const newArticles = response.data.data.content || [];
                console.log('추가로 불러온 매물:', newArticles.length, '건');
                
                // 혹시 모를 중복을 클라이언트에서 한 번 더 필터링
                const existingIds = new Set(articles.map(article => article.id));
                const uniqueNewArticles = newArticles.filter(
                    article => !existingIds.has(article.id)
                );
                
                if (uniqueNewArticles.length > 0) {
                    setArticles(prev => [...prev, ...uniqueNewArticles]);
                    setCurrentPage(nextPage);
                }
                
                // 마지막 페이지인지 확인
                const isLastPage = response.data.data.last;
                setHasMore(!isLastPage && newArticles.length > 0);
                
                if (newArticles.length === 0 || isLastPage) {
                    console.log('더 이상 불러올 매물이 없습니다.');
                }
            } else {
                setError("추가 매물을 불러오는데 실패했습니다.");
            }
        } catch (err) {
            console.error("Error fetching more articles:", err);
            setError("추가 매물을 불러오는데 실패했습니다.");
        } finally {
            setIsFetchingMore(false);
        }
    };

    return (
        <Box 
            sx={{ 
                width: '100%', 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden'
            }}
        >
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={handleRegionPopoverOpen}
                        startIcon={<LocationOnIcon />}
                        sx={{ 
                            borderRadius: '16px', 
                            height: '32px',
                            mr: 1,
                            textTransform: 'none',
                            borderColor: '#007AFF',
                            color: '#007AFF'
                        }}
                    >
                        {selectedCity && <span style={{ fontWeight: 'bold' }}>{selectedCity}</span>}
                        {selectedDistrict && <span>&nbsp;&gt;&nbsp;{selectedDistrict}</span>}
                        {selectedNeighborhood.length > 0 && <span>&nbsp;&gt;&nbsp;{selectedNeighborhood[0]}</span>}
                        {!selectedCity && '지역 선택'}
                    </Button>
                    <Popover
                        open={isRegionPopoverOpen}
                        anchorEl={regionPopoverAnchor}
                        onClose={handleRegionPopoverClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        PaperProps={{
                            style: { width: '400px', maxHeight: '500px' }
                        }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">지역 선택</Typography>
                                <Button 
                                    size="small" 
                                    onClick={handleResetRegion}
                                    startIcon={<span>↺</span>}
                                >
                                    초기화
                                </Button>
                            </Box>
                            
                            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', mb: 2 }}>
                                <Button
                                    sx={{
                                        fontWeight: regionSelectStep === 'city' ? 'bold' : 'normal',
                                        color: regionSelectStep === 'city' ? 'primary.main' : 'text.secondary',
                                        borderBottom: regionSelectStep === 'city' ? '2px solid #007AFF' : 'none',
                                        borderRadius: 0,
                                        mr: 1
                                    }}
                                    onClick={() => setRegionSelectStep('city')}
                                    disabled={regionSelectStep === 'city'}
                                >
                                    시/도
                                </Button>
                                <Typography sx={{ color: 'text.secondary', my: 'auto' }}>{'>'}</Typography>
                                <Button
                                    sx={{
                                        fontWeight: regionSelectStep === 'district' ? 'bold' : 'normal',
                                        color: regionSelectStep === 'district' ? 'primary.main' : 'text.secondary',
                                        borderBottom: regionSelectStep === 'district' ? '2px solid #007AFF' : 'none',
                                        borderRadius: 0,
                                        mx: 1
                                    }}
                                    onClick={() => setRegionSelectStep('district')}
                                    disabled={!selectedCity || regionSelectStep === 'district'}
                                >
                                    시/군/구
                                </Button>
                                <Typography sx={{ color: 'text.secondary', my: 'auto' }}>{'>'}</Typography>
                                <Button
                                    sx={{
                                        fontWeight: regionSelectStep === 'neighborhood' ? 'bold' : 'normal',
                                        color: regionSelectStep === 'neighborhood' ? 'primary.main' : 'text.secondary',
                                        borderBottom: regionSelectStep === 'neighborhood' ? '2px solid #007AFF' : 'none',
                                        borderRadius: 0,
                                        ml: 1
                                    }}
                                    onClick={() => setRegionSelectStep('neighborhood')}
                                    disabled={!selectedDistrict || regionSelectStep === 'neighborhood'}
                                >
                                    읍/면/동
                                </Button>
                            </Box>
                            
                            {regionSelectStep === 'city' && (
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, 1fr)',
                                  gap: 1,
                                  maxHeight: '350px',
                                  overflowY: 'auto',
                                  p: 1
                                }}
                              >
                                {cityOptions.map((city) => (
                                  <Button
                                    key={city.id}
                                    variant={selectedCity === city.cortarName ? 'contained' : 'outlined'}
                                    onClick={() => handleCitySelect(city.cortarName)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    {city.cortarName}
                                  </Button>
                                ))}
                              </Box>
                            )}

                            {regionSelectStep === 'district' && (
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, 1fr)',
                                  gap: 1,
                                  maxHeight: '350px',
                                  overflowY: 'auto',
                                  p: 1
                                }}
                              >
                                {districtOptions.map((district) => (
                                  <Button
                                    key={district.id}
                                    variant={selectedDistrict === district.cortarName ? 'contained' : 'outlined'}
                                    onClick={() => handleDistrictSelect(district.cortarName)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    {district.cortarName}
                                  </Button>
                                ))}
                              </Box>
                            )}

                            {regionSelectStep === 'neighborhood' && (
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, 1fr)',
                                  gap: 1,
                                  maxHeight: '350px',
                                  overflowY: 'auto',
                                  p: 1
                                }}
                              >
                                {neighborhoodOptions.length > 0 ? (
                                  neighborhoodOptions.map((neighborhood) => (
                                    <Button
                                      key={neighborhood.id}
                                      variant={selectedNeighborhood[0] === neighborhood.cortarName ? 'contained' : 'outlined'}
                                      onClick={() => handleNeighborhoodSelect(neighborhood.cortarName)}
                                      sx={{ textTransform: 'none' }}
                                    >
                                      {neighborhood.cortarName}
                                    </Button>
                                  ))
                                ) : (
                                  <Typography variant="body2" sx={{ p: 2, gridColumn: '1 / span 2', textAlign: 'center' }}>
                                    검색결과가 없습니다.
                                  </Typography>
                                )}
                              </Box>
                            )}
                        </Box>
                    </Popover>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="subtitle1" sx={{ mr: 2 }}>
                        {loading ? "매물 로딩 중..." : 
                         noMatchingArticles ? "지역 조건에 해당하는 매물이 없습니다." :
                         `매매 ${getTradeTypeCounts().매매}건, 전세 ${getTradeTypeCounts().전세}건, 월세 ${getTradeTypeCounts().월세}건`}
                    </Typography>
                    <Button 
                        color="inherit" 
                        onClick={fetchMoreArticles} 
                        disabled={isFetchingMore || !hasMore || noMatchingArticles}
                        startIcon={isFetchingMore ? null : <></>}
                        sx={{ mr: 1 }}
                    >
                        {isFetchingMore ? "로딩 중..." : "매물 더 불러오기"}
                    </Button>
                    <IconButton color="inherit" onClick={() => setShowList(!showList)}>
                        {showList ? <ViewMapIcon /> : <ViewListIcon />}
                    </IconButton>
                    <IconButton color="inherit" onClick={() => setIsFilterDrawerOpen(true)}>
                        <FilterListIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            
            <Box 
                sx={{ 
                    position: 'relative', 
                    flex: 1, 
                    overflow: 'hidden',
                    touchAction: 'none' // 모바일 터치 동작 방지
                }}
            >
                {/* Map component */}
                {showMap && (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                            touchAction: "none", // 터치 이벤트를 맵에서만 처리하도록 설정
                            pointerEvents: "auto", // 포인터 이벤트 활성화
                            overflow: 'hidden' // 스크롤 방지
                        }}
                    >
                        <MapView
                            articles={articles}
                            selectedArticle={selectedArticle}
                            onArticleClick={handleArticleClick}
                            selectedRegions={{
                                city: selectedCity,
                                district: selectedDistrict,
                                neighborhoods: selectedNeighborhood
                            }}
                            allRegions={regions}
                            initialCenter={currentLocation}
                            initialZoom={zoom}
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
                        opacity: 0.95
                    }}
                >
                    <List>
                        {noMatchingArticles ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
                                <Paper sx={{ p: 3, textAlign: 'center', maxWidth: '80%' }}>
                                    <Typography variant="h6" gutterBottom>
                                        검색결과가 없습니다.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        다른 지역을 선택하거나 필터를 변경해 보세요.
                                    </Typography>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        sx={{ mt: 2 }}
                                        onClick={handleResetRegion}
                                    >
                                        지역 선택 초기화
                                    </Button>
                                </Paper>
                            </Box>
                        ) : (
                            <>
                                {articles.map((article, index) => (
                                    <ArticleItem 
                                        key={`article-${article.id}-${index}`} 
                                        article={article} 
                                        isSelected={selectedArticle?.id === article.id}
                                        onClick={() => handleArticleClick(article)}
                                    />
                                ))}
                                {(hasMore && !loading) && (
                                    <div ref={observerTarget} style={{ height: '20px' }} />
                                )}
                            </>
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
                        overflowY: 'hidden',
                        transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out, left 0.3s ease-in-out',
                        transform: detailVisible ? 'translateX(0)' : 'translateX(100%)',
                        boxShadow: '-4px 0px 10px rgba(0, 0, 0, 0.1)',
                        borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
                        opacity: 0.95
                    }}
                >
                    {selectedArticle && (
                        <ArticleDetail
                            article={selectedArticle}
                            complex={selectedComplex}
                            onClose={() => {
                                setDetailVisible(false);
                                setTimeout(() => {
                                    setSelectedArticle(null);
                                    setSelectedComplex(null);
                                }, 300);
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
                        onCityChange={handleCitySelect}
                        onDistrictChange={handleDistrictSelect}
                        onNeighborhoodChange={(values) => setSelectedNeighborhood(values)}
                    />

                    <FormControl fullWidth margin="normal">
                      <InputLabel id="sort-field-label">정렬 기준</InputLabel>
                      <Select
                        labelId="sort-field-label"
                        id="sort-field-select"
                        value={`${sortField},${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split(',');
                          const safeField = ALLOWED_SORT_FIELDS.includes(field) ? field : "id";
                          const safeOrder = ALLOWED_SORT_DIRECTIONS.includes(order?.toLowerCase()) ? order : "desc";
                          setSortField(safeField);
                          setSortOrder(safeOrder);
                          setPage(0);
                          fetchArticles(0);
                        }}
                      >
                        <MenuItem value="id,desc">최신 등록순</MenuItem>
                        <MenuItem value="id,asc">오래된 등록순</MenuItem>
                        <MenuItem value="priceSale,desc">가격 낮은순</MenuItem>
                        <MenuItem value="priceSale,asc">가격 높은순</MenuItem>
                        <MenuItem value="confirmedAt,desc">최신 확인일순</MenuItem>
                        <MenuItem value="confirmedAt,asc">오래된 확인일순</MenuItem>
                      </Select>
                    </FormControl>
                    
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
                                        <Chip key={value} label={getArticleTypeName(value)} />
                                    ))}
                                </Box>
                            )}
                        >
                            {Object.values(ARTICLE_TYPES).map(type => (
                                <MenuItem key={type.code} value={type.code}>
                                    {type.name}
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
                            {["매매", "전세", "월세"].map(type => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                            매매가/전세가/보증금
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {[5000, 6000, 7000, 8000, 9000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000].map((price) => (
                                <Button
                                    key={price}
                                    variant={
                                        minPrice === price.toString() ? "contained" :
                                        maxPrice === price.toString() ? "contained" :
                                        priceRange.includes(price) ? "contained" :
                                        "outlined"
                                    }
                                    color={
                                        minPrice === price.toString() ? "primary" :
                                        maxPrice === price.toString() ? "secondary" :
                                        priceRange.includes(price) ? "info" :
                                        "primary"
                                    }
                                    size="small"
                                    onClick={() => handlePriceButtonClick(price)}
                                    sx={{
                                        minWidth: '60px',
                                        height: '32px',
                                        fontSize: '0.875rem',
                                        borderRadius: '4px',
                                        '&.MuiButton-contained': {
                                            backgroundColor: minPrice === price.toString() ? '#007AFF' : 
                                                             maxPrice === price.toString() ? '#FF5722' :
                                                             priceRange.includes(price) ? '#8F96A3' : undefined,
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: minPrice === price.toString() ? '#0056b3' : 
                                                                maxPrice === price.toString() ? '#d84315' :
                                                                priceRange.includes(price) ? '#6c757d' : undefined,
                                            },
                                        },
                                    }}
                                >
                                    {price >= 10000 ? `${Math.floor(price/10000)}억${price%10000 > 0 ? ` ${Math.floor((price%10000)/1000)}천` : ''}` : `${Math.floor(price/1000)}천`}
                                </Button>
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <TextField
                                size="small"
                                placeholder="최소"
                                value={minPrice}
                                onChange={handleMinPriceChange}
                                sx={{ width: '100px' }}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                }}
                            />
                            <Typography>~</Typography>
                            <TextField
                                size="small"
                                placeholder="최대"
                                value={maxPrice}
                                onChange={handleMaxPriceChange}
                                sx={{ width: '100px' }}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                }}
                            />
                            <Button 
                                size="small" 
                                variant="text" 
                                onClick={handleResetPrices} 
                                sx={{ ml: 1 }}
                            >
                                초기화
                            </Button>
                        </Box>

                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                            월세
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200].map((price) => (
                                <Button
                                    key={price}
                                    variant={
                                        minPrice === price.toString() ? "contained" :
                                        maxPrice === price.toString() ? "contained" :
                                        priceRange.includes(price) ? "contained" :
                                        "outlined"
                                    }
                                    color={
                                        minPrice === price.toString() ? "primary" :
                                        maxPrice === price.toString() ? "secondary" :
                                        priceRange.includes(price) ? "info" :
                                        "primary"
                                    }
                                    size="small"
                                    onClick={() => handlePriceButtonClick(price)}
                                    sx={{
                                        minWidth: '60px',
                                        height: '32px',
                                        fontSize: '0.875rem',
                                        borderRadius: '4px',
                                        '&.MuiButton-contained': {
                                            backgroundColor: minPrice === price.toString() ? '#007AFF' : 
                                                            maxPrice === price.toString() ? '#FF5722' :
                                                            priceRange.includes(price) ? '#8F96A3' : undefined,
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: minPrice === price.toString() ? '#0056b3' : 
                                                                maxPrice === price.toString() ? '#d84315' :
                                                                priceRange.includes(price) ? '#6c757d' : undefined,
                                            },
                                        },
                                    }}
                                >
                                    {price >= 100 ? `${price/100}백` : price}
                                </Button>
                            ))}
                        </Box>
                    </Box>

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