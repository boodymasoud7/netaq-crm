import React from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

/**
 * مكون Toast محسن مع تصميم عربي
 */
export const EnhancedToaster = () => {
  return (
    <>
      {/* Custom CSS to ensure white text in toasts */}
      <style>{`
        .Toaster__toast {
          color: #ffffff !important;
        }
        .Toaster__toast * {
          color: inherit !important;
        }
        [data-hot-toast] {
          color: #ffffff !important;
        }
        [data-hot-toast] * {
          color: inherit !important;
        }
      `}</style>
      <Toaster
        position="top-left" // من اليسار للعربية
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
      toastOptions={{
        // إعدادات افتراضية
        duration: 4000,
        style: {
          direction: 'rtl',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          borderRadius: '8px',
          padding: '12px 16px',
          maxWidth: '400px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
          // Force white text color for all toast notifications
          color: '#ffffff !important',
        },
        
        // إعدادات النجاح
        success: {
          duration: 4000,
          style: {
            background: '#059669',
            color: '#ffffff !important',
            border: 'none',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#059669',
          },
        },
        
        // إعدادات الخطأ
        error: {
          duration: 6000,
          style: {
            background: '#DC2626',
            color: '#ffffff !important',
            border: 'none',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#DC2626',
          },
        },
        
        // إعدادات التحميل
        loading: {
          duration: Infinity,
          style: {
            background: '#3B82F6',
            color: '#ffffff !important',
            border: 'none',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#3B82F6',
          },
        },
        }}
      />
    </>
  )
}

/**
 * دوال toast محسنة مع رسائل عربية
 */
export const enhancedToast = {
  // نجاح
  success: (message, options = {}) => {
    return toast.success(message, {
      icon: <CheckCircle className="h-5 w-5" />,
      ...options,
    })
  },

  // خطأ
  error: (message, options = {}) => {
    return toast.error(message, {
      icon: <XCircle className="h-5 w-5" />,
      ...options,
    })
  },

  // تحذير
  warning: (message, options = {}) => {
    return toast(message, {
      icon: <AlertTriangle className="h-5 w-5" />,
      style: {
        background: '#F59E0B',
        color: '#ffffff !important',
        direction: 'rtl',
        fontWeight: '500',
      },
      ...options,
    })
  },

  // معلومات
  info: (message, options = {}) => {
    return toast(message, {
      icon: <Info className="h-5 w-5" />,
      style: {
        background: '#3B82F6',
        color: '#ffffff !important',
        direction: 'rtl',
        fontWeight: '500',
      },
      ...options,
    })
  },

  // تحميل
  loading: (message = 'جاري التحميل...', options = {}) => {
    return toast.loading(message, options)
  },

  // تحديث toast موجود
  update: (toastId, message, type = 'success') => {
    const updateOptions = {
      success: {
        icon: <CheckCircle className="h-5 w-5" />,
        style: {
          background: '#059669',
          color: '#ffffff !important',
          fontWeight: '500',
        },
      },
      error: {
        icon: <XCircle className="h-5 w-5" />,
        style: {
          background: '#DC2626',
          color: '#ffffff !important',
          fontWeight: '500',
        },
      },
      warning: {
        icon: <AlertTriangle className="h-5 w-5" />,
        style: {
          background: '#F59E0B',
          color: '#ffffff !important',
          fontWeight: '500',
        },
      },
    }

    return toast.success(message, {
      id: toastId,
      ...updateOptions[type],
    })
  },

  // promise toast محسن
  promise: (promise, messages) => {
    const defaultMessages = {
      loading: 'جاري المعالجة...',
      success: 'تم بنجاح!',
      error: 'حدث خطأ!',
    }

    return toast.promise(promise, {
      loading: messages.loading || defaultMessages.loading,
      success: messages.success || defaultMessages.success,
      error: messages.error || defaultMessages.error,
    })
  },

  // عمليات CRUD محسنة
  crud: {
    add: (entityName) => enhancedToast.success(`تم إضافة ${entityName} بنجاح`),
    update: (entityName) => enhancedToast.success(`تم تحديث ${entityName} بنجاح`),
    delete: (entityName) => enhancedToast.success(`تم حذف ${entityName} بنجاح`),
    
    addError: (entityName) => enhancedToast.error(`فشل في إضافة ${entityName}`),
    updateError: (entityName) => enhancedToast.error(`فشل في تحديث ${entityName}`),
    deleteError: (entityName) => enhancedToast.error(`فشل في حذف ${entityName}`),
    
    adding: (entityName) => enhancedToast.loading(`جاري إضافة ${entityName}...`),
    updating: (entityName) => enhancedToast.loading(`جاري تحديث ${entityName}...`),
    deleting: (entityName) => enhancedToast.loading(`جاري حذف ${entityName}...`),
  },

  // رسائل شائعة
  common: {
    saved: () => enhancedToast.success('تم الحفظ بنجاح'),
    deleted: () => enhancedToast.success('تم الحذف بنجاح'),
    updated: () => enhancedToast.success('تم التحديث بنجاح'),
    copied: () => enhancedToast.success('تم النسخ إلى الحافظة'),
    
    saveError: () => enhancedToast.error('فشل في الحفظ'),
    deleteError: () => enhancedToast.error('فشل في الحذف'),
    updateError: () => enhancedToast.error('فشل في التحديث'),
    networkError: () => enhancedToast.error('خطأ في الاتصال بالشبكة'),
    
    invalidData: () => enhancedToast.warning('البيانات المدخلة غير صحيحة'),
    missingFields: () => enhancedToast.warning('يرجى ملء جميع الحقول المطلوبة'),
    noChanges: () => enhancedToast.info('لا توجد تغييرات للحفظ'),
    
    loading: () => enhancedToast.loading('جاري التحميل...'),
    processing: () => enhancedToast.loading('جاري المعالجة...'),
    uploading: () => enhancedToast.loading('جاري الرفع...'),
  },

  // إغلاق toast
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  },

  // إغلاق جميع toast
  dismissAll: () => {
    toast.dismiss()
  },
}

/**
 * Hook لاستخدام Toast مع عمليات API
 */
export const useApiToast = () => {
  const executeWithToast = async (apiCall, messages = {}) => {
    const loadingToast = enhancedToast.loading(messages.loading || 'جاري المعالجة...')
    
    try {
      const result = await apiCall()
      
      enhancedToast.update(loadingToast, messages.success || 'تم بنجاح!', 'success')
      
      return result
    } catch (error) {
      const errorMessage = error.message || messages.error || 'حدث خطأ غير متوقع'
      
      enhancedToast.update(loadingToast, errorMessage, 'error')
      
      throw error
    }
  }

  return { executeWithToast }
}

/**
 * مكون Toast مخصص للعمليات الطويلة
 */
export const ProgressToast = ({ 
  id, 
  message, 
  progress = 0, 
  onCancel 
}) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-lg border">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 mb-2">{message}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% مكتمل</p>
      </div>
      
      {onCancel && (
        <button
          onClick={() => {
            onCancel()
            toast.dismiss(id)
          }}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default EnhancedToaster

