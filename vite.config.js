import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024, // Only compress files larger than 1KB
    }),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
    // Bundle analyzer (only in analyze mode)
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  build: {
    // Target modern browsers for better optimization
    target: 'es2015',
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            // Firebase
            if (id.includes('firebase')) {
              return 'vendor-firebase'
            }
            // UI libraries
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('recharts')) {
              return 'vendor-ui'
            }
            // Other vendors
            return 'vendor-other'
          }
          
          // Large pages get their own chunks
          if (id.includes('src/pages/BinAnalytics')) {
            return 'page-bin-analytics'
          }
          if (id.includes('src/pages/GateStatusManager')) {
            return 'page-gate-status'
          }
          if (id.includes('src/pages/Gates')) {
            return 'page-gates'
          }
          if (id.includes('src/pages/Orders')) {
            return 'page-orders'
          }
          if (id.includes('src/pages/Overview')) {
            return 'page-overview'
          }
        },
        
        // Optimize asset file names for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Minification options - using esbuild (faster and more reliable)
    minify: 'esbuild',
    
    // Source maps for production debugging (optional, can disable for smaller builds)
    sourcemap: false,
    
    // CSS code splitting
    cssCodeSplit: true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
  },
})
