import { motion } from 'framer-motion'
import { Building2, Sparkles, Zap, TrendingUp } from 'lucide-react'

export function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    xs: "h-3 w-3 border",
    sm: "h-4 w-4 border",
    md: "h-6 w-6 border-2", 
    lg: "h-8 w-8 border-2",
    xl: "h-12 w-12 border-4"
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} border-emerald-500 border-t-transparent rounded-full ${className}`}
    />
  )
}

// Loading Button Component
export function LoadingButton({ children, loading = false, disabled = false, className = "", ...props }) {
  return (
    <button 
      disabled={disabled || loading}
      className={`relative flex items-center justify-center space-x-2 space-x-reverse transition-all duration-200 ${loading ? 'cursor-not-allowed opacity-70' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="sm" className="absolute" />
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  )
}

export function LoadingPage({ message = "جاري تحميل البيانات..." }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0">
        {/* دوائر متحركة في الخلفية */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 left-20 w-32 h-32 bg-emerald-200 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-200 rounded-full blur-xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 text-center space-y-8 max-w-md mx-auto px-6"
      >
        {/* أيقونة الشركة مع تأثيرات */}
        <motion.div className="flex justify-center relative">
          {/* حلقة خارجية متحركة */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute w-24 h-24 border-2 border-emerald-200 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute w-20 h-20 border border-emerald-300 rounded-full border-dashed"
          />
          
          {/* الأيقونة الرئيسية */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ 
              scale: 1,
              rotateY: [0, 360]
            }}
            transition={{ 
              scale: { duration: 0.5, delay: 0.2 },
              rotateY: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30"
          >
            <Building2 className="h-8 w-8 text-white" />
            
            {/* جزيئات لامعة */}
            <motion.div
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* اسم النظام */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Safqa Pro CRM
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-slate-600 font-medium"
          >
            نظام إدارة علاقات العملاء المتطور
          </motion.p>
        </motion.div>

        {/* دوار التحميل المتطور */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center space-y-6"
        >
          {/* دوار ثلاثي الأبعاد */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 border-r-emerald-400 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 w-8 h-8 border-2 border-blue-200 border-b-blue-500 rounded-full"
            />
          </div>

          {/* رسالة التحميل */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center"
          >
            <p className="text-slate-700 font-medium mb-1">{message}</p>
            <div className="flex items-center justify-center space-x-2 space-x-reverse text-xs text-slate-500">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>تحميل سريع ومحسن</span>
            </div>
          </motion.div>
        </motion.div>

        {/* شريط التقدم المتطور */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-xs mx-auto"
        >
          <div className="relative">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  repeatType: "loop"
                }}
                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 rounded-full"
                style={{ width: "50%" }}
              />
            </div>
            
            {/* نقاط تقدم */}
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <motion.span
                animate={{ color: ["#94a3b8", "#10b981", "#94a3b8"] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                بدء التحميل
              </motion.span>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                جاري المعالجة
              </motion.span>
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 2 }}
                className="text-emerald-600"
              >
                <TrendingUp className="h-3 w-3" />
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* إحصائيات وهمية */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center space-y-2"
        >
          <div className="text-xs text-slate-500 space-y-1">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              تحميل البيانات... 
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="text-emerald-600 font-medium"
              >
                98%
              </motion.span>
            </motion.div>
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="text-xs"
            >
              جاري تحسين الأداء والحصول على أفضل تجربة لك
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export function LoadingSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-4">
      {[...Array(rows)].map((_, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="animate-pulse"
        >
          <div className="flex space-x-4 space-x-reverse">
            <div className="rounded-full bg-gradient-to-r from-slate-200 to-slate-300 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-3/4"></div>
              <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Table Loading Skeleton
export function TableLoadingSkeleton({ columns = 4, rows = 8 }) {
  return (
    <div className="w-full overflow-hidden">
      {/* Header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="h-4 bg-gradient-to-r from-slate-300 to-slate-400 rounded animate-pulse"
          />
        ))}
      </div>
      
      {/* Rows */}
      <div className="space-y-3">
        {[...Array(rows)].map((_, rowIndex) => (
          <motion.div 
            key={rowIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rowIndex * 0.05 }}
            className="grid gap-4" 
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {[...Array(columns)].map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded animate-pulse"
                style={{ 
                  width: colIndex === 0 ? '80%' : colIndex === columns - 1 ? '60%' : '100%' 
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Card Loading Skeleton
export function CardLoadingSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white rounded-xl shadow-sm border p-6 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-200 to-emerald-300 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-2/3 animate-pulse" />
              <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded w-1/2 animate-pulse" />
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-3">
            <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-full animate-pulse" />
            <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded w-4/5 animate-pulse" />
            <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-3/5 animate-pulse" />
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-center pt-2">
            <div className="h-8 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-lg w-20 animate-pulse" />
            <div className="flex space-x-2 space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Stats Cards Loading
export function StatsLoadingSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-200 to-emerald-300 rounded-lg animate-pulse" />
            <div className="w-6 h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded animate-pulse" />
          </div>
          
          <div className="space-y-3">
            <div className="h-8 bg-gradient-to-r from-slate-300 to-slate-400 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-1/2 animate-pulse" />
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-4 h-4 bg-gradient-to-r from-green-200 to-green-300 rounded animate-pulse" />
              <div className="h-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded w-16 animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Export default للتوافق مع imports
export default LoadingPage

