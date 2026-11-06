import {defineConfig} from 'vite';

export default defineConfig({
    server: {port: 9123},
    build: {
        target: 'es2022',
        lib: {
            entry: 'src/Satsuma.js',
            name: 'Satsuma',
            formats: ['es', 'iife'],
            fileName: (format) =>
                format === 'es' ? 'satsuma.js' : 'Satsuma.js',
        },
        sourcemap: true,
        minify: true,
    },
});
