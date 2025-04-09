"use client"

import React, { useState, useEffect, useRef } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    AppBar,
    Toolbar,
    TextField,
    InputAdornment,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    CardMedia,
    CardActionArea,
} from "@mui/material"
import { Add, Search, ArrowBack, Delete, Edit, LocationOn, Home, Business, DirectionsSubway, Close } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { articleApi } from "../services/articleApi"
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
                // For multiple values, we need to add them as separate parameters
                // We'll use a different approach to ensure they're sent as repeated parameters
                params.realEstateType = typeFilter
            }
            
            // Add tradeType filters if any are selected
            if (tradeTypeFilter.length > 0) {
                // For multiple values, we need to add them as separate parameters
                // We'll use a different approach to ensure they're sent as repeated parameters
                params.tradeType = tradeTypeFilter
            }
            
            // Add search term if provided
            if (searchTerm) {
                params.name = searchTerm
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
            setSelectedArticle(null)
        } else {
            setSelectedArticle(article)
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
            year: '2-digit',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\./g, '.');
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

    return (
        <Box sx={{ p: 3 }}>
            <AppBar position="static" color="default" elevation={0} sx={{ mb: 3 }}>
                <Toolbar sx={{ 
                    minWidth: '1000px', // Set minimum width for the toolbar
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
                    <IconButton edge="start" color="inherit" onClick={handleBack} sx={{ mr: 2, flexShrink: 0 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, flexShrink: 0, mr: 2}}>
                        매물 관리
                    </Typography>
                    <Box sx={{ 
                        display: "flex", 
                        gap: 2, 
                        alignItems: "center",
                        flexWrap: 'nowrap', // Prevent wrapping
                        minWidth: '600px', // Set minimum width for the filters
                    }}>
                        <TextField
                            size="small"
                            placeholder="매물명 검색"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={handleSearch}>
                                            <Search />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ flexShrink: 0 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120, flexShrink: 0 }}>
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
                        <FormControl size="small" sx={{ minWidth: 120, flexShrink: 0 }}>
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
                                size="small"
                                placeholder="최소 가격"
                                value={minPrice}
                                onChange={handleMinPriceChange}
                                onKeyPress={(e) => e.key === 'Enter' && handlePriceFilter()}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                }}
                                sx={{ width: 120 }}
                            />
                            <Typography>~</Typography>
                            <TextField
                                size="small"
                                placeholder="최대 가격"
                                value={maxPrice}
                                onChange={handleMaxPriceChange}
                                onKeyPress={(e) => e.key === 'Enter' && handlePriceFilter()}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                }}
                                sx={{ width: 120 }}
                            />
                            <IconButton size="small" onClick={handlePriceFilter}>
                                <Search />
                            </IconButton>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

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
                                    <TableCell>매물명</TableCell>
                                    <TableCell>매물 유형</TableCell>
                                    <TableCell>거래 유형</TableCell>
                                    <TableCell>매매가</TableCell>
                                    <TableCell>동네</TableCell>
                                    <TableCell>등록일</TableCell>
                                    <TableCell>담당 부동산</TableCell>
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
                                            <TableCell>{article.name}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={article.realEstateType}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getTypeColor(article.realEstateType),
                                                        color: "white",
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={article.tradeType}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getTradeTypeColor(article.tradeType),
                                                        color: "white",
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {isZeroPrice(article.price) ? "X" : formatPrice(article.price)}
                                            </TableCell>
                                            <TableCell>
                                                {article.cortarName || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(article.confirmedAt)}
                                            </TableCell>
                                            <TableCell>{article.agentName || "-"}</TableCell>
                                        </TableRow>
                                        {selectedArticle?.id === article.id && (
                                            <TableRow>
                                                <TableCell colSpan={7} sx={{ p: 0 }}>
                                                    <Paper sx={{ m: 1, p: 2 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                            <Typography variant="subtitle1" fontWeight="bold">매물 상세 정보</Typography>
                                                            <IconButton size="small" onClick={() => setSelectedArticle(null)}>
                                                                <Close />
                                                            </IconButton>
                                                        </Box>
                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12}>
                                                                <Box sx={{ mb: 1 }}>
                                                                    <Typography variant="body2" fontWeight="bold">기본 정보</Typography>
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                                                        <Box sx={{ display: 'flex' }}>
                                                                            <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>매물명:</Typography>
                                                                            <Typography variant="body2">{selectedArticle.name}</Typography>
                                                                        </Box>
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
                                                                            <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>매매가:</Typography>
                                                                            <Typography variant="body2">
                                                                                {isZeroPrice(selectedArticle.price) ? "X" : formatPrice(selectedArticle.price)}
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
                                                            <Grid item xs={12} md={6}>
                                                                <Box sx={{ mb: 1 }}>
                                                                    <Typography variant="body2" fontWeight="bold">위치 정보</Typography>
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                                                        <Box sx={{ display: 'flex' }}>
                                                                            <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>지역:</Typography>
                                                                            <Typography variant="body2">{selectedArticle.cortarName || "-"}</Typography>
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex' }}>
                                                                            <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>위도/경도:</Typography>
                                                                            <Typography variant="body2">
                                                                                {selectedArticle.latitude && selectedArticle.longitude
                                                                                    ? `${selectedArticle.latitude}, ${selectedArticle.longitude}`
                                                                                    : "-"}
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
                                                            </Grid>
                                                            <Grid item xs={12} md={6}>
                                                                <Box sx={{ mb: 1 }}>
                                                                    <Typography variant="body2" fontWeight="bold">중개사 정보</Typography>
                                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                                                        <Box sx={{ display: 'flex' }}>
                                                                            <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>중개사:</Typography>
                                                                            <Typography variant="body2">{selectedArticle.companyName}</Typography>
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex' }}>
                                                                            <Typography variant="body2" sx={{ width: '100px', fontWeight: 'bold' }}>담당 부동산:</Typography>
                                                                            <Typography variant="body2">{selectedArticle.agentName || "-"}</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
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