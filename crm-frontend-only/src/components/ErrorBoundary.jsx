import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('🚨 Error caught by boundary:', error, errorInfo)
        this.setState({ errorInfo })
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
                        <div className="mb-6">
                            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="h-10 w-10 text-red-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">عذراً!</h1>
                            <p className="text-gray-600">حدث خطأ غير متوقع في التطبيق</p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                                <p className="text-sm font-mono text-red-800 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="h-5 w-5" />
                            إعادة تحميل الصفحة
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
