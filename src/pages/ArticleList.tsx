"use client"

import { ArrowBack, Close, Search } from "@mui/icons-material"
import {
    Alert,
    AppBar,
    Box,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Toolbar,
    Typography
} from "@mui/material"
import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { articleApi } from "../services/articleApi"
import { regionApi } from "../services/regionApi"
import type { ArticleResponse } from "../types/article"

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
    const mapRef = useRef<HTMLDivElement>(null)
    const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY;
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<string[]>([])
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("")
    const [locationSearch, setLocationSearch] = useState("")

    // useEffect(() => {
    //     if (!KAKAO_APP_KEY) {
    //         console.error('Kakao API key is not defined');
    //         return;
    //     }

    //     const script = document.createElement('script');
    //     script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`;
    //     script.async = true;
        
    //     script.onload = () => {
    //         window.kakao.maps.load(() => {
    //             if (mapRef.current) {
    //                 const container = mapRef.current;
    //                 const options = {
    //                     center: new window.kakao.maps.LatLng(37.5665, 126.9780),
    //                     level: 9
    //                 };
    //                 const newMap = new window.kakao.maps.Map(container, options);
    //                 mapInstance.current = newMap;
    //                 setMap(newMap);
    //             } else {
    //                 console.error('Map container not found');
    //             }
    //         });
    //     };

    //     script.onerror = (error) => {
    //         console.error('Failed to load Kakao Map SDK:', error);
    //     };

    //     document.head.appendChild(script);

    //     return () => {
    //         document.head.removeChild(script);
    //     };
    // }, []);

    // // 매물 데이터가 변경될 때 마커 업데이트
    // useEffect(() => {
    //     if (mapInstance.current && articles.length > 0) {
    //         // 기존 마커 제거
    //         markers.forEach(marker => marker.setMap(null));
    //         setMarkers([]);

    //         // 새로운 마커 생성
    //         const newMarkers = articles.map(article => {
    //             if (article.latitude && article.longitude) {
    //                 const markerPosition = new window.kakao.maps.LatLng(
    //                     article.latitude,
    //                     article.longitude
    //                 );
    //                 const marker = new window.kakao.maps.Marker({
    //                     position: markerPosition,
    //                     map: mapInstance.current
    //                 });

    //                 // 마커에 클릭 이벤트 추가
    //                 window.kakao.maps.event.addListener(marker, 'click', () => {
    //                     handleArticleClick(article);
    //                 });

    //                 return marker;
    //             }
    //             return null;
    //         }).filter(marker => marker !== null);

    //         setMarkers(newMarkers);

    //         // 모든 마커가 보이도록 지도 범위 조정
    //         if (newMarkers.length > 0) {
    //             const bounds = new window.kakao.maps.LatLngBounds();
    //             newMarkers.forEach(marker => {
    //                 bounds.extend(marker.getPosition());
    //             });
    //             mapInstance.current.setBounds(bounds);
    //         }
    //     }
    // }, [articles]);

    // // 선택된 매물이 변경될 때 마커 업데이트
    // useEffect(() => {
    //     if (mapInstance.current) {
    //         // 기존 마커 제거
    //         markers.forEach(marker => marker.setMap(null));
    //         setMarkers([]);

    //         // 선택된 매물이 있으면 해당 위치에 마커 생성
    //         if (selectedArticle && selectedArticle.latitude && selectedArticle.longitude) {
    //             const markerPosition = new window.kakao.maps.LatLng(
    //                 selectedArticle.latitude,
    //                 selectedArticle.longitude
    //             );
    //             const marker = new window.kakao.maps.Marker({
    //                 position: markerPosition,
    //                 map: mapInstance.current
    //             });
    //             setMarkers([marker]);

    //             // 지도를 마커 위치로 이동
    //             mapInstance.current.setCenter(markerPosition);
    //             mapInstance.current.setLevel(3); // Zoom in to level 3
    //         }
    //     }
    // }, [selectedArticle]);

    useEffect(() => {
        fetchArticles()
    }, [typeFilter, tradeTypeFilter])

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
                setLoading(true)
            } else {
                setIsLoadingMore(true)
            }
            
            // Create a properly formatted params object with correct typing
            const params: any = {
                page: pageNum,
                size: 20,
                sort: "id,desc"
            }
            
            // Add realEstateType filters if any are selected
            if (typeFilter.length > 0) {
                params.realEstateType = typeFilter
            }
            
            // Add tradeType filters if any are selected
            if (tradeTypeFilter.length > 0) {
                params.tradeType = tradeTypeFilter
            }
            
            // Add search term if provided
            if (searchTerm) {
                params.name = searchTerm
            }
            
            // Add location search if provided
            if (locationSearch) {
                params.town = locationSearch
            }
            
            // Add minPrice and maxPrice if provided
            if (minPrice) {
                params.minPrice = convertKoreanPriceToNumber(minPrice)
            }
            
            if (maxPrice) {
                params.maxPrice = convertKoreanPriceToNumber(maxPrice)
            }
            
            const response = await articleApi.getAllArticles(params)
            if (response.data.success && response.data.data) {
                const newArticles = response.data.data.content || []
                if (pageNum === 0) {
                    setArticles(newArticles)
                } else {
                    setArticles(prev => [...prev, ...newArticles])
                }
                setHasMore(!response.data.data.last)
            } else {
                setError("매물 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching articles:", err)
            setError("매물 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
            setIsLoadingMore(false)
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
        
        // If it's just a number
        return parseInt(cleanStr) || 0
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
            setSelectedArticle(null);
        } else {
            setSelectedArticle(article);
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
        const value = e.target.value;
        setTypeFilter(value);
        setPage(0);
    }

    const handleTradeTypeFilterChange = (e: any) => {
        const value = e.target.value;
        setTradeTypeFilter(value);
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
        // Fetch neighborhoods from regions API
        const fetchNeighborhoods = async () => {
            try {
                const response = await regionApi.getAllRegions()
                
                if (response.data.success && response.data.data) {
                    const areas = response.data.data
                        .map((region: any) => region.cortarName)
                        .filter((area: string | undefined) => area && area.trim() !== "")
                    setNeighborhoods(areas)
                }
            } catch (err) {
                console.error("Error fetching neighborhoods:", err)
            }
        }
        fetchNeighborhoods()
    }, [])

    const getTypeEmoji = (type: string) => {
        switch (type) {
            case "아파트":
                return "🏢"
            case "오피스텔":
                return "🏬"
            case "빌라":
                return "🏠"
            case "아파트분양권":
                return "📝"
            case "오피스텔분양권":
                return "📝"
            case "재건축":
                return "🏗️"
            case "전원주택":
                return "🏡"
            case "단독/다가구":
                return "🏘️"
            case "상가주택":
                return "🏪"
            case "한옥주택":
                return "🏯"
            case "재개발":
                return "🏗️"
            case "원룸":
                return "🏠"
            case "고시원":
                return "🏢"
            case "상가":
                return "🏪"
            case "사무실":
                return "🏢"
            case "공장/창고":
                return "🏭"
            case "건물":
                return "🏢"
            case "토지":
                return "🌳"
            case "지식산업센터":
                return "🏢"
            default:
                return "🏠"
        }
    }

    return (
        <Box sx={{ p: 3 }}>
            <AppBar position="sticky" color="default" elevation={0} sx={{ mb: 3 }}>
                <Toolbar sx={{ 
                    minWidth: '800px',
                    overflowX: 'auto',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 2,
                    '&::-webkit-scrollbar': {
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        },
                    },
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                        <IconButton edge="start" color="inherit" onClick={handleBack} sx={{ mr: 2, flexShrink: 0 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h4" sx={{ flexGrow: 1, flexShrink: 0, fontWeight: 'bold' }}>
                            매물 관리
                        </Typography>
                    </Box>
                    <Box sx={{ 
                        display: "flex", 
                        gap: 2, 
                        alignItems: "center",
                        flexWrap: 'nowrap',
                        width: '100%',
                    }}>
                        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                            {/* Neighborhood selection temporarily disabled for future enhancement
                            <FormControl size="medium" sx={{ width: '300px' }}>
                                <InputLabel>동 선택</InputLabel>
                                <Select
                                    value={selectedNeighborhood}
                                    label="동 선택"
                                    onChange={(e) => {
                                        setSelectedNeighborhood(e.target.value)
                                        setLocationSearch(e.target.value)
                                        handleLocationSearch()
                                    }}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                maxHeight: 300,
                                                maxWidth: '60%',
                                                '& .MuiMenuItem-root': {
                                                    width: '33.33%',
                                                    display: 'inline-block',
                                                    padding: '8px 16px',
                                                    textAlign: 'center',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    boxSizing: 'border-box'
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value="">
                                        <em>전체</em>
                                    </MenuItem>
                                    {neighborhoods.map((neighborhood) => (
                                        <MenuItem key={neighborhood} value={neighborhood}>
                                            {neighborhood}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            */}
                            <FormControl size="medium" sx={{ minWidth: 200, flexShrink: 0 }}>
                                <InputLabel>매물 유형</InputLabel>
                                <Select
                                    multiple
                                    value={typeFilter}
                                    label="매물 유형"
                                    onChange={handleTypeFilterChange}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    <MenuItem value="아파트">아파트</MenuItem>
                                    <MenuItem value="오피스텔">오피스텔</MenuItem>
                                    <MenuItem value="빌라">빌라</MenuItem>
                                    <MenuItem value="아파트분양권">아파트분양권</MenuItem>
                                    <MenuItem value="오피스텔분양권">오피스텔분양권</MenuItem>
                                    <MenuItem value="재건축">재건축</MenuItem>
                                    <MenuItem value="전원주택">전원주택</MenuItem>
                                    <MenuItem value="단독/다가구">단독/다가구</MenuItem>
                                    <MenuItem value="상가주택">상가주택</MenuItem>
                                    <MenuItem value="한옥주택">한옥주택</MenuItem>
                                    <MenuItem value="재개발">재개발</MenuItem>
                                    <MenuItem value="원룸">원룸</MenuItem>
                                    <MenuItem value="고시원">고시원</MenuItem>
                                    <MenuItem value="상가">상가</MenuItem>
                                    <MenuItem value="사무실">사무실</MenuItem>
                                    <MenuItem value="공장/창고">공장/창고</MenuItem>
                                    <MenuItem value="건물">건물</MenuItem>
                                    <MenuItem value="토지">토지</MenuItem>
                                    <MenuItem value="지식산업센터">지식산업센터</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="medium" sx={{ minWidth: 200, flexShrink: 0 }}>
                                <InputLabel>거래 유형</InputLabel>
                                <Select
                                    multiple
                                    value={tradeTypeFilter}
                                    label="거래 유형"
                                    onChange={handleTradeTypeFilterChange}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    <MenuItem value="매매">매매</MenuItem>
                                    <MenuItem value="전세">전세</MenuItem>
                                    <MenuItem value="월세">월세</MenuItem>
                                    <MenuItem value="단기임대">단기임대</MenuItem>
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                <TextField
                                    size="medium"
                                    placeholder="최소 가격"
                                    value={minPrice}
                                    onChange={handleMinPriceChange}
                                    onKeyPress={(e) => e.key === 'Enter' && handlePriceFilter()}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                    }}
                                    sx={{ width: 150 }}
                                />
                                <Typography>~</Typography>
                                <TextField
                                    size="medium"
                                    placeholder="최대 가격"
                                    value={maxPrice}
                                    onChange={handleMaxPriceChange}
                                    onKeyPress={(e) => e.key === 'Enter' && handlePriceFilter()}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                    }}
                                    sx={{ width: 150 }}
                                />
                                <IconButton size="medium" onClick={handlePriceFilter}>
                                    <Search />
                                </IconButton>
                            </Box>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>
{/* 
            {!loading && !error && articles.length > 0 && (
            <Box sx={{ mb: 3 }}>
                <div id="map" ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
            </Box>
            )}
 */}
            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            ) : articles.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    매물이 없습니다.
                </Alert>
            ) : (
                <Box sx={{ 
                    minWidth: '800px', // Set the same minimum width as the toolbar
                    overflowX: 'auto', // Enable horizontal scrolling
                    '&::-webkit-scrollbar': {
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        },
                    },
                }}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width="40%">매물 정보</TableCell>
                                    <TableCell width="20%">가격</TableCell>
                                    <TableCell width="20%">위치</TableCell>
                                    <TableCell width="20%">정보 제공</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {articles.map((article, index) => (
                                    <React.Fragment key={`${article.id}-${index}`}>
                                        <TableRow
                                            hover
                                            onClick={() => handleArticleClick(article)}
                                            sx={{ 
                                                cursor: "pointer",
                                                bgcolor: selectedArticle?.id === article.id ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                                            }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <Box 
                                                        sx={{ 
                                                            width: 100, 
                                                            height: 100, 
                                                            bgcolor: 'grey.200',
                                                            borderRadius: 1,
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {article.imageUrl ? (
                                                            <img 
                                                                src={`https://landthumb-phinf.pstatic.net/${encodeURI(article.imageUrl)}`} 
                                                                alt={article.name}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = '';
                                                                    target.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <Box 
                                                                sx={{ 
                                                                    width: '100%', 
                                                                    height: '100%', 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center',
                                                                    bgcolor: getTypeColor(article.realEstateType),
                                                                    color: 'white'
                                                                }}
                                                            >
                                                                <Typography variant="h4" sx={{ fontSize: '3rem', lineHeight: 1 }}>
                                                                    {getTypeEmoji(article.realEstateType)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {article.buildingName || article.name}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
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
                                                        <Typography variant="body2" color="text.secondary">
                                                            {article.direction && `${article.direction}`}
                                                            {article.subwayInfo && ` · ${article.subwayInfo}`}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {article.tradeType === "매매" ? "매매가" : "보증금"} {isZeroPrice(article.price) ? "X" : formatPrice(article.price)}
                                                    </Typography>
                                                    {(article.tradeType === "전세" || article.tradeType === "월세" || article.tradeType === "단기임대") && article.rentPrice > 0 && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            월세 {formatPrice(article.rentPrice)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {article.cortarName || "-"}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {article.roadAddressName || article.lotAddressName || "-"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {article.companyName ? `${article.companyName} 제공` : "-"}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {article.agentName || "-"}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                        {selectedArticle?.id === article.id && (
                                            <TableRow>
                                                <TableCell colSpan={4} sx={{ p: 0 }}>
                                                    <Paper sx={{ m: 1, p: 2 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                            <Typography variant="h4" fontWeight="bold">
                                                                {selectedArticle.buildingName || selectedArticle.name}
                                                            </Typography>
                                                            <IconButton size="small" onClick={() => setSelectedArticle(null)}>
                                                                <Close />
                                                            </IconButton>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                                            <Box sx={{ width: '40%' }}>
                                                                {selectedArticle.imageUrl ? (
                                                                    <img 
                                                                        src={`https://landthumb-phinf.pstatic.net/${encodeURI(selectedArticle.imageUrl)}`} 
                                                                        alt={selectedArticle.name}
                                                                        style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px' }}
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.src = '';
                                                                            target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Box 
                                                                        sx={{ 
                                                                            width: '100%',
                                                                            aspectRatio: '1/1',
                                                                            display: 'flex', 
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center', 
                                                                            justifyContent: 'center',
                                                                            bgcolor: getTypeColor(selectedArticle.realEstateType),
                                                                            color: 'white',
                                                                            borderRadius: '8px',
                                                                            gap: 1
                                                                        }}
                                                                    >
                                                                        <Typography variant="h1" sx={{ fontSize: '12rem', lineHeight: 1 }}>
                                                                            {getTypeEmoji(selectedArticle.realEstateType)}
                                                                        </Typography>
                                                                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                                            {selectedArticle.realEstateType}
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                            <Grid container spacing={2} sx={{ width: '60%' }}>
                                                                <Grid item xs={6}>
                                                                    <Box sx={{ mb: 2 }}>
                                                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>기본 정보</Typography>
                                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                            <Box sx={{ display: 'flex' }}>
                                                                                <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>매물 유형:</Typography>
                                                                                <Chip
                                                                                    label={selectedArticle.realEstateType}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        bgcolor: getTypeColor(selectedArticle.realEstateType),
                                                                                        color: "white",
                                                                                    }}
                                                                                />
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex' }}>
                                                                                <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>거래 유형:</Typography>
                                                                                <Chip
                                                                                    label={selectedArticle.tradeType}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        bgcolor: getTradeTypeColor(selectedArticle.tradeType),
                                                                                        color: "white",
                                                                                    }}
                                                                                />
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex' }}>
                                                                                <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>
                                                                                    {selectedArticle.tradeType === "매매" ? "매매가" : "보증금"}:
                                                                                </Typography>
                                                                                <Typography variant="body2">
                                                                                    {isZeroPrice(selectedArticle.price) 
                                                                                        ? "X" 
                                                                                        : formatPrice(selectedArticle.price)}
                                                                                </Typography>
                                                                            </Box>
                                                                            {selectedArticle.rentPrice > 0 && (
                                                                                <Box sx={{ display: 'flex' }}>
                                                                                    <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>월세:</Typography>
                                                                                    <Typography variant="body2">{formatPrice(selectedArticle.rentPrice)}</Typography>
                                                                                </Box>
                                                                            )}
                                                                            <Box sx={{ display: 'flex' }}>
                                                                                <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>등록일:</Typography>
                                                                                <Typography variant="body2">{formatDate(selectedArticle.confirmedAt)}</Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    </Box>
                                                                </Grid>
                                                                <Grid item xs={6}>
                                                                    <Box sx={{ mb: 2 }}>
                                                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>위치 정보</Typography>
                                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                            <Box sx={{ display: 'flex' }}>
                                                                                <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>법정동:</Typography>
                                                                                <Typography variant="body2">{selectedArticle.cortarName || "-"}</Typography>
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex' }}>
                                                                                <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>주소:</Typography>
                                                                                <Typography variant="body2">
                                                                                    {selectedArticle.roadAddressName || selectedArticle.lotAddressName || "-"}
                                                                                </Typography>
                                                                            </Box>
                                                                            {selectedArticle.direction && selectedArticle.direction !== "" && (
                                                                                <Box sx={{ display: 'flex' }}>
                                                                                    <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>방향:</Typography>
                                                                                    <Typography variant="body2">{selectedArticle.direction}</Typography>
                                                                                </Box>
                                                                            )}
                                                                            {selectedArticle.subwayInfo && (
                                                                                <Box sx={{ display: 'flex' }}>
                                                                                    <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>지하철:</Typography>
                                                                                    <Typography variant="body2">{selectedArticle.subwayInfo}</Typography>
                                                                                </Box>
                                                                            )}
                                                                        </Box>
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>중개사 정보</Typography>
                                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                                            <Box sx={{ display: 'flex' }}>
                                                                                <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>정보 제공:</Typography>
                                                                                <Typography variant="body2">{selectedArticle.companyName ? `${selectedArticle.companyName} 제공` : "-"}</Typography>
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex' }}>
                                                                                <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>담당:</Typography>
                                                                                <Typography variant="body2">{selectedArticle.agentName || "-"}</Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    </Box>
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                    </Paper>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Infinite scroll observer */}
            <Box ref={observerTarget} sx={{ height: 20, my: 2 }} />

            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}
        </Box>
    )
}

export default ArticleList