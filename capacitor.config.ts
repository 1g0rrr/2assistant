import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.shinyclub.owai',
    appName: 'shinyclubappname',
    webDir: 'dist',
    bundledWebRuntime: false,
    plugins: {
        FirebaseAuthentication: {
        skipNativeAuth: false,
        providers: ["google.com"],
        },
    },
};

export default config;