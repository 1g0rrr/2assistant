import { ThemeProvider, createTheme } from '@mui/material';
import { grey, lightGreen, orange, red } from '@mui/material/colors';
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import './App.css';
import SignInCrossPlatform from './components/SignInCrossPlatform';
import AuthorisedLayout from "./layouts/authorised/AuthorisedLayout";
import MainPage from './layouts/authorised/MainPage';
import AuthProvider from "./providers/AuthProvider";

const theme = createTheme({
    palette: {
        primary: {
            main: '#141414',
            contrastText: grey[50],
        },
        loading: {
            main: '#141414',
            contrastText: grey[50],
        },
        paused: {
            main: '#141414',
            contrastText: grey[50],
        },
        secondary: {
            main: '#4c525e',
        },
        accent: {
            main: '#9c27b0'
        },
        chip: {
            main: grey[300],
            dark: grey[500],
            contrastText: '#141414',
        },
        chipGreen: {
            main: lightGreen[100],
            dark: lightGreen[100],
            contrastText: '#141414',
        },
        chipOrange: {
            main: orange[100],
            dark: orange[100],
            contrastText: '#141414',
        },
        record: {
            main: red[700],
            dark: red[900],

            contrastText: '#fff',
        },
        speech: {
            main: lightGreen[100],
            dark: lightGreen[200],
        },

        lightGreen50: {
            main: lightGreen[50],
            contrastText: '#141414',
        },
        tonalOffset: 0.4,
        contrastThreshold: 3,
    },
});

const router = createBrowserRouter([
    {
        path: "/",
        element:

            <AuthProvider>
                <AuthorisedLayout />
            </AuthProvider>,
        children: [
            {
                index: true,
                element: <MainPage />
            },
            {
                path: ":documentId",
                element: <MainPage />
            }
        ],
    },
    {
        path: "/login",
        element:
            <AuthProvider>
                <SignInCrossPlatform />
            </AuthProvider>
    }
]);

function App() {
    return (
        <ThemeProvider theme={theme}>
            <RouterProvider router={router} fallbackElement={<p>Initial Load...</p>} />
        </ThemeProvider>
    )
}

export default App
