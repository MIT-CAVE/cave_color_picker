import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            'cave_color_picker': '../lib/index.js',
        },
    },
    root: './example',
});