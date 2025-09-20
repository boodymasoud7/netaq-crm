import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './button'

export const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'تأكيد العملية', 
  message = 'هل أنت متأكد من رغبتك في تنفيذ هذا الإجراء؟',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger' // danger, warning, info
}) => {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
        }
      case 'warning':
        return {
          iconColor: 'text-orange-600',
          confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white'
        }
      case 'info':
        return {
          iconColor: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
      default:
        return {
          iconColor: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
        }
    }
  }

  const variantClasses = getVariantClasses()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${variantClasses.iconColor}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
              <p className="text-sm text-gray-600">
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConfirm}
              className={variantClasses.confirmButton}
            >
              {confirmText}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
