import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import Login from "./pages/Login.tsx";
import SignUp from './pages/SignUp';
import Dashboard from "./pages/Dashboard.tsx";
import CustomerManagement from "./pages/CustomerManagement.tsx";
import CustomerAdd from "./pages/CustomerAdd.tsx";
import CustomerImport from "./pages/CustomerImport.tsx";
import CustomerDetail from "./pages/CustomerDetail.tsx";
import CustomerEdit from "./pages/CustomerEdit.tsx";
import SurveyList from "./pages/SurveyList.tsx";
import SurveyDetail from "./pages/SurveyDetail.tsx";
import SurveyCreate from "./pages/SurveyCreate.tsx";
import SurveyEdit from "./pages/SurveyEdit.tsx";
import SurveySubmit from "./pages/SurveySubmit.tsx";
import SurveyAnswers from "./pages/SurveyAnswers.tsx";
import ConsultationList from "./pages/ConsultationList.tsx";
import ConsultationDetail from "./pages/ConsultationDetail.tsx";
// import ConsultationEdit from "./pages/ConsultationEdit.tsx"
import MessageList from "./pages/MessageList.tsx";
import MessageHistory from "./pages/MessageHistory.tsx";
import MessageCreate from "./pages/MessageCreate.tsx";
import MessageTemplateCreate from "./pages/MessageTemplateCreate.tsx";
import ContractList from "./pages/ContractList.tsx";
import ContractCreate from "./pages/ContractCreate.tsx";
import ContractDetail from "./pages/ContractDetail.tsx";
import ArticleList from "./pages/ArticleList.tsx";
import MyPage from "./pages/MyPage";
// Change from default import to named import
import { AuthProvider } from "./context/AuthContext.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import "./App.css";
import NotificationList from "./pages/NotificationList.tsx";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { NotificationProvider } from "./context/NotificationContext";
import InquiryBoard from "./pages/InquiryBoard";
import InquiryDetail from "./pages/InquiryDetail";

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
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <AuthProvider>
                    <NotificationProvider>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<Login />} />
                            <Route path="/signup" element={<SignUp />} />
                            <Route path="/surveys/submit/:surveyId" element={<SurveySubmit />} />
                            

                            {/* Protected routes */}
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <Outlet />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/inquiry" element={<InquiryBoard />} />
                                <Route path="/inquiry/:id" element={<InquiryDetail />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/my-page" element={<MyPage />} />
                                <Route path="/customer-management" element={<CustomerManagement />} />
                                <Route path="/customer-management/add" element={<CustomerAdd />} />
                                <Route path="/customer-management/import" element={<CustomerImport />} />
                                <Route path="/customer-management/:id" element={<CustomerDetail />} />
                                <Route path="/customer-management/edit/:id" element={<CustomerEdit />} />
                                <Route path="/survey" element={<SurveyList />} />
                                <Route path="/survey/create" element={<SurveyCreate />} />
                                <Route path="/survey/:id" element={<SurveyDetail />} />
                                <Route path="/survey/edit/:id" element={<SurveyEdit />} />
                                <Route path="/survey/answers" element={<SurveyAnswers />} />
                                <Route path="/consultation" element={<ConsultationList />} />
                                <Route path="/consultation/:id" element={<ConsultationDetail />} />
                                <Route path="/message" element={<MessageList />} />
                                <Route path="/message/history" element={<MessageHistory />} />
                                <Route path="/message/create" element={<MessageCreate />} />
                                <Route path="/message/templates" element={<MessageTemplateCreate />} />
                                <Route path="/contract" element={<ContractList />} />
                                <Route path="/contract/create" element={<ContractCreate />} />
                                <Route path="/contract/:id" element={<ContractDetail />} />
                                <Route path="/article" element={<ArticleList />} />
                                <Route path="/notification-list" element={<NotificationList />} />
                            </Route>

                            {/* Keep the catch-all route at the end */}
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                        <ToastContainer
                            position="top-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="light"
                        />
                    </NotificationProvider>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;