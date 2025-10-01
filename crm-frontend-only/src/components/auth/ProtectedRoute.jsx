import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { LoadingPage } from '../ui/loading'
import { AlertTriangle, Lock, Home } from 'lucide-react'
import { Button } from '../ui/button'

function ProtectedRoute({ 
  children, 
  requiredPermissions = null, 
  requiredRole = null,
  requireAll = false // إذا كان true، يتطلب جميع الصلاحيات. إذا كان false، يتطلب أي صلاحية
}) {
  const { currentUser, userProfile, loading } = useAuth()
  const { checkPermission, checkAnyPermission, checkAllPermissions, userRole, isAdmin } = usePermissions()
  const location = useLocation()

  // تشخيص
  // Debug logging (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 ProtectedRoute:', { 
      currentUser: !!currentUser, 
      userProfile: !!userProfile, 
      loading,
      path: location.pathname
    })
  }

  // إذا لم يتم تحميل ملف المستخدم بعد، انتظر
  if (loading) {
    return <LoadingPage message="جاري تحميل ملف المستخدم..." />
  }

  // إذا لم يكن المستخدم مسجل دخول بعد انتهاء التحميل
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // إذا لم يتم تحميل ملف المستخدم
  if (!userProfile) {
    return <LoadingPage message="جاري تحميل ملف المستخدم..." />
  }

  // التحقق من الدور المطلوب (استخدام الصلاحيات الديناميكية)
  if (requiredRole && userRole !== requiredRole && !isAdmin()) {
    // إذا كان admin، يسمح له بالدخول
    if (isAdmin()) {
      // تمرير
    }
    // إذا كان requiredRole = "admin"، نتحقق من الصلاحيات بدلاً من الدور
    else if (requiredRole === 'admin') {
      // لا نقوم بمنع الوصول هنا، سنتحقق من الصلاحيات في الخطوة التالية
    }
    else {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center bg-white p-10 rounded-2xl shadow-xl max-w-md border border-gray-200 animate-fadeIn">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Lock className="h-12 w-12 text-red-600 animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4 text-gray-900 animate-slideInUp">🚫 غير مسموح</h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed animate-slideInUp">
              عذراً، هذه الصفحة مخصصة للإدارة فقط
            </p>
            
            <div className="space-y-4 animate-slideInUp">
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Home className="h-5 w-5 ml-2 animate-bounce" />
                العودة للرئيسية
              </Button>
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full py-3 text-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <AlertTriangle className="h-5 w-5 ml-2 animate-pulse" />
                العودة للخلف
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-6 animate-fadeIn animate-delay-1000">
              للحصول على صلاحيات إضافية، تواصل مع المدير
            </p>
          </div>
        </div>
      )
    }
  }

  // التحقق من الصلاحيات المطلوبة
  if (requiredPermissions) {
    let hasAccess = false
    
    if (Array.isArray(requiredPermissions)) {
      if (requireAll) {
        hasAccess = checkAllPermissions(requiredPermissions)
      } else {
        hasAccess = checkAnyPermission(requiredPermissions)
      }
    } else {
      hasAccess = checkPermission(requiredPermissions)
    }

    if (!hasAccess && !isAdmin()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center bg-white p-10 rounded-2xl shadow-xl max-w-md border border-gray-200 animate-fadeIn">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Lock className="h-12 w-12 text-red-600 animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4 text-gray-900 animate-slideInUp">🚫 غير مسموح</h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed animate-slideInUp">
              عذراً، هذه الصفحة مخصصة للإدارة فقط
            </p>
            
            <div className="space-y-4 animate-slideInUp">
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Home className="h-5 w-5 ml-2 animate-bounce" />
                العودة للرئيسية
              </Button>
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full py-3 text-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <AlertTriangle className="h-5 w-5 ml-2 animate-pulse" />
                العودة للخلف
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-6 animate-fadeIn animate-delay-1000">
              للحصول على صلاحيات إضافية، تواصل مع المدير
            </p>
          </div>
        </div>
      )
    }
  }

  return children
}

export default ProtectedRoute
