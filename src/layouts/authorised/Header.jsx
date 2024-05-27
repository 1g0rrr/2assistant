import PersonIcon from '@mui/icons-material/Person';
import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../providers/AuthProvider';
import SettingsDialog from './dialogs/SettingsDialog';

const Header = () => {
    const navigate = useNavigate();

    const authContext = useAuthContext();

    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

    return (
        <>
            <AppBar position="fixed">
                <Toolbar >
                    <Box width={"100%"} >
                        <Button variant="text" color="inherit" href={'/'} disableElevation sx={{ textTransform: 'none' }}>
                            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                WalkieNotes.com
                            </Typography>
                        </Button>
                    </Box>
                    {authContext.firebaseAuthUser && <Typography variant="caption" color="primary.contrastText">{authContext.firebaseAuthUser?.displayName}</Typography>}
                    {authContext.firebaseAuthUser ? <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={() => {
                            setIsSettingsDialogOpen(true);
                        }}
                    >
                        <PersonIcon />
                    </IconButton>
                        : <Button variant="contained" color="primary" onClick={() => {
                            navigate('/login');
                        }}>
                            login
                        </Button>
                    }
                </Toolbar>
                {authContext.userProfile &&
                    <SettingsDialog isDialogOpen={isSettingsDialogOpen} setIsDialogOpen={setIsSettingsDialogOpen} />
                }
            </AppBar >
        </>
    )
}

export default Header