import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from './button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    // تحديث الحالة لإظهار UI الخطأ
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
  }

  componentDidCatch(error, errorInfo) {
    // تسجيل تفاصيل الخطأ
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // إرسال الخطأ لخدمة monitoring (في المستقبل)
    this.logErrorToService(error, errorInfo)
  }

  logErrorToService = (error, errorInfo) => {
    // سيتم تطويرها لاحقاً لإرسال الأخطاء لخدمة monitoring
    console.error('🚨 Error caught by boundary:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white rounded-lg shadow-lg border border-red-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <div className="flex items-center text-white">
                  <AlertTriangle className="h-8 w-8 mr-3" />
                  <div>
                    <h1 className="text-xl font-bold">حدث خطأ غير متوقع</h1>
                    <p className="text-red-100 text-sm">
                      عذراً، واجه التطبيق مشكلة تقنية
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* User-friendly message */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <Bug className="h-8 w-8 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      لا تقلق، نحن نعمل على حل المشكلة
                    </h2>
                    <p className="text-gray-600 mb-4">
                      يمكنك تجربة الخيارات التالية:
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button 
                    onClick={this.handleRetry}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    إعادة المحاولة
                  </Button>
                  
                  <Button 
                    onClick={this.handleReload}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    إعادة تحميل الصفحة
                  </Button>
                  
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    العودة للرئيسية
                  </Button>
                </div>

                {/* Error ID for support */}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    إذا استمرت المشكلة، يرجى التواصل مع الدعم التقني وإرفاق الرقم التالي:
                  </p>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">
                    {errorId}
                  </code>
                </div>

                {/* Development details */}
                {isDevelopment && error && (
                  <details className="mt-6">
                    <summary className="cursor-pointer text-red-600 font-medium mb-4">
                      تفاصيل تقنية (وضع التطوير)
                    </summary>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                      <div>
                        <h4 className="font-semibold text-red-800 mb-2">رسالة الخطأ:</h4>
                        <pre className="text-sm text-red-700 bg-red-100 p-2 rounded overflow-x-auto">
                          {error.toString()}
                        </pre>
                      </div>
                      
                      {errorInfo && errorInfo.componentStack && (
                        <div>
                          <h4 className="font-semibold text-red-800 mb-2">مسار المكونات:</h4>
                          <pre className="text-sm text-red-700 bg-red-100 p-2 rounded overflow-x-auto max-h-40">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 text-gray-500 text-sm">
              <p>تم تسجيل هذا الخطأ تلقائياً وسيتم مراجعته من قبل فريق التطوير</p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC لتغليف المكونات
export const withErrorBoundary = (Component, fallback = null) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook لإرسال الأخطاء يدوياً
export const useErrorHandler = () => {
  return (error, errorInfo = {}) => {
    console.error('🚨 Manual error report:', {
      error: error.toString(),
      ...errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href
    })
    
    // يمكن إضافة إرسال للـ monitoring service هنا
  }
}

export default ErrorBoundary

