import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material"
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
import ConsultationList from "./pages/ConsultationList"
import ConsultationHistory from "./pages/ConsultationHistory"
import ConsultationDetail from "./pages/ConsultationDetail"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import ConsultationEdit from "./pages/ConsultationEdit"
import MessageList from "./pages/MessageList"
import MessageCreate from "./pages/MessageCreate"
import MessageTemplateCreate from "./pages/MessageTemplateCreate"

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
})

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
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
                        {/* 상담 수정 경로 추가 */}
                        <Route
                            path="/consultation/edit/:id"
                            element={
                                <ProtectedRoute>
                                    <ConsultationEdit />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/message"
                            element={
                                <ProtectedRoute>
                                    <MessageList />
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
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    )
}

export default App

