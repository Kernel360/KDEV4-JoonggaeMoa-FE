"use client"

import type React from "react"
import {useCallback, useEffect, useRef, useState} from "react"
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material"
import {Add, ArrowBack, CalendarMonth, ChevronLeft, ChevronRight} from "@mui/icons-material"
import {useNavigate} from "react-router-dom"
import {consultationApi} from "../services/consultationApi"
import {customerApi} from "../services/customerApi"
import type {ConsultationMonthInfo, ConsultationResponse} from "../types/consultation"
import {ConsultationStatus, ConsultationType} from "../types/consultation"

// 상담 상태별 칩 색상 및 텍스트 - 새로운 상태 값에 맞게 업데이트
const statusConfig = {
    [ConsultationStatus.WAITING]: {color: "#e3f2fd", textColor: "#1976d2", label: "예약 대기"},
    [ConsultationStatus.CONFIRMED]: {color: "#fff8e1", textColor: "#f57c00", label: "예약 확정"},
    [ConsultationStatus.COMPLETED]: {color: "#e8f5e9", textColor: "#2e7d32", label: "진행 완료"},
    [ConsultationStatus.CANCELED]: {color: "#ffebee", textColor: "#c62828", label: "예약 취소"},
}

// 상담 유형별 텍스트
const typeConfig = {
    [ConsultationType.VISIT]: "방문 상담",
    [ConsultationType.CALL]: "전화 상담",
    [ConsultationType.VIDEO]: "화상 상담",
}

// 날짜 문자열을 Date 객체로 변환하는 함수
const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null

    try {
        // "yyyyMMdd HH:mm" 형식 처리 (예: "20240327 14:30")
        if (dateString.includes(" ")) {
            const [datePart, timePart] = dateString.split(" ")

            // 날짜 부분이 yyyyMMdd 형식인 경우
            if (datePart.length === 8) {
                const year = Number.parseInt(datePart.substring(0, 4))
                const month = Number.parseInt(datePart.substring(4, 6)) - 1 // 월은 0-11
                const day = Number.parseInt(datePart.substring(6, 8))

                // 시간 부분 처리
                let hours = 0,
                    minutes = 0
                if (timePart && timePart.includes(":")) {
                    const [hoursStr, minutesStr] = timePart.split(":")
                    hours = Number.parseInt(hoursStr)
                    minutes = Number.parseInt(minutesStr)
                }

                return new Date(year, month, day, hours, minutes)
            }
        }

        // ISO 형식 또는 다른 표준 형식 시도
        const date = new Date(dateString)
        if (!isNaN(date.getTime())) {
            return date
        }

        return null
    } catch (error) {
        console.error("날짜 파싱 오류:", error, dateString)
        return null
    }
}

// 날짜를 yyyy-MM-dd 형식으로 변환하는 함수
const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

// status information
interface ConsultationStatusInfo {
    consultationAll: number;
    consultationWaiting: number;
    consultationConfirmed: number;
    consultationCancelled: number;
    consultationCompleted: number;
}

