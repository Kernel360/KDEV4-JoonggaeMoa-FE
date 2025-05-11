import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 현재 모드(development, production 등)에 맞는 환경 변수 로드
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      },
      hmr: {
        host: 'localhost'
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL)
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor';
              if (id.includes('@mui')) return 'ui';
              return 'deps'; // 기타 의존성
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})
