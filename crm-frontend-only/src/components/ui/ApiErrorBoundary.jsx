import React from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

class ApiErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      isOnline: navigator.onLine
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('API Error Boundary caught an error:', error, errorInfo)
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
  }

  handleOnline = () => {
    this.setState({ isOnline: true })
  }

  handleOffline = () => {
    this.setState({ isOnline: false })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message?.includes('fetch') || 
                            this.state.error?.message?.includes('Network') ||
                            !this.state.isOnline

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                {isNetworkError ? (
                  <WifiOff className="w-6 h-6 text-red-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {isNetworkError ? 'مشكلة في الاتصال' : 'خطأ في النظام'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                {isNetworkError 
                  ? 'تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وأن الخادم يعمل.'
                  : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
                }
              </p>
              
              {!this.state.isOnline && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-center justify-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    لا يوجد اتصال بالإنترنت
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={this.handleRetry} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  إعادة المحاولة
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="w-full"
                >
                  إعادة تحميل الصفحة
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">
                    تفاصيل الخطأ (للمطورين)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ApiErrorBoundary



