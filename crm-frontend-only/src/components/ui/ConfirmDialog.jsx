import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './button'
import { Card } from './card'

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'تأكيد العملية',
  message = 'هل أنت متأكد من هذا الإجراء؟',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'danger' // danger, warning, info
}) {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          iconBg: 'bg-red-100'
        }
      case 'warning':
        return {
          icon: 'text-orange-600',
          confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white',
          iconBg: 'bg-orange-100'
        }
      default:
        return {
          icon: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          iconBg: 'bg-blue-100'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
                <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <div className="text-gray-600 leading-relaxed">{message}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={styles.confirmButton}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}