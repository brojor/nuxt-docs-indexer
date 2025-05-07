import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    clean: true,
    minify: true,
    target: 'node22',
    banner: {
        js: '#!/usr/bin/env node',
    },
    external: ['fs'],
    platform: 'node',
    sourcemap: true,
});