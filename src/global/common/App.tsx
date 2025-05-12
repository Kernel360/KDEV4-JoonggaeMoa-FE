import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import {BrowserRouter as Router, Navigate, Outlet, Route, Routes} from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

import ArticleList from "@/domain/article/pages/ArticleList";
import ConsultationDetail from "@/domain/consultation/pages/ConsultationDetail";
import ConsultationList from "@/domain/consultation/pages/ConsultationList";
import ContractCreate from "@/domain/contract/pages/ContractCreate";
import ContractDetail from "@/domain/contract/pages/ContractDetail";
import ContractList from "@/domain/contract/pages/ContractList";
import CustomerAdd from "@/domain/customer/pages/CustomerAdd";
import CustomerDetail from "@/domain/customer/pages/CustomerDetail";
import CustomerEdit from "@/domain/customer/pages/CustomerEdit";
import CustomerImport from "@/domain/customer/pages/CustomerImport";
import CustomerManagement from "@/domain/customer/pages/CustomerManagement";
import Dashboard from "@/domain/dashboard/pages/Dashboard";
import InquiryBoard from "@/domain/inquiry/pages/InquiryBoard";
import InquiryDetail from "@/domain/inquiry/pages/InquiryDetail";
import MessageCreate from "@/domain/message/pages/MessageCreate";
import MessageHistory from "@/domain/message/pages/MessageHistory";
import MessageList from "@/domain/message/pages/MessageList";
import MessageTemplateCreate from "@/domain/message/pages/MessageTemplateCreate";
import {NotificationProvider} from "@/domain/notification/context/NotificationContext";
import NotificationList from "@/domain/notification/pages/NotificationList";
import SurveyAnswers from "@/domain/survey/pages/SurveyAnswers";
import SurveyCreate from "@/domain/survey/pages/SurveyCreate";
import SurveyDetail from "@/domain/survey/pages/SurveyDetail";
import SurveyEdit from "@/domain/survey/pages/SurveyEdit";
import SurveyList from "@/domain/survey/pages/SurveyList";
import SurveySubmit from "@/domain/survey/pages/SurveySubmit";
import ProtectedRoute from "@/global/auth/components/ProtectedRoute";
import {AuthProvider} from "@/global/auth/context/AuthContext";
import Login from "@/global/auth/pages/Login"
import MyPage from "@/global/auth/pages/MyPage";
import SignUp from '@/global/auth/pages/SignUp';
import "@/global/common/styles/App.css";

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
            <CssBaseline/>
            <Router>
                <AuthProvider>
                    <NotificationProvider>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<Login/>}/>
                            <Route path="/signup" element={<SignUp/>}/>
                            <Route path="/surveys/submit/:surveyId" element={<SurveySubmit/>}/>


                            {/* Protected routes */}
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <Outlet/>
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/inquiry" element={<InquiryBoard/>}/>
                                <Route path="/inquiry/:id" element={<InquiryDetail/>}/>
                                <Route path="/dashboard" element={<Dashboard/>}/>
                                <Route path="/my-page" element={<MyPage/>}/>
                                <Route path="/customer-management" element={<CustomerManagement/>}/>
                                <Route path="/customer-management/add" element={<CustomerAdd/>}/>
                                <Route path="/customer-management/import" element={<CustomerImport/>}/>
                                <Route path="/customer-management/:id" element={<CustomerDetail/>}/>
                                <Route path="/customer-management/edit/:id" element={<CustomerEdit/>}/>
                                <Route path="/survey" element={<SurveyList/>}/>
                                <Route path="/survey/create" element={<SurveyCreate/>}/>
                                <Route path="/survey/:id" element={<SurveyDetail/>}/>
                                <Route path="/survey/edit/:id" element={<SurveyEdit/>}/>
                                <Route path="/survey/answers" element={<SurveyAnswers/>}/>
                                <Route path="/consultation" element={<ConsultationList/>}/>
                                <Route path="/consultation/:id" element={<ConsultationDetail/>}/>
                                <Route path="/message" element={<MessageList/>}/>
                                <Route path="/message/history" element={<MessageHistory/>}/>
                                <Route path="/message/create" element={<MessageCreate/>}/>
                                <Route path="/message/templates" element={<MessageTemplateCreate/>}/>
                                <Route path="/contract" element={<ContractList/>}/>
                                <Route path="/contract/create" element={<ContractCreate/>}/>
                                <Route path="/contract/:id" element={<ContractDetail/>}/>
                                <Route path="/article" element={<ArticleList/>}/>
                                <Route path="/notification-list" element={<NotificationList/>}/>
                            </Route>

                            {/* Keep the catch-all route at the end */}
                            <Route path="*" element={<Navigate to="/"/>}/>
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