import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@designcodeio/threeui/style.css',
        replacement: path.resolve(__dirname, 'src/shaders/threeui.css'),
      },
      {
        find: '@designcodeio/threeui',
        replacement: path.resolve(__dirname, 'src/shaders/animated-top-dock/AnimatedTopDock.tsx'),
      },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})


