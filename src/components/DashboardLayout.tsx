"use client"

import type React, {ReactNode} from "react"
import {Box} from "@mui/material"

interface DashboardLayoutProps {
    children?: ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({children}) => {
    return (
        <Box sx={{display: "flex", flexDirection: "column", minHeight: "100vh"}}>
            {/* You can add a header here if needed */}
            <Box sx={{flexGrow: 1, p: 3}}>{children}</Box>
            {/* You can add a footer here if needed */}
        </Box>
    )
}

export default DashboardLayout

