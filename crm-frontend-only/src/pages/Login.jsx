import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../contexts/AuthContext'
import { EnhancedForm, FormField, useFormValidation, validationRules } from '../components/ui/EnhancedForm'
import { LoadingButton } from '../components/ui/LoadingButton'
import { enhancedToast } from '../components/ui/EnhancedToast'
import ErrorBoundary from '../components/ui/ErrorBoundary'

export default function Login() {
  const { user, login, loading, clearAllSessions } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form validation
  const {
    values,
    errors,
    setValue,
    validateAll,
    reset
  } = useFormValidation(
    { email: '', password: '' },
    {
      email: [
        validationRules.required('البريد الإلكتروني مطلوب'),
        validationRules.email()
      ],
      password: [
        validationRules.required('كلمة المرور مطلوبة'),
        validationRules.minLength(3, 'كلمة المرور قصيرة جداً')
      ]
    }
  )

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateAll()) {
      enhancedToast.warning('يرجى تصحيح الأخطاء في النموذج')
      return
    }

    setIsLoading(true)

    try {
      await login(values.email, values.password)
      enhancedToast.success('تم تسجيل الدخول بنجاح!')
    } catch (error) {
      console.error('Login error:', error)
      enhancedToast.error('فشل في تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">نطاق CRM</h1>
          <p className="text-gray-600">صُنع بكل حب خصيصاً لشركة نطاق</p>
        </div>

        {/* Login Card */}
        <Card className="bizmax-card shadow-strong border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-gray-900">تسجيل الدخول</CardTitle>
            <p className="text-sm text-gray-500 text-center">
              أدخل بياناتك للوصول إلى حسابك
            </p>
          </CardHeader>
          
          <CardContent>
            <EnhancedForm 
              onSubmit={handleSubmit} 
              loading={isLoading}
              showButtons={false}
              className="space-y-4"
            >
              {/* Email Field */}
              <FormField
                label="البريد الإلكتروني"
                name="email"
                type="email"
                value={values.email}
                onChange={(e) => setValue('email', e.target.value)}
                error={errors.email}
                placeholder="أدخل بريدك الإلكتروني"
                icon={Mail}
                required
                disabled={isLoading}
              />

              {/* Password Field */}
              <FormField
                label="كلمة المرور"
                name="password"
                type="password"
                value={values.password}
                onChange={(e) => setValue('password', e.target.value)}
                error={errors.password}
                placeholder="أدخل كلمة المرور"
                icon={Lock}
                required
                disabled={isLoading}
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="mr-2 text-sm text-gray-600">تذكرني</span>
                </label>
                <a
                  href="#"
                  className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
                >
                  نسيت كلمة المرور؟
                </a>
              </div>

              {/* Login Button */}
              <LoadingButton
                type="submit"
                loading={isLoading}
                loadingText="جاري تسجيل الدخول..."
                className="w-full bizmax-button-primary h-12 text-base font-semibold"
              >
                تسجيل الدخول
              </LoadingButton>
            </EnhancedForm>


          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 نطاق CRM. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              الخصوصية
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              الشروط والأحكام
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              الدعم
            </a>
          </div>
        </div>

        {/* Developer Tools - Hidden */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('هل تريد مسح جميع البيانات المحفوظة؟ (للتطوير فقط)')) {
                clearAllSessions()
              }
            }}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors opacity-30 hover:opacity-100"
            title="مسح البيانات المحفوظة (للتطوير)"
          >
            🧹 مسح البيانات
          </button>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse hidden lg:block"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse hidden lg:block" style={{ animationDelay: '2s' }}></div>
    </div>
    </ErrorBoundary>
  )
}