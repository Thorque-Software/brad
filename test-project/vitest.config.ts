import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            // Apunta directamente a la carpeta instalada
            bradb: path.resolve(__dirname, 'node_modules/bradb'),
        },
    },
    optimizeDeps: {
        include: ['bradb'], // Fuerza el pre-bundling
    }
});
