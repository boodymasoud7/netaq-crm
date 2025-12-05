import { useEffect, useState } from 'react'

export const usePerformanceMonitor = (componentName) => {
    const [renderTime, setRenderTime] = useState(0)

    useEffect(() => {
        const startTime = performance.now()

        return () => {
            const endTime = performance.now()
            const time = endTime - startTime
            setRenderTime(time)

            // Log slow renders (> 100ms)
            if (time > 100) {
                console.warn(`⚠️ Slow render: ${componentName} took ${time.toFixed(2)}ms`)
            }

            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`📊 ${componentName} render time: ${time.toFixed(2)}ms`)
            }
        }
    }, [componentName])

    return renderTime
}

export default usePerformanceMonitor
