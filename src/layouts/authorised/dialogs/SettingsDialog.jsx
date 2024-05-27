import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Slider, Typography, useMediaQuery } from '@mui/material';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '../../../providers/AuthProvider';
import { db, firebaseAuthInstance } from '../../../services/firebase';
import SettingsLanguageItem from './SettingsLanguageItem';

const SettingsDialog = ({ isDialogOpen, setIsDialogOpen }) => {

    const authContext = useAuthContext()

    const isXsSize = useMediaQuery(theme => theme.breakpoints.down('sm'));

    const signOutHandler = () => {

        signOut(firebaseAuthInstance)
            .then(() => {
                // Sign-out successful.
            })
            .catch((error) => {
                // An error happened.
                console.log(error);
            });
    };

    return (
        <Dialog
            open={isDialogOpen}
            fullScreen={isXsSize}
            onClose={() => setIsDialogOpen(false)}
        >
            <DialogTitle>
                Settings
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" color="initial">{authContext.userProfile?.displayName}</Typography>
                <Box textAlign={'center'}>
                    <Typography sx={{ my: 2 }} variant="h5" color="initial">Summary size</Typography>
                    <Box width={200} sx={{ mx: 'auto' }}>
                        <Slider
                            step={50}
                            marks={[
                                {
                                    value: 0,
                                    label: 'Short',
                                },
                                {
                                    value: 50,
                                    label: 'Medium',
                                },
                                {
                                    value: 100,
                                    label: 'Long',
                                },
                            ]}
                            min={0}
                            max={100}
                            value={authContext.userProfile.settings?.boosterSizeIndex ?? 50}

                            onChange={(event, newValue) => {
                                const userRef = doc(db, "users", authContext.sessionUserId);
                                updateDoc(userRef, {
                                    [`settings.boosterSizeIndex`]: newValue,
                                }, { merge: true });
                            }}
                        />
                    </Box>
                </Box>
                <Box textAlign='center' sx={{ mb: 1, minWidth: 300 }}>
                    <Divider sx={{ my: 2 }}>Languages</Divider>
                    <SettingsLanguageItem fieldName={'outputLanguageXX'} title={'Language'} />
                    <Divider />
                    <Button variant="text" color="primary"
                        onClick={() => {
                            signOutHandler();
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>

                <Button
                    onClick={() => setIsDialogOpen(false)}
                    color="primary"
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog >
    )
}

export default SettingsDialog