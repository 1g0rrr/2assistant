import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import GoogleIcon from '@mui/icons-material/Google';
import { Box, CssBaseline } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { GoogleAuthProvider, getAuth, signInWithCredential } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Header from '../layouts/authorised/Header';
import { useAuthContext } from '../providers/AuthProvider';

const signInWithGoogle = async () => {
    // 1. Create credentials on the native layer
    const result = await FirebaseAuthentication.signInWithGoogle();
    // 2. Sign in on the web layer using the id token
    const credential = GoogleAuthProvider.credential(result.credential?.idToken);
    const auth = getAuth();
    await signInWithCredential(auth, credential);
};

const SignInCrossPlatform = () => {

    const navigate = useNavigate();
    const authContext = useAuthContext();

    return (
        <>
            <Header setIsDrawerOpen={false} />
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />
                <Box
                    component="nav"
                    aria-label="mailbox folders"
                    sx={{ mt: 12, mb: 18, width: '100%', height: '100%', overflow: 'auto' }}
                >
                    {!authContext.isCheckedInitialAuth && <Typography variant="h4" color="initial">Loading...</Typography>}
                    <br /><br />
                    {authContext.isCheckedInitialAuth && !authContext.isUserLoggedIn && <Typography variant="h4" color="initial">Please login</Typography>}
                    {(authContext.isCheckedInitialAuth && !authContext.isUserLoggedIn && !authContext.sessionUserId)
                        ?
                        <Button variant="contained" color="secondary" sx={{ mt: 2 }} onClick={() => {
                            signInWithGoogle()
                        }} startIcon={<GoogleIcon />}>Sign in with Google</Button>
                        :
                        <Button variant="contained" color="primary" onClick={() => {
                            navigate(`/`);
                        }}>
                            main page
                        </Button>
                    }
                    <br />
                    <br />
                </Box>
            </Box>
        </>
    )
}

export default SignInCrossPlatform