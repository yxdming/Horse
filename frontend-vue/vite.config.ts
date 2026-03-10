import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 自动导入Vue API
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),
    // 自动导入组件（包括Element Plus）
    Components({
      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
      ],
      dts: 'src/components.d.ts',
    }),
    // 打包分析
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Gzip压缩
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // 只压缩大于10KB的文件
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // 构建优化
  build: {
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 构建后的浏览器兼容目标
    target: 'es2015',
    // chunk大小警告限制（KB）
    chunkSizeWarningLimit: 1000,
    // 生成源码映射
    sourcemap: false,
    // 最小化混淆 (使用esbuild，更快且无需额外依赖)
    minify: 'esbuild',
    // Rollup配置
    rollupOptions: {
      output: {
        // 分包策略
        manualChunks: {
          // Vue框架
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Element Plus
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          // ECharts
          'echarts-vendor': ['echarts', 'vue-echarts'],
          // 其他工具库
          'utils': ['axios', 'dayjs', 'vue-i18n'],
        },
        // 输出文件命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    host: '7.250.75.172',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/element-variables.scss" as *;`,
      },
    },
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'element-plus',
      '@element-plus/icons-vue',
      'echarts',
      'vue-echarts',
      'dayjs',
      'vue-i18n',
    ],
  },
})