const ConsultationList = () => {
    const navigate = useNavigate()
    const [consultations, setConsultations] = useState<ConsultationResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentSearchTerm, setCurrentSearchTerm] = useState("")

    // 날짜별 필터링
    const [dateFilteredConsultations, setDateFilteredConsultations] = useState<ConsultationResponse[]>([])

    // 현재 월 상태
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()) // 오늘 날짜로 초기화

    // 상태 변경 관련 상태
    const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedConsultation, setSelectedConsultation] = useState<number | null>(null)
    const [statusLoading, setStatusLoading] = useState(false)
    const [statusSuccess, setStatusSuccess] = useState(false)
    const [statusError, setStatusError] = useState<string | null>(null)

    // 상담 등록 모달 관련 상태
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [customers, setCustomers] = useState<{ id: number; name: string; phone: string }[]>([])
    const [customersLoading, setCustomersLoading] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string; phone: string } | null>(null)
    const [scheduledDate, setScheduledDate] = useState("")
    const [scheduledTime, setScheduledTime] = useState("")
    const [createLoading, setCreateLoading] = useState(false)
    const [createSuccess, setCreateSuccess] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    // 고객 목록 페이지네이션 관련 상태
    const [cursor, setCursor] = useState<number | undefined>(undefined)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMoreCustomers, setIsLoadingMoreCustomers] = useState(false)
    const observer = useRef<IntersectionObserver | null>(null)
    const lastCustomerRef = useRef<HTMLDivElement | null>(null)

    // 상태별 상담 목록 관련 상태
    const [statusFilteredConsultations, setStatusFilteredConsultations] = useState<ConsultationResponse[]>([])
    const [selectedStatus, setSelectedStatus] = useState<ConsultationStatus | null>(null)
    const [statusListLoading, setStatusListLoading] = useState(false)
    const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null)

    const fetchCustomers = async (cursorId?: number) => {
        try {
            if (cursorId === undefined) {
                setCustomersLoading(true)
            } else {
                setIsLoadingMoreCustomers(true)
            }

            const response = await customerApi.getInfiniteCustomers(cursorId, searchTerm)

            if (response.data.success && response.data.data) {
                const newCustomers = response.data.data.content

                if (cursorId === undefined) {
                    setCustomers(newCustomers)
                } else {
                    setCustomers(prev => [...prev, ...newCustomers])
                }

                // 마지막 고객의 ID를 커서로 설정
                if (newCustomers.length > 0) {
                    setCursor(newCustomers[newCustomers.length - 1].id)
                }

                // 더 이상 데이터가 없으면 hasMore를 false로 설정
                setHasMore(!response.data.data.last)
            } else {
                setError("고객 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching customers:", err)
            setError("고객 목록을 불러오는데 실패했습니다.")
        } finally {
            setCustomersLoading(false)
            setIsLoadingMoreCustomers(false)
        }
    }

    // 검색어가 변경될 때마다 고객 목록 초기화
    useEffect(() => {
        setCustomers([])
        setCursor(undefined)
        setHasMore(true)
        fetchCustomers()
    }, [searchTerm])

    // 무한 스크롤을 위한 콜백 함수
    const lastCustomerRefCallback = useCallback((node: HTMLDivElement | null) => {
        if (customersLoading || isLoadingMoreCustomers) return

        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchCustomers(cursor)
            }
        })

        if (node) observer.current.observe(node)
        lastCustomerRef.current = node
    }, [customersLoading, hasMore, isLoadingMoreCustomers, cursor])

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        setCurrentSearchTerm(searchTerm)
        setCustomers([])
        setCursor(undefined)
        setHasMore(true)
        fetchCustomers()
    }

    // 이전 달로 이동
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    // 다음 달로 이동
    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    // 해당 월의 일수 구하기
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    // 해당 월의 첫 날 요일 구하기 (0: 일요일, 6: 토요일)
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay()
    }

    // 현재 월의 캘린더 데이터 생성
    const generateCalendarData = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const daysInMonth = getDaysInMonth(year, month)
        const firstDayOfMonth = getFirstDayOfMonth(year, month)

        const days = []
        // 이전 달의 일부 날짜 채우기
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null)
        }

        // 현재 달의 날짜 채우기
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i))
        }

        // 7일씩 그룹화
        const weeks = []
        let week = []
        days.forEach((day, index) => {
            week.push(day)
            if (index % 7 === 6 || index === days.length - 1) {
                weeks.push(week)
                week = []
            }
        })

        return weeks
    }

    // 상태별 상담 목록 가져오기
    const fetchConsultationsByStatus = async (status: ConsultationStatus) => {
        try {
            setStatusListLoading(true);
            setSelectedStatus(status);
            setSelectedDate(null); // 날짜 선택 해제

            const monthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            const response = await consultationApi.getConsultationsByStatus(monthString, status);

            if (response.data.success && response.data.data) {
                setStatusFilteredConsultations(response.data.data);
            } else {
                setStatusFilteredConsultations([]);
            }
        } catch (err) {
            console.error("Error fetching consultations by status:", err);
            setStatusFilteredConsultations([]);
        } finally {
            setStatusListLoading(false);
        }
    };

    // 날짜를 선택했을 때 처리
    const handleDateClick = async (date: Date) => {
        setSelectedDate(date);
        setSelectedStatus(null); // 상태 선택 해제
        try {
            setLoading(true);
            setError(null);
            const formattedDate = `${formatDateToYYYYMMDD(date)}T00:00`;
            const response = await consultationApi.getConsultationsByDate(formattedDate);

            if (response.data.success && response.data.data) {
                const consultations = response.data.data;
                const formattedConsultations = consultations.map((item) => ({
                    consultationId: item.consultationId,
                    customerId: item.customerId,
                    customerName: item.customerName,
                    customerPhone: item.customerPhone,
                    date: item.date || "",
                    purpose: item.purpose || "",
                    memo: item.memo || "",
                    consultationStatus: item.consultationStatus || ConsultationStatus.WAITING
                })) as ConsultationResponse[];

                console.log('API Response:', consultations); // Add this for debugging
                console.log('Formatted Consultations:', formattedConsultations); // Add this for debugging

                setDateFilteredConsultations(formattedConsultations);
            } else {
                setDateFilteredConsultations([]);
            }
        } catch (err) {
            console.error("Error fetching consultations:", err);
            setDateFilteredConsultations([]);
        } finally {
            setLoading(false);
        }
    };

    // 상담 상세 페이지로 이동
    const handleViewConsultation = (consultationId: number) => {
        navigate(`/consultation/${consultationId}`);
    }

    // 상태 변경 메뉴 열기
    const handleStatusMenuOpen = (event: React.MouseEvent<HTMLDivElement>, consultationId: number) => {
        event.stopPropagation()
        setStatusAnchorEl(event.currentTarget)
        setSelectedConsultation(consultationId)
    }

    // 상태 변경 메뉴 닫기
    const handleStatusMenuClose = () => {
        setStatusAnchorEl(null)
        setSelectedConsultation(null)
    }

    // 상담 상태 변경
    const handleStatusChange = async (consultationId: number, newStatus: ConsultationStatus) => {
        try {
            setStatusLoading(true);
            await consultationApi.updateConsultationStatus(consultationId, newStatus);

            // Update the consultation in the list
            setDateFilteredConsultations(prevConsultations =>
                prevConsultations.map(consultation =>
                    consultation.consultationId === consultationId
                        ? {...consultation, consultationStatus: newStatus}
                        : consultation
                )
            );

            // Also update in status filtered consultations if applicable
            if (selectedStatus) {
                setStatusFilteredConsultations(prevConsultations =>
                    prevConsultations.map(consultation =>
                        consultation.consultationId === consultationId
                            ? {...consultation, consultationStatus: newStatus}
                            : consultation
                    )
                );
            }

            // Update the monthInfo state to reflect the status change
            setMonthInfo(prevInfo => {
                // Find the consultation to get its previous status
                const consultation = [...dateFilteredConsultations, ...statusFilteredConsultations]
                    .find(c => c.consultationId === consultationId);

                if (!consultation) return prevInfo;

                const prevStatus = consultation.consultationStatus;

                // Create a new monthInfo object with updated counts
                const newInfo = {...prevInfo};

                // Decrease count for the previous status
                if (prevStatus === ConsultationStatus.WAITING) {
                    newInfo.consultationWaiting = Math.max(0, newInfo.consultationWaiting - 1);
                } else if (prevStatus === ConsultationStatus.CONFIRMED) {
                    newInfo.consultationConfirmed = Math.max(0, newInfo.consultationConfirmed - 1);
                } else if (prevStatus === ConsultationStatus.COMPLETED) {
                    newInfo.consultationCompleted = Math.max(0, newInfo.consultationCompleted - 1);
                } else if (prevStatus === ConsultationStatus.CANCELED) {
                    newInfo.consultationCancelled = Math.max(0, newInfo.consultationCancelled - 1);
                }

                // Increase count for the new status
                if (newStatus === ConsultationStatus.WAITING) {
                    newInfo.consultationWaiting += 1;
                } else if (newStatus === ConsultationStatus.CONFIRMED) {
                    newInfo.consultationConfirmed += 1;
                } else if (newStatus === ConsultationStatus.COMPLETED) {
                    newInfo.consultationCompleted += 1;
                } else if (newStatus === ConsultationStatus.CANCELED) {
                    newInfo.consultationCancelled += 1;
                }

                // Update the daysCount array if the consultation date is in the current month
                if (consultation.date) {
                    const consultationDate = parseDate(consultation.date);
                    if (consultationDate) {
                        const consultationMonth = consultationDate.getMonth();
                        const currentMonth = currentDate.getMonth();

                        // Only update if the consultation is in the current month
                        if (consultationMonth === currentMonth) {
                            const dayIndex = consultationDate.getDate() - 1;

                            // Make sure the dayIndex is valid
                            if (dayIndex >= 0 && dayIndex < newInfo.daysCount.length) {
                                // If the status is changing to CANCELED, decrease the count for that day
                                if (newStatus === ConsultationStatus.CANCELED && prevStatus !== ConsultationStatus.CANCELED) {
                                    newInfo.daysCount[dayIndex] = Math.max(0, newInfo.daysCount[dayIndex] - 1);
                                }
                                // If the status is changing from CANCELED to another status, increase the count for that day
                                else if (prevStatus === ConsultationStatus.CANCELED && newStatus !== ConsultationStatus.CANCELED) {
                                    newInfo.daysCount[dayIndex] += 1;
                                }
                                // For other status changes, the count remains the same
                            }
                        }
                    }
                }

                return newInfo;
            });

            // Show success message
            setStatusSuccess(true);

            // Close the menu if it's open
            handleStatusMenuClose();
        } catch (err) {
            console.error("Error updating consultation status:", err);
            setStatusError("상담 상태 변경 중 오류가 발생했습니다.");
        } finally {
            setStatusLoading(false);
        }
    }

    // 상담 등록 모달 열기
    const handleCreateModalOpen = () => {
        setCreateModalOpen(true)
        setCustomers([])
        setCursor(undefined)
        setHasMore(true)
        fetchCustomers()
        // 오늘 날짜로 초기화
        const today = new Date()
        setScheduledDate(formatDateToYYYYMMDD(today))
        setScheduledTime("10:00") // 기본 시간 설정
    }

    // 상담 등록 모달 닫기
    const handleCreateModalClose = () => {
        setCreateModalOpen(false)
        setSelectedCustomer(null)
        setScheduledDate("")
        setScheduledTime("")
        setCreateError(null)
    }

    // 상담 등록 처리
    // Add this function near the other useEffect hooks
    const refreshAllData = async () => {
        try {
            // Fetch month information
            const monthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            const monthResponse = await consultationApi.getConsultationMonthInfo(monthString);
            if (monthResponse.data.success) {
                setMonthInfo(monthResponse.data.data);
            }

            // If a date is selected, refresh the consultations for that date
            if (selectedDate) {
                const formattedDate = `${formatDateToYYYYMMDD(selectedDate)}T00:00`;
                const dateResponse = await consultationApi.getConsultationsByDate(formattedDate);
                if (dateResponse.data.success && dateResponse.data.data) {
                    setDateFilteredConsultations(dateResponse.data.data);
                }
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    };

    const handleCreateConsultation = async () => {
        // Check if selected date is in the past
        const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const now = new Date();

        if (selectedDateTime < now) {
            setCreateError("날짜를 제대로 선택해주세요.");
            return;
        }

        try {
            setCreateLoading(true);
            setCreateError(null);

            const date = `${scheduledDate} ${scheduledTime}`;
            const consultationData = {
                customerId: selectedCustomer.id,
                date: date,
            };

            const response = await consultationApi.createConsultation(consultationData);

            if (response.data.success) {
                setCreateSuccess(true);
                handleCreateModalClose();
                // Add this line to refresh data after successful creation
                await refreshAllData();
            } else {
                setCreateError(response.data.error?.message || "상담 등록에 실패했습니다.");
            }
        } catch (err: any) {
            console.error("Error creating consultation:", err);
            setCreateError(err.response?.data?.error?.message || "상담 등록에 실패했습니다.");
        } finally {
            setCreateLoading(false);
        }
    };

    // 검색어로 필터링 - customer 객체가 존재하는지 확인하는 안전 검사 추가
    const filteredConsultations = consultations.filter((consultation) => {
        // 검색어 필터링
        const searchMatch =
            consultation.customerName.includes(searchTerm) ||
            consultation.customerPhone.includes(searchTerm)

        return searchMatch
    })

    // 캘린더 데이터
    const calendarData = generateCalendarData()

    // 상단 요약 정보 계산 - 날짜 파싱 로직 수정
    const today = new Date()
    const todayString = formatDateToYYYYMMDD(today)


    const scheduledCount = consultations.filter((c) => c.consultationStatus === ConsultationStatus.CONFIRMED).length
    const completedCount = consultations.filter((c) => c.consultationStatus === ConsultationStatus.COMPLETED).length

    // 날짜 형식화 함수 - 화면 표시용
    const formatDateTime = (dateString: string): string => {
        const date = parseDate(dateString)
        if (!date) return "날짜 정보 없음"

        return date.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }


    // Add monthInfo state
    const [monthInfo, setMonthInfo] = useState<ConsultationMonthInfo>({
        consultationAll: 0,
        consultationWaiting: 0,
        consultationConfirmed: 0,
        consultationCancelled: 0,
        consultationCompleted: 0,
        daysCount: Array(31).fill(0)  // Initialize with 31 zeros
    });

    // Replace the old consultation counts effect
    useEffect(() => {
        const fetchMonthInfo = async () => {
            try {
                const monthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                const monthResponse = await consultationApi.getConsultationMonthInfo(monthString);
                if (monthResponse.data.success) {
                    setMonthInfo(monthResponse.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch month information:', error);
            }
        };

        fetchMonthInfo();
    }, [currentDate]);

    // Add effect to fetch today's consultations when component mounts
    useEffect(() => {
        if (selectedDate) {
            handleDateClick(selectedDate);
        }
    }, []); // Empty dependency array means this runs once when component mounts

    // 상태 요약 카드 클릭 핸들러
    const handleStatusCardClick = (status: ConsultationStatus) => {
        fetchConsultationsByStatus(status);
    };

    // Update the summary information section in the render
    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh", overflow: "auto"}}>
            <Container maxWidth="lg" sx={{mt: 4, mb: 4, mx: "auto", px: {xs: 2, sm: 3, md: 4}}}>
                <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3}}>
                    <Box sx={{display: "flex", alignItems: "center"}}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{mr: 1}}>
                            <ArrowBack/>
                        </IconButton>
                        <Typography variant="h6" sx={{fontWeight: "bold"}}>
                            상담 관리
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add/>}
                        sx={{
                            bgcolor: "#007ea7",
                            "&:hover": {bgcolor: "#003459"},
                        }}
                        onClick={handleCreateModalOpen}
                    >
                        상담 등록
                    </Button>
                </Box>

                {/* 요약 정보 */}
                <Grid container spacing={3} sx={{mb: 3}}>
                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow: '0 4px 8px -1px rgba(0, 0, 0, 0.2), 0 2px 6px -1px rgba(0, 0, 0, 0.15)',
                                "&:hover": {
                                    bgcolor: "rgba(0, 126, 167, 0.08)",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15)"
                                }
                            }}
                            onClick={() => handleStatusCardClick(ConsultationStatus.WAITING)}
                        >
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                상담 대기
                            </Typography>
                            <Typography variant="h3" sx={{color: "#2196f3", fontWeight: "bold"}}>
                                {monthInfo.consultationWaiting}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow: '0 4px 8px -1px rgba(0, 0, 0, 0.2), 0 2px 6px -1px rgba(0, 0, 0, 0.15)',
                                "&:hover": {
                                    bgcolor: "rgba(0, 126, 167, 0.08)",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15)"
                                }
                            }}
                            onClick={() => handleStatusCardClick(ConsultationStatus.CONFIRMED)}
                        >
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                상담 확정
                            </Typography>
                            <Typography variant="h3" sx={{color: "#ff9800", fontWeight: "bold"}}>
                                {monthInfo.consultationConfirmed}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow: '0 4px 8px -1px rgba(0, 0, 0, 0.2), 0 2px 6px -1px rgba(0, 0, 0, 0.15)',
                                "&:hover": {
                                    bgcolor: "rgba(0, 126, 167, 0.08)",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15)"
                                }
                            }}
                            onClick={() => handleStatusCardClick(ConsultationStatus.COMPLETED)}
                        >
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                완료된 상담
                            </Typography>
                            <Typography variant="h3" sx={{color: "#4caf50", fontWeight: "bold"}}>
                                {monthInfo.consultationCompleted}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
                {/* 캘린더 뷰 */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: 2,
                            boxShadow: '0 4px 8px -1px rgba(0, 0, 0, 0.2), 0 2px 6px -1px rgba(0, 0, 0, 0.15)'
                        }}>
                            <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2}}>
                                <Typography variant="h6">
                                    <CalendarMonth sx={{verticalAlign: "middle", mr: 1}}/>
                                    상담 일정
                                </Typography>
                                <Box>
                                    <IconButton onClick={goToPreviousMonth}>
                                        <ChevronLeft/>
                                    </IconButton>
                                    <Typography variant="subtitle1" component="span" sx={{mx: 2}}>
                                        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                                    </Typography>
                                    <IconButton onClick={goToNextMonth}>
                                        <ChevronRight/>
                                    </IconButton>
                                </Box>
                            </Box>

                            <Divider sx={{mb: 2}}/>

                            <Table sx={{tableLayout: 'fixed', width: '100%'}}> {/* 테이블 레이아웃 고정 및 너비 100% 설정 */}
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" sx={{width: '14.28%'}}>일</TableCell>
                                        <TableCell align="center" sx={{width: '14.28%'}}>월</TableCell>
                                        <TableCell align="center" sx={{width: '14.28%'}}>화</TableCell>
                                        <TableCell align="center" sx={{width: '14.28%'}}>수</TableCell>
                                        <TableCell align="center" sx={{width: '14.28%'}}>목</TableCell>
                                        <TableCell align="center" sx={{width: '14.28%'}}>금</TableCell>
                                        <TableCell align="center" sx={{width: '14.28%'}}>토</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {calendarData.map((week, weekIndex) => (
                                        <TableRow key={`week-${weekIndex}`}>
                                            {week.map((day, dayIndex) => (
                                                <TableCell
                                                    key={`day-${weekIndex}-${dayIndex}`}
                                                    align="center"
                                                    sx={{
                                                        height: "60px",
                                                        width: "14.28%",
                                                        position: "relative",
                                                        cursor: day ? "pointer" : "default",
                                                        bgcolor: selectedDate && day && selectedDate.toDateString() === day.toDateString()
                                                            ? "#f5f5f5"
                                                            : "inherit",
                                                        color: day
                                                            ? dayIndex === 0
                                                                ? "error.main"
                                                                : dayIndex === 6
                                                                    ? "primary.main"
                                                                    : "inherit"
                                                            : "#aaa",
                                                        padding: '4px', // 셀 패딩 조정
                                                        fontSize: '0.8rem', // 폰트 크기 조정
                                                        overflow: 'hidden', // 내용이 넘칠 경우 숨김 처리
                                                        textOverflow: 'ellipsis', // 넘치는 텍스트를 ...으로 표시
                                                        whiteSpace: 'nowrap', // 텍스트 줄바꿈 방지
                                                    }}
                                                    onClick={() => day && handleDateClick(day)}
                                                >
                                                    {day && (
                                                        <Box sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            height: '100%',
                                                            pt: 1,
                                                            overflow: 'hidden' // Box 내부 내용이 넘칠 경우 숨김 처리
                                                        }}>
                                                            <Typography variant="body2" sx={{
                                                                mb: 0.5,
                                                                fontSize: '0.9rem',
                                                                whiteSpace: 'nowrap',
                                                                textOverflow: 'ellipsis',
                                                                overflow: 'hidden'
                                                            }}>{day.getDate()}</Typography>
                                                            {monthInfo.daysCount[day.getDate() - 1] > 0 && (
                                                                <Chip
                                                                    size="small"
                                                                    label={`${monthInfo.daysCount[day.getDate() - 1]}건`}
                                                                    sx={{
                                                                        bgcolor: "#e3f2fd",
                                                                        color: "#1976d2",
                                                                        fontSize: "0.7rem",
                                                                        height: "20px",
                                                                        mt: 'auto',
                                                                        mb: 0.5,
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        maxWidth: '100%' // Chip의 최대 너비 설정
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>

                    {/* 상담 목록 테이블 - 캘린더 오른쪽에 배치 */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: 2,
                            height: '100%',
                            boxShadow: '0 4px 8px -1px rgba(0, 0, 0, 0.2), 0 2px 6px -1px rgba(0, 0, 0, 0.15)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <Typography variant="h6" sx={{mb: 2}}>
                                {selectedStatus
                                    ? `${statusConfig[selectedStatus].label} 상담 목록`
                                    : selectedDate
                                        ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 상담 목록`
                                        : '상담 목록'}
                            </Typography>
                            <TableContainer
                                component={Paper}
                                elevation={0}
                                sx={{
                                    borderRadius: 2,
                                    overflow: "auto",
                                    flex: 1,
                                    maxHeight: 'calc(100% - 60px)', // 타이틀 높이를 뺀 높이
                                    '& .MuiTable-root': {
                                        minWidth: '100%',
                                        tableLayout: 'fixed'
                                    }
                                }}
                            >
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow sx={{
                                            backgroundColor: '#e9ecef',
                                            borderBottom: '1px solid #e9ecef'
                                        }}>
                                            <TableCell sx={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                color: '#003459',
                                                width: '30%'
                                            }}>
                                                고객명
                                            </TableCell>
                                            <TableCell sx={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                color: '#003459',
                                                width: '40%'
                                            }}>
                                                상담 시간
                                            </TableCell>
                                            <TableCell sx={{
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                color: '#003459',
                                                width: '20%'
                                            }}>
                                                상태
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading || statusListLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">
                                                    <CircularProgress size={24}/>
                                                </TableCell>
                                            </TableRow>
                                        ) : selectedStatus ? (
                                            statusFilteredConsultations.length > 0 ? (
                                                statusFilteredConsultations.map((consultation) => (
                                                    <TableRow
                                                        key={consultation.consultationId}
                                                        onClick={() => handleViewConsultation(consultation.consultationId)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid #e9ecef',
                                                            backgroundColor: 'transparent',
                                                            transition: 'background-color 0.2s',
                                                            '&:hover': {
                                                                backgroundColor: '#f8f9fa'
                                                            }
                                                        }}
                                                    >
                                                        <TableCell sx={{
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f',
                                                            maxWidth: '20%',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {consultation.customerName}
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f'
                                                        }}>
                                                            {consultation.date ? formatDateTime(consultation.date) : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={statusConfig[consultation.consultationStatus].label}
                                                                sx={{
                                                                    bgcolor: statusConfig[consultation.consultationStatus].color,
                                                                    color: statusConfig[consultation.consultationStatus].textColor,
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();

                                                                    // Close any other open menu
                                                                    if (openStatusMenuId !== null) {
                                                                        const existingMenu = document.getElementById(`status-menu-${openStatusMenuId}`);
                                                                        if (existingMenu) {
                                                                            document.body.removeChild(existingMenu);
                                                                        }
                                                                    }

                                                                    // Set this menu as the open one
                                                                    setOpenStatusMenuId(consultation.consultationId);

                                                                    // Create a container for the menu that will be positioned relative to the viewport
                                                                    const menuContainer = document.createElement('div');
                                                                    menuContainer.id = `status-menu-${consultation.consultationId}`;
                                                                    menuContainer.style.position = 'fixed';
                                                                    menuContainer.style.zIndex = '1000';

                                                                    // Get the position of the chip relative to the viewport
                                                                    const chipRect = e.currentTarget.getBoundingClientRect();

                                                                    // Position the menu below the chip
                                                                    menuContainer.style.top = `${chipRect.bottom}px`;
                                                                    menuContainer.style.left = `${chipRect.left}px`;

                                                                    // Create the menu content
                                                                    const menu = document.createElement('div');
                                                                    menu.style.backgroundColor = 'white';
                                                                    menu.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                                    menu.style.borderRadius = '4px';
                                                                    menu.style.padding = '4px';

                                                                    Object.values(ConsultationStatus).forEach((status) => {
                                                                        if (status !== consultation.consultationStatus) {
                                                                            const option = document.createElement('div');
                                                                            option.style.padding = '8px 16px';
                                                                            option.style.cursor = 'pointer';
                                                                            option.style.color = statusConfig[status]?.textColor;
                                                                            option.style.backgroundColor = statusConfig[status]?.color;
                                                                            option.style.borderRadius = '4px';
                                                                            option.style.marginBottom = '4px';
                                                                            option.textContent = statusConfig[status]?.label;
                                                                            option.onclick = (e) => {
                                                                                e.stopPropagation();
                                                                                handleStatusChange(consultation.consultationId, status);
                                                                                document.body.removeChild(menuContainer);
                                                                                setOpenStatusMenuId(null);
                                                                            };
                                                                            menu.appendChild(option);
                                                                        }
                                                                    });

                                                                    menuContainer.appendChild(menu);
                                                                    document.body.appendChild(menuContainer);

                                                                    const closeMenu = (e: MouseEvent) => {
                                                                        if (!menuContainer.contains(e.target as Node)) {
                                                                            document.body.removeChild(menuContainer);
                                                                            document.removeEventListener('click', closeMenu);
                                                                            setOpenStatusMenuId(null);
                                                                        }
                                                                    };

                                                                    setTimeout(() => {
                                                                        document.addEventListener('click', closeMenu);
                                                                    }, 0);
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center">
                                                        {`${statusConfig[selectedStatus].label} 상담이 없습니다.`}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        ) : dateFilteredConsultations.length > 0 ? (
                                            dateFilteredConsultations.map((consultation) => (
                                                <TableRow
                                                    key={consultation.consultationId}
                                                    onClick={() => handleViewConsultation(consultation.consultationId)}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #e9ecef',
                                                        backgroundColor: 'transparent',
                                                        transition: 'background-color 0.2s',
                                                        '&:hover': {
                                                            backgroundColor: '#f8f9fa'
                                                        }
                                                    }}
                                                >
                                                    <TableCell sx={{
                                                        padding: '12px 16px',
                                                        fontSize: '0.875rem',
                                                        color: '#00171f',
                                                        maxWidth: '20%',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {consultation.customerName}
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        padding: '12px 16px',
                                                        fontSize: '0.875rem',
                                                        color: '#00171f'
                                                    }}>
                                                        {consultation.date ? formatDateTime(consultation.date) : '-'}
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        padding: '12px 16px',
                                                        fontSize: '0.875rem',
                                                        color: '#00171f'
                                                    }}>
                                                        <Chip
                                                            label={statusConfig[consultation.consultationStatus].label}
                                                            sx={{
                                                                bgcolor: statusConfig[consultation.consultationStatus].color,
                                                                color: statusConfig[consultation.consultationStatus].textColor,
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();

                                                                // Close any other open menu
                                                                if (openStatusMenuId !== null) {
                                                                    const existingMenu = document.getElementById(`status-menu-${openStatusMenuId}`);
                                                                    if (existingMenu) {
                                                                        document.body.removeChild(existingMenu);
                                                                    }
                                                                }

                                                                // Set this menu as the open one
                                                                setOpenStatusMenuId(consultation.consultationId);

                                                                // Create a container for the menu that will be positioned relative to the viewport
                                                                const menuContainer = document.createElement('div');
                                                                menuContainer.id = `status-menu-${consultation.consultationId}`;
                                                                menuContainer.style.position = 'fixed';
                                                                menuContainer.style.zIndex = '1000';

                                                                // Get the position of the chip relative to the viewport
                                                                const chipRect = e.currentTarget.getBoundingClientRect();

                                                                // Position the menu below the chip
                                                                menuContainer.style.top = `${chipRect.bottom}px`;
                                                                menuContainer.style.left = `${chipRect.left}px`;

                                                                // Create the menu content
                                                                const menu = document.createElement('div');
                                                                menu.style.backgroundColor = 'white';
                                                                menu.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                                menu.style.borderRadius = '4px';
                                                                menu.style.padding = '4px';

                                                                Object.values(ConsultationStatus).forEach((status) => {
                                                                    if (status !== consultation.consultationStatus) {
                                                                        const option = document.createElement('div');
                                                                        option.style.padding = '8px 16px';
                                                                        option.style.cursor = 'pointer';
                                                                        option.style.color = statusConfig[status]?.textColor;
                                                                        option.style.backgroundColor = statusConfig[status]?.color;
                                                                        option.style.borderRadius = '4px';
                                                                        option.style.marginBottom = '4px';
                                                                        option.textContent = statusConfig[status]?.label;
                                                                        option.onclick = (e) => {
                                                                            e.stopPropagation();
                                                                            handleStatusChange(consultation.consultationId, status);
                                                                            document.body.removeChild(menuContainer);
                                                                            setOpenStatusMenuId(null);
                                                                        };
                                                                        menu.appendChild(option);
                                                                    }
                                                                });

                                                                menuContainer.appendChild(menu);
                                                                document.body.appendChild(menuContainer);

                                                                const closeMenu = (e: MouseEvent) => {
                                                                    if (!menuContainer.contains(e.target as Node)) {
                                                                        document.body.removeChild(menuContainer);
                                                                        document.removeEventListener('click', closeMenu);
                                                                        setOpenStatusMenuId(null);
                                                                    }
                                                                };

                                                                setTimeout(() => {
                                                                    document.addEventListener('click', closeMenu);
                                                                }, 0);
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">
                                                    {selectedDate ? '예약된 상담이 없습니다.' : '날짜를 선택하세요.'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* 상태 변경 메뉴 */}
            <Menu
                anchorEl={statusAnchorEl}
                open={Boolean(statusAnchorEl)}
                onClose={handleStatusMenuClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <Typography variant="subtitle2" sx={{px: 2, py: 1, fontWeight: "bold"}}>
                    상담 상태 변경
                </Typography>
                <Divider/>
                {Object.values(ConsultationStatus).map((status) => (
                    <MenuItem key={status}
                              onClick={() => selectedConsultation && handleStatusChange(selectedConsultation, status)}
                              disabled={statusLoading}>
                        <Chip
                            label={statusConfig[status]?.label}
                            size="small"
                            sx={{
                                bgcolor: statusConfig[status]?.color,
                                color: statusConfig[status]?.textColor,
                                width: "100%",
                                justifyContent: "center",
                            }}
                        />
                    </MenuItem>
                ))}
            </Menu>

            {/* 상담 등록 모달 */}
            <Dialog
                open={createModalOpen}
                onClose={handleCreateModalClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        maxHeight: '70vh',
                        height: '80vh',
                        '@media (max-width: 900px)': {
                            maxHeight: '90vh',
                            height: '90vh'
                        }
                    }
                }}
            >
                <DialogTitle>상담 등록</DialogTitle>
                <DialogContent sx={{
                    height: 'calc(100% - 120px)',
                    overflow: 'hidden',
                    '@media (max-width: 900px)': {
                        overflow: 'auto'
                    }
                }}>
                    <Box sx={{height: '100%'}}>
                        <Grid container spacing={3} sx={{height: '100%'}}>
                            {/* 왼쪽: 고객 검색 및 리스트 */}
                            <Grid item xs={12} md={6} sx={{
                                height: '100%',
                                '@media (max-width: 900px)': {
                                    height: 'auto',
                                    minHeight: '300px'
                                }
                            }}>
                                <Paper elevation={0} sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    height: '100%',
                                    border: '1px solid #e0e0e0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    '@media (max-width: 900px)': {
                                        height: 'auto'
                                    }
                                }}>
                                    <form onSubmit={handleSearchSubmit}>
                                        <Box sx={{display: 'flex', gap: 1, mb: 2}}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="고객명 또는 전화번호로 검색"
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                            />
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                sx={{
                                                    bgcolor: "#007ea7",
                                                    "&:hover": {bgcolor: "#003459"},
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                검색
                                            </Button>
                                        </Box>
                                    </form>
                                    <Box sx={{
                                        flex: 1,
                                        overflow: 'auto',
                                        '@media (max-width: 900px)': {
                                            flex: 'none',
                                            maxHeight: '300px'
                                        }
                                    }}>
                                        {customersLoading ? (
                                            <Box sx={{display: 'flex', justifyContent: 'center', p: 2}}>
                                                <CircularProgress size={24}/>
                                            </Box>
                                        ) : customers.length === 0 ? (
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                p: 2,
                                                color: 'text.secondary'
                                            }}>
                                                {currentSearchTerm ? '검색 결과가 없습니다.' : '고객을 검색해주세요.'}
                                            </Box>
                                        ) : (
                                            <List>
                                                {customers.map((customer) => (
                                                    <ListItem
                                                        key={customer.id}
                                                        button
                                                        selected={selectedCustomer?.id === customer.id}
                                                        onClick={() => setSelectedCustomer(customer)}
                                                        sx={{
                                                            '&.Mui-selected': {
                                                                bgcolor: 'rgba(0, 126, 167, 0.08)',
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(0, 126, 167, 0.12)',
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={customer.name}
                                                            secondary={customer.phone}
                                                        />
                                                    </ListItem>
                                                ))}
                                                {isLoadingMoreCustomers && (
                                                    <Box sx={{display: 'flex', justifyContent: 'center', p: 2}}>
                                                        <CircularProgress size={24}/>
                                                    </Box>
                                                )}
                                                {hasMore && (
                                                    <Box
                                                        ref={lastCustomerRefCallback}
                                                        sx={{height: '20px'}}
                                                    />
                                                )}
                                            </List>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* 오른쪽: 상담 날짜/시간 설정 */}
                            <Grid item xs={12} md={6} sx={{
                                height: '100%',
                                '@media (max-width: 900px)': {
                                    height: 'auto'
                                }
                            }}>
                                <Paper elevation={0} sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    height: '100%',
                                    border: '1px solid #e0e0e0',
                                    '@media (max-width: 900px)': {
                                        height: 'auto'
                                    }
                                }}>
                                    <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                                        상담 일정
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="상담 날짜"
                                                type="date"
                                                required
                                                value={scheduledDate}
                                                onChange={(e) => {
                                                    const year = e.target.value.split('-')[0];
                                                    if (year.length <= 4) {
                                                        setScheduledDate(e.target.value);
                                                    }
                                                }}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                                inputProps={{
                                                    max: "9999-12-31"
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="상담 시간"
                                                type="time"
                                                required
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateModalClose} disabled={createLoading}>
                        취소
                    </Button>
                    <Button
                        onClick={handleCreateConsultation}
                        variant="contained"
                        disabled={createLoading || !selectedCustomer || !scheduledDate || !scheduledTime}
                        sx={{
                            bgcolor: "#007ea7",
                            "&:hover": {bgcolor: "#003459"}
                        }}
                    >
                        {createLoading ? <CircularProgress size={24}/> : "등록"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 상태 변경 성공 메시지 */}
            <Snackbar open={statusSuccess} autoHideDuration={3000} onClose={() => setStatusSuccess(false)}>
                <Alert onClose={() => setStatusSuccess(false)} severity="success" sx={{width: "100%"}}>
                    상담 상태가 성공적으로 변경되었습니다.
                </Alert>
            </Snackbar>

            {/* 상태 변경 에러 메시지 */}
            <Snackbar open={!!statusError} autoHideDuration={3000} onClose={() => setStatusError(null)}>
                <Alert onClose={() => setStatusError(null)} severity="error" sx={{width: "100%"}}>
                    {statusError}
                </Alert>
            </Snackbar>

            {/* 상담 등록 성공 메시지 */}
            <Snackbar open={createSuccess} autoHideDuration={3000} onClose={() => setCreateSuccess(false)}>
                <Alert onClose={() => setCreateSuccess(false)} severity="success" sx={{width: "100%"}}>
                    상담이 성공적으로 등록되었습니다.
                </Alert>
            </Snackbar>

            {/* 상담 등록 에러 메시지 */}
            <Snackbar open={!!createError} autoHideDuration={3000} onClose={() => setCreateError(null)}>
                <Alert onClose={() => setCreateError(null)} severity="error" sx={{width: "100%"}}>
                    {createError}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default ConsultationList