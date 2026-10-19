import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        include: ['better-sqlite3', '@powersync/node']
      })
    ],
    build: {
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        external: ['better-sqlite3', '@powersync/node'],
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'powersync.worker': resolve(__dirname, 'src/main/db/powersync.worker.ts'),
          'zatca.worker': resolve(__dirname, 'src/main/services/zatca.worker.ts')
        },
        output: {
          format: 'es',
          entryFileNames: '[name].mjs'
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        },
        output: {
          format: 'es',
          entryFileNames: 'index.mjs'
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, '../../packages/shared/src')
      }
    },
    plugins: [react()],
    build: {
      outDir: resolve(__dirname, 'out/renderer'),
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['@tanstack/react-router'],
            'icons-vendor': ['lucide-react']
          }
        }
      }
    }
  }
});
