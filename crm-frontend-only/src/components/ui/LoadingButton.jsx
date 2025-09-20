import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from './button'

/**
 * زر محسن مع حالات loading
 */
export const LoadingButton = ({ 
  loading = false,
  loadingText = 'جاري التحميل...',
  children,
  disabled = false,
  size = 'default',
  variant = 'default',
  className = '',
  icon = null,
  ...props 
}) => {
  const isDisabled = loading || disabled

  return (
    <Button
      disabled={isDisabled}
      size={size}
      variant={variant}
      className={`
        relative transition-all duration-200
        ${loading ? 'cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-current bg-opacity-10 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
      
      {/* Content */}
      <div className={`flex items-center gap-2 ${loading ? 'opacity-70' : ''}`}>
        {!loading && icon && React.cloneElement(icon, { className: 'h-4 w-4' })}
        <span>
          {loading ? loadingText : children}
        </span>
      </div>
    </Button>
  )
}

/**
 * زر إرسال محسن للنماذج
 */
export const SubmitButton = ({ 
  loading = false,
  loadingText = 'جاري الحفظ...',
  children = 'حفظ',
  ...props 
}) => {
  return (
    <LoadingButton
      type="submit"
      loading={loading}
      loadingText={loadingText}
      variant="default"
      className="bg-blue-600 hover:bg-blue-700 text-white"
      {...props}
    >
      {children}
    </LoadingButton>
  )
}

/**
 * زر حذف محسن
 */
export const DeleteButton = ({ 
  loading = false,
  loadingText = 'جاري الحذف...',
  children = 'حذف',
  ...props 
}) => {
  return (
    <LoadingButton
      loading={loading}
      loadingText={loadingText}
      variant="destructive"
      className="bg-red-600 hover:bg-red-700 text-white"
      {...props}
    >
      {children}
    </LoadingButton>
  )
}

/**
 * زر تحديث/refresh
 */
export const RefreshButton = ({ 
  loading = false,
  loadingText = 'جاري التحديث...',
  children = 'تحديث',
  icon,
  ...props 
}) => {
  const refreshIcon = loading ? 
    <Loader2 className="h-4 w-4 animate-spin" /> : 
    icon || <Loader2 className="h-4 w-4" />

  return (
    <LoadingButton
      loading={loading}
      loadingText={loadingText}
      variant="outline"
      icon={refreshIcon}
      {...props}
    >
      {children}
    </LoadingButton>
  )
}

export default LoadingButton

