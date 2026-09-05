import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_IPFS_API_KEY': JSON.stringify(
        env.VITE_IPFS_API_KEY || env.IPFS_API_KEY || ''
      ),
      'import.meta.env.VITE_IPFS_API_SECRET': JSON.stringify(
        env.VITE_IPFS_API_SECRET || env.IPFS_API_SECRET || ''
      ),
      'import.meta.env.VITE_IPFS_GATEWAY_URL': JSON.stringify(
        env.VITE_IPFS_GATEWAY_URL || env.IPFS_GATEWAY_URL || ''
      ),
    },
  }
})
