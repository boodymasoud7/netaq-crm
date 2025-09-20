import React from 'react'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from './button'
import ErrorBoundary from './ErrorBoundary'
import { LoadErrorState, NoPermissionState } from './EmptyState'
import { TableSkeleton } from './SkeletonLoader'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

/**
 * مكون wrapper للصفحات مع معالجة شاملة للحالات
 */
export const PageWrapper = ({
  children,
  title,
  subtitle,
  loading = false,
  error = null,
  onRetry,
  onBack,
  showBackButton = false,
  requirePermission = null,
  loadingSkeleton = null,
  headerActions = null,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const { currentUser } = useAuth()
  const { checkPermission } = usePermissions()

  // Check permissions
  if (requirePermission && !checkPermission(requirePermission)) {
    return (
      <ErrorBoundary>
        <NoPermissionState
          title="غير مسموح بالوصول"
          description={`ليس لديك صلاحية للوصول إلى ${title || 'هذه الصفحة'}`}
          onGoBack={onBack || (() => window.history.back())}
        />
      </ErrorBoundary>
    )
  }

  // Error state
  if (error) {
    return (
      <ErrorBoundary>
        <LoadErrorState
          title={`فشل في تحميل ${title || 'الصفحة'}`}
          description="حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى."
          onRetry={onRetry}
        />
      </ErrorBoundary>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-6 p-6 ${containerClassName}`}>
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            {subtitle && <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>}
          </div>
          {headerActions && (
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          )}
        </div>
        
        {/* Custom skeleton or default */}
        {loadingSkeleton || <TableSkeleton rows={8} columns={6} />}
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`${containerClassName}`} {...props}>
        {/* Page Header */}
        {(title || headerActions || showBackButton) && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {showBackButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack || (() => window.history.back())}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    رجوع
                  </Button>
                )}
                
                <div>
                  {title && (
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-gray-600 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              {headerActions && (
                <div className="flex items-center gap-2">
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      تحديث
                    </Button>
                  )}
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Page Content */}
        <div className={className}>
          {children}
        </div>
      </div>
    </ErrorBoundary>
  )
}

/**
 * مكون wrapper للجداول
 */
export const TablePageWrapper = ({
  children,
  data = [],
  searchTerm = '',
  onSearchChange,
  filters = [],
  headerActions = null,
  emptyState = null,
  searchPlaceholder = 'البحث...',
  showSearch = true,
  ...pageProps
}) => {
  const hasData = data && data.length > 0
  const hasSearchResults = searchTerm ? data.some(item => 
    Object.values(item).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) : hasData

  return (
    <PageWrapper {...pageProps}>
      <div className="space-y-6">
        {/* Filters and Search */}
        {(showSearch || filters.length > 0 || headerActions) && (
          <div className="bg-white rounded-lg border p-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex flex-1 gap-4">
                {showSearch && (
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                {filters.map((filter, index) => (
                  <div key={index} className="min-w-32">
                    {filter}
                  </div>
                ))}
              </div>
              
              {headerActions && (
                <div className="flex gap-2">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Content */}
        {hasSearchResults ? (
          children
        ) : (
          emptyState || (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <svg className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'لا توجد نتائج' : 'لا توجد بيانات'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? `لم يتم العثور على نتائج للبحث عن "${searchTerm}"`
                    : 'لم يتم إضافة أي بيانات بعد'
                  }
                </p>
                {searchTerm && onSearchChange && (
                  <Button variant="outline" onClick={() => onSearchChange('')}>
                    مسح البحث
                  </Button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </PageWrapper>
  )
}

/**
 * مكون wrapper للنماذج
 */
export const FormPageWrapper = ({
  children,
  onSubmit,
  onCancel,
  loading = false,
  submitText = 'حفظ',
  cancelText = 'إلغاء',
  showButtons = true,
  formClassName = '',
  ...pageProps
}) => {
  return (
    <PageWrapper {...pageProps}>
      <div className="bg-white rounded-lg border">
        <form onSubmit={onSubmit} className={`p-6 space-y-6 ${formClassName}`}>
          {children}
          
          {showButtons && (
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الحفظ...' : submitText}
              </Button>
            </div>
          )}
        </form>
      </div>
    </PageWrapper>
  )
}

/**
 * مكون wrapper للتفاصيل
 */
export const DetailPageWrapper = ({
  children,
  title,
  subtitle,
  actions = [],
  tabs = [],
  activeTab = null,
  onTabChange,
  ...pageProps
}) => {
  return (
    <PageWrapper
      title={title}
      subtitle={subtitle}
      showBackButton={true}
      headerActions={
        actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {action}
              </React.Fragment>
            ))}
          </div>
        )
      }
      {...pageProps}
    >
      {tabs.length > 0 && (
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}
      
      {children}
    </PageWrapper>
  )
}

export default PageWrapper

