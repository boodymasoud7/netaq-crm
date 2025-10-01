import { useState } from 'react'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Grid3X3,
  List,
  Download,
  Share2,
  Eye,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

export default function SearchResults({ 
  results = [], 
  loading = false,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 10,
  onSort,
  onViewChange,
  onExport,
  viewMode = 'grid', // 'grid' | 'list'
  sortBy = '',
  sortOrder = 'asc', // 'asc' | 'desc'
  searchQuery = '',
  renderItem,
  renderListItem,
  emptyState
}) {
  const [showSortMenu, setShowSortMenu] = useState(false)

  // خيارات الترتيب
  const sortOptions = [
    { key: 'name', label: 'الاسم', icon: SortAsc },
    { key: 'createdAt', label: 'تاريخ الإنشاء', icon: SortAsc },
    { key: 'updatedAt', label: 'آخر تحديث', icon: SortAsc },
    { key: 'status', label: 'الحالة', icon: SortAsc },
    { key: 'priority', label: 'الأولوية', icon: SortAsc }
  ]

  // تطبيق الترتيب
  const handleSort = (key) => {
    const newOrder = sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc'
    onSort?.(key, newOrder)
    setShowSortMenu(false)
  }

  // إحصائيات النتائج
  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount)

  if (loading) {
    return (
      <div className="space-y-4">
        {/* شريط التحكم */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* النتائج الوهمية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-card">
              <div className="space-y-3">
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return emptyState || (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <Filter className="h-full w-full" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
        <p className="text-gray-500 mb-4">
          {searchQuery ? 
            `لم يتم العثور على نتائج للبحث "${searchQuery}"` : 
            'جرب تعديل معايير البحث'
          }
        </p>
        <p className="text-sm text-gray-400">اقتراحات:</p>
        <ul className="text-sm text-gray-400 mt-2 space-y-1">
          <li>• تأكد من كتابة الكلمات بشكل صحيح</li>
          <li>• جرب كلمات مفتاحية أخرى</li>
          <li>• قلل من عدد الفلاتر المستخدمة</li>
        </ul>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* شريط التحكم */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* معلومات النتائج */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            عرض {startIndex}-{endIndex} من {totalCount} نتيجة
            {searchQuery && (
              <span className="mr-2">
                للبحث: <strong>"{searchQuery}"</strong>
              </span>
            )}
          </div>
          
          {/* مؤشر النتائج السريعة */}
          {searchQuery && (
            <Badge variant="outline" className="text-xs">
              <Eye className="h-3 w-3 ml-1" />
              {totalCount} نتيجة
            </Badge>
          )}
        </div>

        {/* أدوات التحكم */}
        <div className="flex items-center gap-2">
          {/* أزرار العرض */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange?.('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange?.('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* قائمة الترتيب */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2"
            >
              {sortBy ? (
                <>
                  {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {sortOptions.find(opt => opt.key === sortBy)?.label || 'ترتيب'}
                </>
              ) : (
                <>
                  <ArrowUpDown className="h-4 w-4" />
                  ترتيب
                </>
              )}
            </Button>

            {showSortMenu && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2 px-2">ترتيب حسب</div>
                  {sortOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => handleSort(option.key)}
                      className={`w-full text-right px-2 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between ${
                        sortBy === option.key ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.key && (
                        sortOrder === 'asc' ? 
                          <ArrowUp className="h-3 w-3" /> : 
                          <ArrowDown className="h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* أزرار إضافية */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            مشاركة
          </Button>
        </div>
      </div>

      {/* النتائج */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      }`}>
        {results.map((item, index) => (
          <div key={item.id || index}>
            {viewMode === 'grid' ? 
              renderItem?.(item, index) : 
              renderListItem?.(item, index) || renderItem?.(item, index)
            }
          </div>
        ))}
      </div>

      {/* إحصائيات إضافية */}
      {totalCount > 0 && (
        <div className="border-t pt-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>إجمالي النتائج: <strong>{totalCount}</strong></span>
            <span>الصفحة الحالية: <strong>{currentPage}</strong></span>
            <span>عدد الصفحات: <strong>{Math.ceil(totalCount / itemsPerPage)}</strong></span>
          </div>
        </div>
      )}

      {/* إغلاق قائمة الترتيب عند النقر خارجها */}
      {showSortMenu && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </div>
  )
}

