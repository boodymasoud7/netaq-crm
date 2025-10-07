import { useState, useEffect } from 'react'
import ModernHeader from './ModernHeader'
import ModernSidebar from './ModernSidebar'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
// import useSmartReminders from '../../hooks/useSmartReminders' // REMOVED - old system

function Layout({ children }) {
  const { currentUser } = useAuth()
  
  // تفعيل نظام التذكيرات الذكية في جميع الصفحات
  // useSmartReminders() // REMOVED - old system
  
  // إغلاق الـ sidebar افتراضياً على الموبايل، فتحه على الديسكتوب
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // تحديد حالة الـ sidebar بناءً على حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    // تحديد الحالة الأولية
    handleResize()

    // إضافة مستمع لتغيير حجم الشاشة
    window.addEventListener('resize', handleResize)

    // تنظيف المستمع عند إلغاء تحميل المكون
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // تم حذف نظام مراقبة التذكيرات مؤقتاً

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 flex">
      {/* الشريط الجانبي */}
      <ModernSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col w-full">
        {/* الرأس */}
        <ModernHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
        
        {/* محتوى الصفحة */}
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* تم حذف أنظمة التذكيرات مؤقتاً */}
    </div>
  )
}

export default Layout