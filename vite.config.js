import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: false,
    cors: true
  },
  // 确保 ES6 模块支持
  esbuild: {
    target: 'esnext',
    module: 'esnext'
  },
  // 启用模块化语法支持
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
})
