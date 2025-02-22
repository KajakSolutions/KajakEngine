import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.ogg'],
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
    plugins: [
        dts({
            insertTypesEntry: true,
        })
    ]
});
