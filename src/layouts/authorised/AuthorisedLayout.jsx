import { Box, CssBaseline } from '@mui/material';
import { ConfirmProvider } from "material-ui-confirm";
import { Outlet } from 'react-router-dom';
import FirestoreProvider from '../../providers/FirestoreProvider';
import RecorderProvider from '../../providers/RecorderProvider';
import { SnackbarProvider } from '../../providers/Snackbar';
import Header from './Header';
const AuthorisedLayout = () => {

    return (
        <>
            <CssBaseline />
            <ConfirmProvider>
                <SnackbarProvider>
                    <FirestoreProvider>
                        <RecorderProvider>
                            <Box sx={{
                                mt: 10,
                                mb: 10,
                            }}>
                                <Header />
                                <Outlet context={{}} />
                            </Box>
                        </RecorderProvider>
                    </FirestoreProvider>
                </SnackbarProvider>
            </ConfirmProvider >
        </>
    )
}

export default AuthorisedLayout