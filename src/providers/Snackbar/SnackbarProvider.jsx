import CloseIcon from '@mui/icons-material/Close';
import { Alert, IconButton, Snackbar } from '@mui/material';
import { useCallback, useState } from 'react';
import SnackbarContext from './SnackbarContext';

const SnackbarProvider = ({ children }) => {

    const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState(null);
    const [delay, setDelay] = useState();
    const [origin, setOrigin] = useState();

    const snackbar = useCallback((message, delay = 2000, origin = { vertical: 'bottom', horizontal: 'center' }) => {
        setSnackbarMessage(message);
        setDelay(delay);
        setIsSnackbarOpen(true);
        setOrigin(origin);
    }, []);

    return (
        <>
            <SnackbarContext.Provider value={
                snackbar
            }>
                {children}
            </SnackbarContext.Provider>
            <Snackbar
                open={isSnackbarOpen}
                anchorOrigin={origin}
                autoHideDuration={delay}
                onClose={() => setIsSnackbarOpen(false)}
            >
                <Alert severity="info"
                    action={
                        <IconButton
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setIsSnackbarOpen(false);
                            }}
                        >
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                >{snackbarMessage}</Alert>
            </Snackbar>
        </>
    );
}
export default SnackbarProvider;
