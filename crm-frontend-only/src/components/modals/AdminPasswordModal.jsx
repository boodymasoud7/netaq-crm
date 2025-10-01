import { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export default function AdminPasswordModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  adminEmail,
  loading = false 
}) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور')
      return
    }
    
    setError('')
    onConfirm(password)
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    setShowPassword(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Lock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">تأكيد هوية المدير</h3>
            <p className="text-sm text-gray-600">يرجى إدخال كلمة مرورك لإنشاء المستخدم الجديد والحفاظ على جلستك</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <Input
              type="email"
              value={adminEmail || ''}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة مرورك"
                className="pl-10"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>ملاحظة:</strong> سيتم إنشاء المستخدم الجديد وإعادة تسجيل دخولك تلقائياً للحفاظ على جلستك.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !password.trim()}
            >
              {loading ? 'جاري التحقق...' : 'تأكيد وإنشاء المستخدم'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
