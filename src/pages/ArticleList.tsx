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
import type { ArticleResponse, ComplexResponse } from "../types/article"
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewMapIcon from '@mui/icons-material/Map';
import RegionSelector from '../components/region/RegionSelector'
import { Region, SelectedRegions } from '../utils/regions/regionUtils'
import { formatDate, formatPrice, getTradeTypeColor, getTypeColor, getTypeEmoji, isZeroPrice, convertKoreanPriceToNumber } from '../utils/articleUtils'

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
                                        article.tradeType === "전세" ? '4px' : '0',
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
                                            article.tradeType === "전세" ? '4px' : '0',
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
                    {(article.tradeType === "전세" || article.tradeType === "월세" || article.tradeType === "단기임대") && article.priceRent > 0 && (
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
    const [selectedArticle, setSelectedArticle] = useState<ArticleResponse | null>(null)
    const [selectedComplex, setSelectedComplex] = useState<ComplexResponse | null>(null)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [isFetchingMore, setIsFetchingMore] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
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
    const [cityOptions, setCityOptions] = useState<Region[]>([]);
    const [districtOptions, setDistrictOptions] = useState<Region[]>([]);
    const [neighborhoodOptions, setNeighborhoodOptions] = useState<Region[]>([]);

    // 시/도 옵션을 백엔드에서 불러옵니다.
    useEffect(() => {
      const loadCities = async () => {
        try {
          const res = await regionApi.getAllRegions();
          if (res.data.success) {
            setRegions(res.data.data);
            // cortarNo 끝 00000000인 시/도만 선택
            setCityOptions(res.data.data.filter(r => r.cortarNo?.endsWith("00000000")));
          }
        } catch (err) {
          console.error("Failed to load cities:", err);
        }
      };
      loadCities();
    }, []);
    const [sortField, setSortField] = useState<string>("id");
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const ALLOWED_SORT_FIELDS = ["id", "priceSale", "confirmedAt"];
    const ALLOWED_SORT_DIRECTIONS = ["asc", "desc"];

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
                setCurrentPage(0);
            } else {
                setIsLoadingMore(true);
            }
            
            // 안전한 정렬 필드/순서 적용
            let safeSortField = ALLOWED_SORT_FIELDS.includes(sortField) ? sortField : "id";
            let safeSortOrder = ALLOWED_SORT_DIRECTIONS.includes(sortOrder.toLowerCase()) ? sortOrder : "desc";
            const params: any = {
                page: pageNum,
                size: 100,
                sortBy: safeSortField,
                direction: safeSortOrder
            };
            
            if (typeFilter.length > 0) {
                params.articleType = typeFilter;
            }
            
            if (tradeTypeFilter.length > 0) {
                params.tradeType = tradeTypeFilter;
            }
            
            if (searchTerm) {
                params.articleName = searchTerm;
            }
            
            // 지역 필터링 (dongCode 기반)
            if (selectedCity) {
                let targetDongCode: string | undefined;
                
                // 1. 동 수준 필터링
                if (selectedNeighborhood.length > 0) {
                    // 특정 동 선택 - 해당 동의 dongCode 사용
                    const dongRegion = regions.find(r => 
                        r.cortarName === selectedNeighborhood[0] &&
                        r.cortarNo
                    );
                    
                    if (dongRegion && dongRegion.cortarNo) {
                        targetDongCode = dongRegion.cortarNo;
                        console.log(`Using neighborhood level dongCode: ${targetDongCode}`);
                    }
                } 
                // 2. 구/군 수준 필터링 
                else if (selectedDistrict) {
                    // 구/군 선택 - 해당 구/군의 dongCode 사용
                    const districtRegion = regions.find(r => 
                        r.cortarName === selectedDistrict &&
                        r.cortarNo
                    );
                    
                    if (districtRegion && districtRegion.cortarNo) {
                        targetDongCode = districtRegion.cortarNo;
                        console.log(`Using district level dongCode: ${targetDongCode}`);
                    }
                } 
                // 3. 시/도 수준 필터링
                else {
                    // 시/도 선택 - 해당 시/도의 dongCode 사용
                    const cityRegion = regions.find(r => 
                        r.cortarName === selectedCity &&
                        r.cortarNo
                    );
                    
                    if (cityRegion && cityRegion.cortarNo) {
                        targetDongCode = cityRegion.cortarNo;
                        console.log(`Using city level dongCode: ${targetDongCode}`);
                    }
                }
                
                // 찾은 dongCode로 필터링
                if (targetDongCode) {
                    params.dongCode = targetDongCode;
                } 
                // dongCode가 없으면 이름으로 필터링 (대안)
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
                params.minPriceSale = convertKoreanPriceToNumber(minPrice);
            }
            
            if (maxPrice) {
                params.maxPriceSale = convertKoreanPriceToNumber(maxPrice);
            }
            
            const response = await articleApi.getAllArticles(params);
            console.log('API Response:', response.data);
            
            if (response.data.success && response.data.data) {
                const newArticles = response.data.data.content || [];
                console.log('Fetched articles:', newArticles.length, '건');
                
                if (pageNum === 0) {
                    setArticles(newArticles);
                    setCurrentPage(0);
                } else {
                    // 기존 매물에 새로운 매물 추가
                    setArticles(prev => [...prev, ...newArticles]);
                }
                
                // 마지막 페이지인지 확인
                const isLastPage = response.data.data.last;
                
                // 새로 가져온 항목이 없거나 마지막 페이지면 더 이상 로드하지 않음
                setHasMore(!isLastPage && newArticles.length > 0);
                
                // 성공적으로 페이지를 로드했으면 현재 페이지 업데이트
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
        if (selectedArticle?.id === article.id) {
            setDetailVisible(false);
            setTimeout(() => {
                setSelectedArticle(null);
                setSelectedComplex(null);
            }, 300);
        } else {
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
        }
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

    const handleCityChange = async (value: string) => {
      setSelectedCity(value);
      setSelectedDistrict("");
      setSelectedNeighborhood([]);
      const city = cityOptions.find(r => r.cortarName === value);
      if (city) {
        try {
          const res = await regionApi.getChildRegions(city.id);
          if (res.data.success) {
            setDistrictOptions(res.data.data);
          }
        } catch (err) {
          console.error("Failed to load districts:", err);
        }
      } else {
        setDistrictOptions([]);
      }
    };

    const handleDistrictChange = async (value: string) => {
      setSelectedDistrict(value);
      setSelectedNeighborhood([]);
      const district = districtOptions.find(r => r.cortarName === value);
      if (district) {
        try {
          const res = await regionApi.getChildRegions(district.id);
          if (res.data.success) {
            setNeighborhoodOptions(res.data.data);
          }
        } catch (err) {
          console.error("Failed to load neighborhoods:", err);
        }
      } else {
        setNeighborhoodOptions([]);
      }
    };

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

    // 시/도 목록을 필터링합니다.
    const filterCities = (regions: Region[]): string[] => {
        if (!regions || regions.length === 0) return [];
        
        console.log('Filtering cities using dongCode pattern');
        
        // dongCode 시도 패턴: 앞 2자리가 같고 나머지가 0으로 채워진 형태 (예: 1100000000)
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
        
        // 선택된 시의 dongCode 패턴 찾기
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
                params.articleType = typeFilter;
            }
            
            if (tradeTypeFilter.length > 0) {
                params.tradeType = tradeTypeFilter;
            }
            
            if (searchTerm) {
                params.articleName = searchTerm;
            }
            
            // 지역 필터링 적용 (원래 fetchArticles와 동일한 로직)
            if (selectedCity) {
                let targetDongCode: string | undefined;
                
                // 1. 동 수준 필터링
                if (selectedNeighborhood.length > 0) {
                    const dongRegion = regions.find(r => 
                        r.cortarName === selectedNeighborhood[0] &&
                        r.cortarNo
                    );
                    
                    if (dongRegion && dongRegion.cortarNo) {
                        targetDongCode = dongRegion.cortarNo;
                    }
                } 
                // 2. 구/군 수준 필터링 
                else if (selectedDistrict) {
                    const districtRegion = regions.find(r => 
                        r.cortarName === selectedDistrict &&
                        r.cortarNo
                    );
                    
                    if (districtRegion && districtRegion.cortarNo) {
                        targetDongCode = districtRegion.cortarNo;
                    }
                } 
                // 3. 시/도 수준 필터링
                else {
                    const cityRegion = regions.find(r => 
                        r.cortarName === selectedCity &&
                        r.cortarNo
                    );
                    
                    if (cityRegion && cityRegion.cortarNo) {
                        targetDongCode = cityRegion.cortarNo;
                    }
                }
                
                if (targetDongCode) {
                    params.dongCode = targetDongCode;
                } 
                else if (selectedNeighborhood.length > 0) {
                    params.cortarName = selectedNeighborhood[0];
                } else if (selectedDistrict) {
                    params.cortarName = selectedDistrict;
                } else if (selectedCity) {
                    params.cortarName = selectedCity;
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
        <Box sx={{ width: '100%', height: '82vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {loading ? "매물 로딩 중..." : `매매 ${getTradeTypeCounts().매매}건, 전세 ${getTradeTypeCounts().전세}건, 월세 ${getTradeTypeCounts().월세}건`}
                    </Typography>
                    <Button 
                        color="inherit" 
                        onClick={fetchMoreArticles} 
                        disabled={isFetchingMore || !hasMore}
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
                            selectedRegions={{
                                city: selectedCity,
                                district: selectedDistrict,
                                neighborhoods: selectedNeighborhood
                            }}
                            allRegions={regions}
                            initialCenter={{lat: 37.5665, lng: 126.9780}} 
                            initialZoom={9}
                            fixedInitialView={true}
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
                        opacity: 0.9,
                        visibility: selectedArticle ? 'visible' : 'hidden'
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
                        onCityChange={handleCityChange}
                        onDistrictChange={handleDistrictChange}
                        onNeighborhoodChange={handleNeighborhoodChange}
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

            <Box sx={{ p: 2, textAlign: "center", mt: 4 }}>
                <Typography variant="caption" color="textSecondary">
                    © 2025 중개모아. All rights reserved.
                </Typography>
            </Box>
            
        </Box>
    )
}

export default ArticleList