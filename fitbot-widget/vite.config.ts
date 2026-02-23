import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
    plugins: [
        preact(),
        cssInjectedByJsPlugin(),
    ],
    build: {
        rollupOptions: {
            output: {
                format: 'iife',
                name: 'FitBot',
                manualChunks: undefined,
                entryFileNames: 'gymbot.min.js',
                assetFileNames: 'gymbot.[ext]',
            },
        },
        cssCodeSplit: false,
    },
    define: {
        'process.env.NODE_ENV': '"production"',
    },
});
