import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
    server: {
        port: 3000,
            host: true,
                // AJOUTEZ CETTE PARTIE 👇
                    proxy: {
                          '/api': {
                                  target: 'http://localhost:3001', // Vers votre serveur backend
                                          changeOrigin: true,
                                                  secure: false
                                                        }
                                                            }
                                                                // 👆 FIN DE L'AJOUT
                                                                  }
                                                                  })