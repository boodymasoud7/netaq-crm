import React from 'react'
import { Button } from './button'

/**
 * مكون العرض الفارغ المحسن
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  illustration = null,
  size = 'default',
  className = ''
}) => {
  const sizeClasses = {
    small: 'py-8',
    default: 'py-12',
    large: 'py-16'
  }

  const iconSizes = {
    small: 'h-8 w-8',
    default: 'h-12 w-12',
    large: 'h-16 w-16'
  }

  return (
    <div className={`text-center ${sizeClasses[size]} ${className}`}>
      <div className="max-w-md mx-auto">
        {/* Illustration or Icon */}
        {illustration ? (
          <div className="mb-6">
            {illustration}
          </div>
        ) : Icon ? (
          <div className="mb-6 flex justify-center">
            <div className="bg-gray-100 rounded-full p-3">
              <Icon className={`${iconSizes[size]} text-gray-400`} />
            </div>
          </div>
        ) : null}

        {/* Title */}
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
        )}

        {/* Description */}
        {description && (
          <p className="text-gray-500 mb-6 leading-relaxed">
            {description}
          </p>
        )}

        {/* Action Button */}
        {action || (actionLabel && onAction) ? (
          <div className="space-y-3">
            {action ? (
              action
            ) : (
              <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700 text-white">
                {actionLabel}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/**
 * حالات فارغة محددة مسبقاً
 */

// لا توجد بيانات
export const NoDataState = ({ 
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي بيانات لعرضها',
  actionLabel,
  onAction,
  ...props 
}) => {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      illustration={
        <svg className="h-24 w-24 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      {...props}
    />
  )
}

// لا توجد نتائج بحث
export const NoSearchResults = ({ 
  searchTerm,
  title = 'لا توجد نتائج',
  onClearSearch,
  ...props 
}) => {
  const description = searchTerm 
    ? `لم يتم العثور على نتائج للبحث عن "${searchTerm}"`
    : 'لم يتم العثور على أي نتائج'

  return (
    <EmptyState
      title={title}
      description={description}
      action={onClearSearch && (
        <Button variant="outline" onClick={onClearSearch}>
          مسح البحث
        </Button>
      )}
      illustration={
        <svg className="h-24 w-24 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      {...props}
    />
  )
}

// خطأ في التحميل
export const LoadErrorState = ({ 
  title = 'فشل في تحميل البيانات',
  description = 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.',
  onRetry,
  ...props 
}) => {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel="إعادة المحاولة"
      onAction={onRetry}
      illustration={
        <svg className="h-24 w-24 mx-auto text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      }
      {...props}
    />
  )
}

// لا توجد صلاحية
export const NoPermissionState = ({ 
  title = 'غير مسموح بالوصول',
  description = 'ليس لديك صلاحية لعرض هذا المحتوى',
  onGoBack,
  ...props 
}) => {
  return (
    <EmptyState
      title={title}
      description={description}
      actionLabel="العودة"
      onAction={onGoBack}
      illustration={
        <svg className="h-24 w-24 mx-auto text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
      {...props}
    />
  )
}

// صفحة قيد الإنشاء
export const ComingSoonState = ({ 
  title = 'قريباً...',
  description = 'هذه الميزة قيد التطوير وستكون متاحة قريباً',
  ...props 
}) => {
  return (
    <EmptyState
      title={title}
      description={description}
      illustration={
        <svg className="h-24 w-24 mx-auto text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      }
      {...props}
    />
  )
}

export default EmptyState

