import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置：移动端优先开发服务器，绑定所有网卡方便手机真机调试。
export default defineConfig({
  plugins: [react()],
  // 使用相对路径，便于部署在根路径或 GitHub Pages 等子路径。
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
