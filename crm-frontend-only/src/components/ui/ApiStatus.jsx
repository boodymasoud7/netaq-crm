import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Server, Database, Shield, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Badge } from './badge'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { config } from '../../lib/apiSwitch.js'

export default function ApiStatus({ compact = false }) {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [dbStatus, setDbStatus] = useState('checking')
  const [authStatus, setAuthStatus] = useState('checking')
  const [lastCheck, setLastCheck] = useState(new Date())

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${config.baseURL.replace('/api', '')}/api/test`, {
        method: 'GET',
        timeout: 5000
      })
      
      if (response.ok) {
        const data = await response.json()
        setBackendStatus('connected')
        
        // Check if response includes database info
        if (data.database) {
          setDbStatus('connected')
        }
        
        return true
      } else {
        setBackendStatus('error')
        return false
      }
    } catch (error) {
      setBackendStatus('disconnected')
      setDbStatus('disconnected')
      return false
    }
  }

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setAuthStatus('no_token')
        return false
      }

      const response = await fetch(`${config.baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setAuthStatus('authenticated')
        return true
      } else {
        setAuthStatus('invalid_token')
        return false
      }
    } catch (error) {
      setAuthStatus('error')
      return false
    }
  }

  const runHealthCheck = async () => {
    setBackendStatus('checking')
    setDbStatus('checking')
    setAuthStatus('checking')
    setLastCheck(new Date())

    if (config.mode === 'frontend-only') {
      setBackendStatus('mock')
      setDbStatus('mock')
      setAuthStatus('mock')
      return
    }

    await Promise.all([
      checkBackendHealth(),
      checkAuthStatus()
    ])
  }

  useEffect(() => {
    runHealthCheck()
    
    // Check every 30 seconds
    const interval = setInterval(runHealthCheck, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'checking':
        return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />
      case 'mock':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'disconnected':
      case 'error':
      case 'invalid_token':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'no_token':
        return <WifiOff className="w-4 h-4 text-gray-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
        return 'bg-green-100 text-green-800'
      case 'checking':
        return 'bg-yellow-100 text-yellow-800'
      case 'mock':
        return 'bg-blue-100 text-blue-800'
      case 'disconnected':
      case 'error':
      case 'invalid_token':
        return 'bg-red-100 text-red-800'
      case 'no_token':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'متصل'
      case 'authenticated': return 'مصادق'
      case 'checking': return 'فحص...'
      case 'mock': return 'وضع تجريبي'
      case 'disconnected': return 'منقطع'
      case 'error': return 'خطأ'
      case 'invalid_token': return 'رمز غير صالح'
      case 'no_token': return 'غير مسجل'
      default: return 'غير معروف'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          {config.mode === 'frontend-only' ? (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Database className="w-3 h-3 mr-1" />
              وضع تجريبي
            </Badge>
          ) : (
            <Badge variant="secondary" className={getStatusColor(backendStatus)}>
              <Server className="w-3 h-3 mr-1" />
              {getStatusText(backendStatus)}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          حالة النظام
          <button 
            onClick={runHealthCheck}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800"
          >
            تحديث
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-gray-500" />
              <span className="text-sm">الخادم</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(backendStatus)}
              <Badge variant="secondary" className={getStatusColor(backendStatus)}>
                {getStatusText(backendStatus)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-sm">قاعدة البيانات</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(dbStatus)}
              <Badge variant="secondary" className={getStatusColor(dbStatus)}>
                {getStatusText(dbStatus)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-sm">المصادقة</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(authStatus)}
              <Badge variant="secondary" className={getStatusColor(authStatus)}>
                {getStatusText(authStatus)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>آخر فحص:</span>
            <span>{lastCheck.toLocaleTimeString('ar-EG')}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>الوضع:</span>
            <span className="font-medium">
              {config.mode === 'frontend-only' ? 'تجريبي' : 'إنتاج'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



