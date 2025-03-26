import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom"
import {ThemeProvider, createTheme, CssBaseline} from "@mui/material"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import CustomerManagement from "./pages/CustomerManagement"
import CustomerAdd from "./pages/CustomerAdd"
import CustomerImport from "./pages/CustomerImport"
import CustomerDetail from "./pages/CustomerDetail"
import CustomerEdit from "./pages/CustomerEdit"
import {AuthProvider} from "./context/AuthContext"
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
            "Helvetica Neue",
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
            <CssBaseline/>
            <Router>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<Login/>}/>
                        <Route path="/register" element={<Register/>}/>
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customer-management"
                            element={
                                <ProtectedRoute>
                                    <CustomerManagement/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customer-management/add"
                            element={
                                <ProtectedRoute>
                                    <CustomerAdd/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customer-management/import"
                            element={
                                <ProtectedRoute>
                                    <CustomerImport/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customer-management/:id"
                            element={
                                <ProtectedRoute>
                                    <CustomerDetail/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customer-management/edit/:id"
                            element={
                                <ProtectedRoute>
                                    <CustomerEdit/>
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/"/>}/>
                    </Routes>
                </AuthProvider>
            </Router>
        </ThemeProvider>
    )
}

export default App

