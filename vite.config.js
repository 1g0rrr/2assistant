import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), mkcert()],
    optimizeDeps: {
        exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
    },
    // build: {
    //     rollupOptions: {
    //         output: {
    //             manualChunks(id) {
    //                 if (id.includes('node_modules')) {
    //                     return id.toString().split('node_modules/')[1].split('/')[0].toString();
    //                 }
    //             }
    //         }
    //     }
    // }
})
