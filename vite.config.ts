import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    server: {
        proxy: {
            '/game': {
                target: 'http://localhost:5173/src/assets',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/game/, '')
            }
        }
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'KajakEngine',
            fileName: (format) => `index.${format === 'es' ? 'js' : 'umd.cjs'}`
        },
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name][extname]'
            }
        }
    },
    publicDir: 'public',
    plugins: [
        dts({
            insertTypesEntry: true,
            tsconfigPath: 'tsconfig.prod.json'
        })
    ]
});
