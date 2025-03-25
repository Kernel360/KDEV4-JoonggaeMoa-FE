"use client"
import { AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent, CardHeader, Box } from "@mui/material"
import { useAuth } from "../context/AuthContext"

function Dashboard() {
    const { logout } = useAuth()

    const handleLogout = () => {
        logout()
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Dashboard
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6} lg={4}>
                        <Card>
                            <CardHeader title="Welcome" subheader="You have successfully logged in to the dashboard" />
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                    This is an empty dashboard template that you can customize according to your needs.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    {/* You can add more cards or components here */}
                </Grid>
            </Container>
        </Box>
    )
}

export default Dashboard

