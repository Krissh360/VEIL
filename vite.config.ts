import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const root = resolve(import.meta.dirname, 'src/extension');
const fonts = resolve(import.meta.dirname, 'node_modules/@fontsource');

// The version comes from package.json so it has one source.
function manifestAndLicenses(): Plugin {
  return {
    name: 'veil-manifest-and-licenses',
    generateBundle() {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
      const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8')) as object;
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify({ ...manifest, version: pkg.version }, null, 2),
      });
      for (const [name, dir] of [
        ['geist-sans', 'geist-sans'],
        ['newsreader', 'newsreader'],
      ] as const) {
        this.emitFile({
          type: 'asset',
          fileName: `licenses/${name}-OFL.txt`,
          source: readFileSync(resolve(fonts, dir, 'LICENSE'), 'utf8'),
        });
      }
    },
  };
}

export default defineConfig({
  root,
  base: './',
  publicDir: false,
  plugins: [manifestAndLicenses()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    target: 'chrome119',
    assetsInlineLimit: 0,
    modulePreload: false,
    sourcemap: false,
    rollupOptions: {
      input: {
        background: resolve(root, 'background.ts'),
        content: resolve(root, 'content.ts'),
        popup: resolve(root, 'popup/popup.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
