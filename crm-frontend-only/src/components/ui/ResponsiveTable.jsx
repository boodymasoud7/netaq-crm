import React, { useState } from 'react'
import { ChevronDown, ChevronUp, MoreHorizontal, Search } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Badge } from './badge'

/**
 * جدول responsive محسن
 */
export const ResponsiveTable = ({
  data = [],
  columns = [],
  loading = false,
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  className = '',
  emptyState,
  loadingComponent,
  mobileCardRenderer, // دالة لعرض البيانات كـ cards في الموبايل
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState(new Set())

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data

    return data.filter(row =>
      columns.some(column => {
        const value = row[column.key]
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
  }, [data, searchTerm, columns])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination])

  // Handle sort
  const handleSort = (key) => {
    if (!sortable) return

    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Handle expand row (mobile)
  const toggleRowExpansion = (rowIndex) => {
    setExpandedRows(current => {
      const newSet = new Set(current)
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex)
      } else {
        newSet.add(rowIndex)
      }
      return newSet
    })
  }

  // Render mobile card view
  const renderMobileCard = (row, index) => {
    if (mobileCardRenderer) {
      return mobileCardRenderer(row, index)
    }

    return (
      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
        <div className="space-y-2">
          {columns.slice(0, 3).map(column => (
            <div key={column.key} className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">{column.title}</span>
              <span className="text-sm text-gray-900">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </span>
            </div>
          ))}
          
          {columns.length > 3 && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleRowExpansion(index)}
                className="w-full"
              >
                {expandedRows.has(index) ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    إخفاء التفاصيل
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    عرض المزيد
                  </>
                )}
              </Button>
              
              {expandedRows.has(index) && (
                <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                  {columns.slice(3).map(column => (
                    <div key={column.key} className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">{column.title}</span>
                      <span className="text-sm text-gray-900">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {onRowClick && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRowClick(row)}
                className="w-full"
              >
                عرض التفاصيل
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading && loadingComponent) {
    return loadingComponent
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`} {...props}>
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        {paginatedData.length === 0 ? (
          <div className="p-8 text-center">
            {emptyState || (
              <div>
                <p className="text-gray-500 mb-4">لا توجد بيانات لعرضها</p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    مسح البحث
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    className={`
                      px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider
                      ${sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}
                    `}
                    onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.title}</span>
                      {sortable && column.sortable !== false && sortConfig.key === column.key && (
                        <span className="ml-2">
                          {sortConfig.direction === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={`
                    hover:bg-gray-50 transition-colors
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {paginatedData.length === 0 ? (
          <div className="p-8 text-center">
            {emptyState || (
              <div>
                <p className="text-gray-500 mb-4">لا توجد بيانات لعرضها</p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    مسح البحث
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            {paginatedData.map((row, index) => renderMobileCard(row, index))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && paginatedData.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            عرض {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, sortedData.length)} من {sortedData.length} نتيجة
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(sortedData.length / pageSize)))}
              disabled={currentPage === Math.ceil(sortedData.length / pageSize)}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResponsiveTable

