import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import CustomerManagement from "./pages/customer/CustomerManagement"
import CustomerAdd from "./pages/customer/CustomerAdd"
import CustomerImport from "./pages/customer/CustomerImport"
import CustomerDetail from "./pages/customer/CustomerDetail"
import CustomerEdit from "./pages/customer/CustomerEdit"
import SurveyList from "./pages/survey/SurveyList"
import SurveyDetail from "./pages/survey/SurveyDetail"
import SurveyCreate from "./pages/survey/SurveyCreate"
import SurveyEdit from "./pages/survey/SurveyEdit"
import ConsultationList from "./pages/consultation/ConsultationList"
import ConsultationHistory from "./pages/consultation/ConsultationHistory"
import ConsultationDetail from "./pages/consultation/ConsultationDetail"
import ConsultationCreate from "./pages/consultation/ConsultationCreate"
import ConsultationEdit from "./pages/consultation/ConsultationEdit"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"

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
                            path="/consultation/create"
                            element={
                                <ProtectedRoute>
                                    <ConsultationCreate />
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
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    )
}

export default App

