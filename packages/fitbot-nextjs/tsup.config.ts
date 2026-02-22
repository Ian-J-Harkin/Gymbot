import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['react', '@fitbot/react'],
    // Esbuild banner trick to ensure "use client" directive stays
    // at the very top of the compiled output
    esbuildOptions(options) {
        options.banner = {
            js: '"use client";',
        };
    },
});
