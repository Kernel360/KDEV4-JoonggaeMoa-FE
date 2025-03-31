import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import CustomerManagement from "./pages/CustomerManagement"
import CustomerAdd from "./pages/CustomerAdd"
import CustomerImport from "./pages/CustomerImport"
import CustomerDetail from "./pages/CustomerDetail"
import CustomerEdit from "./pages/CustomerEdit"
import SurveyList from "./pages/SurveyList"
import SurveyDetail from "./pages/SurveyDetail"
import SurveyCreate from "./pages/SurveyCreate"
import SurveyEdit from "./pages/SurveyEdit"
import SurveySubmit from "./pages/SurveySubmit"
import SurveyAnswers from "./pages/SurveyAnswers" // 새로 추가된 설문 응답 페이지
import ConsultationList from "./pages/ConsultationList"
import ConsultationHistory from "./pages/ConsultationHistory"
import ConsultationDetail from "./pages/ConsultationDetail"
import ConsultationEdit from "./pages/ConsultationEdit"
import MessageList from "./pages/MessageList"
import MessageHistory from "./pages/MessageHistory"
import MessageCreate from "./pages/MessageCreate"
import MessageTemplateCreate from "./pages/MessageTemplateCreate"
import ContractList from "./pages/ContractList"
import ContractCreate from "./pages/ContractCreate"
import ContractDetail from "./pages/ContractDetail"
import ContractEdit from "./pages/ContractEdit"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import "./App.css"

// Create a theme instance
const theme = createTheme({
    palette: {
        primary: {
            main: "#1976d2",
        },
        secondary: {
            main: "#dc004e",
        },
    },
    typography: {
        fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(","),
    },
    components: {
        MuiContainer: {
            styleOverrides: {
                root: {
                    paddingLeft: 24,
                    paddingRight: 24,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
    },
})

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <AuthProvider>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Box
                                    sx={{
                                        width: "100vw",
                                        height: "100vh",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "#f5f5f5",
                                    }}
                                >
                                    <Login />
                                </Box>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <Box
                                    sx={{
                                        width: "100vw",
                                        height: "100vh",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "#f5f5f5",
                                    }}
                                >
                                    <Register />
                                </Box>
                            }
                        />
                        {/* 공개 페이지: 설문 제출 */}
                        <Route path="/surveys/submit/:surveyId" element={<SurveySubmit />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        {/* 나머지 라우트는 그대로 유지 */}
                        {/* 고객 관리 라우트 */}
                        <Route
                            path="/customer-management"
                            element={
                                <ProtectedRoute>
                                    <CustomerManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customer-management/add"
                            element={
                                <ProtectedRoute>
                                    <CustomerAdd />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customer-management/import"
                            element={
                                <ProtectedRoute>
                                    <CustomerImport />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customer-management/:id"
                            element={
                                <ProtectedRoute>
                                    <CustomerDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customer-management/edit/:id"
                            element={
                                <ProtectedRoute>
                                    <CustomerEdit />
                                </ProtectedRoute>
                            }
                        />
                        {/* 설문 관리 라우트 */}
                        <Route
                            path="/survey"
                            element={
                                <ProtectedRoute>
                                    <SurveyList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/survey/create"
                            element={
                                <ProtectedRoute>
                                    <SurveyCreate />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/survey/:id"
                            element={
                                <ProtectedRoute>
                                    <SurveyDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/survey/edit/:id"
                            element={
                                <ProtectedRoute>
                                    <SurveyEdit />
                                </ProtectedRoute>
                            }
                        />
                        {/* 설문 응답 관리 라우트 추가 */}
                        <Route
                            path="/survey/answers"
                            element={
                                <ProtectedRoute>
                                    <SurveyAnswers />
                                </ProtectedRoute>
                            }
                        />
                        {/* 상담 관리 라우트 */}
                        <Route
                            path="/consultation"
                            element={
                                <ProtectedRoute>
                                    <ConsultationList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/consultation/history"
                            element={
                                <ProtectedRoute>
                                    <ConsultationHistory />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/consultation/:id"
                            element={
                                <ProtectedRoute>
                                    <ConsultationDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/consultation/edit/:id"
                            element={
                                <ProtectedRoute>
                                    <ConsultationEdit />
                                </ProtectedRoute>
                            }
                        />
                        {/* 메시지 관리 라우트 */}
                        <Route
                            path="/message"
                            element={
                                <ProtectedRoute>
                                    <MessageList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/message/history"
                            element={
                                <ProtectedRoute>
                                    <MessageHistory />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/message/create"
                            element={
                                <ProtectedRoute>
                                    <MessageCreate />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/message/templates"
                            element={
                                <ProtectedRoute>
                                    <MessageTemplateCreate />
                                </ProtectedRoute>
                            }
                        />
                        {/* 계약 관리 라우트 */}
                        <Route
                            path="/contract"
                            element={
                                <ProtectedRoute>
                                    <ContractList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/contract/create"
                            element={
                                <ProtectedRoute>
                                    <ContractCreate />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/contract/:id"
                            element={
                                <ProtectedRoute>
                                    <ContractDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/contract/edit/:id"
                            element={
                                <ProtectedRoute>
                                    <ContractEdit />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    )
}

export default App

