/**
 * 性能优化工具函数
 */
import { ref } from 'vue'

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn.apply(this, args)
    }
  }
}

// 虚拟列表数据加载
export function createVirtualLoader<T>(
  allData: T[],
  pageSize: number = 20
) {
  return {
    data: ref<T[]>([]),
    loading: ref(false),
    hasMore: ref(true),
    page: ref(0),

    async loadMore() {
      if (this.loading.value || !this.hasMore.value) return

      this.loading.value = true
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 100))

      const start = this.page.value * pageSize
      const end = start + pageSize
      const newData = allData.slice(start, end)

      this.data.value = [...this.data.value, ...newData] as T[]
      this.page.value++
      this.hasMore.value = end < allData.length
      this.loading.value = false
    },

    reset() {
      this.data.value = []
      this.loading.value = false
      this.hasMore.value = true
      this.page.value = 0
    }
  }
}

// 图片懒加载指令
export const lazyLoadImage = {
  mounted(el: HTMLImageElement & { _observer?: IntersectionObserver }, binding: any) {
    const imageUrl = binding.value

    // 创建IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = imageUrl
            img.classList.add('loaded')
            observer.unobserve(img)
          }
        })
      },
      {
        rootMargin: '50px'
      }
    )

    // 观察图片元素
    observer.observe(el)

    // 保存observer引用以便清理
    el._observer = observer
  },

  unmounted(el: HTMLImageElement & { _observer?: IntersectionObserver }) {
    if (el._observer) {
      el._observer.disconnect()
    }
  }
}

// 性能监控
export class PerformanceMonitor {
  private metrics = new Map<string, number>()

  // 记录性能指标
  record(name: string, duration: number) {
    this.metrics.set(name, duration)
  }

  // 获取性能指标
  get(name: string): number | undefined {
    return this.metrics.get(name)
  }

  // 打印性能报告
  report() {
    console.group('📊 性能报告')
    this.metrics.forEach((duration, name) => {
      console.log(`${name}: ${duration.toFixed(2)}ms`)
    })
    console.groupEnd()
  }

  // 测量函数执行时间
  measure<T extends (...args: any[]) => any>(
    name: string,
    fn: T
  ): T {
    return ((...args: any[]) => {
      const start = performance.now()
      const result = fn(...args)
      const end = performance.now()
      this.record(name, end - start)
      return result
    }) as T
  }
}

// 导出性能监控实例
export const perfMonitor = new PerformanceMonitor()

// 组件级性能监控装饰器
export function withPerformanceMonitoring(componentName: string) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const start = performance.now()
      try {
        const result = await originalMethod.apply(this, args)
        const end = performance.now()
        console.log(
          `[Performance] ${componentName}.${propertyKey}: ${(end - start).toFixed(2)}ms`
        )
        return result
      } catch (error) {
        const end = performance.now()
        console.error(
          `[Performance] ${componentName}.${propertyKey}: ${(end - start).toFixed(2)}ms (Error)`
        )
        throw error
      }
    }

    return descriptor
  }
}

// 首屏内容加载优化
export function waitForFirstContent(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve())
    } else {
      resolve()
    }
  })
}

// 资源预加载
export function preloadResources(urls: string[]) {
  urls.forEach((url) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = url.endsWith('.css') ? 'style' : 'script'
    link.href = url
    document.head.appendChild(link)
  })
}

// 闲时加载低优先级资源
export function loadWhenIdle(callback: () => void, timeout: number = 2000) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => callback(), { timeout })
  } else {
    setTimeout(callback, timeout)
  }
}

// 批量更新优化
export function batchUpdate<T>(items: T[], updater: (item: T) => void, batchSize: number = 50) {
  return new Promise<void>((resolve) => {
    let index = 0

    function processBatch() {
      const batch = items.slice(index, index + batchSize)
      batch.forEach(updater)
      index += batchSize

      if (index < items.length) {
        // 使用requestIdleCallback或setTimeout进行下一批处理
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => processBatch(), { timeout: 50 })
        } else {
          setTimeout(processBatch, 0)
        }
      } else {
        resolve()
      }
    }

    processBatch()
  })
}

// 内存使用监控
export function checkMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize / 1048576, // MB
      totalJSHeapSize: memory.totalJSHeapSize / 1048576,
      jsHeapSizeLimit: memory.jsHeapSizeLimit / 1048576
    }
  }
  return null
}

// 定期清理缓存
export function setupCacheCleanup(interval: number = 5 * 60 * 1000) {
  setInterval(() => {
    // 清理localStorage中的过期数据
    const now = Date.now()
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const data = JSON.parse(item)
            if (data.expire && data.expire < now) {
              localStorage.removeItem(key)
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    // 触发垃圾回收（仅Chrome）
    if ('gc' in window) {
      (window as any).gc()
    }

    console.log('[Cache] Cleanup completed')
  }, interval)
}
