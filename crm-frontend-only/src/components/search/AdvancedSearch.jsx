import { useState } from 'react'
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  DollarSign,
  MapPin,
  User,
  Building,
  ChevronDown,
  Save,
  RotateCcw
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'

export default function AdvancedSearch({ 
  onSearch, 
  onFilter, 
  filters = {}, 
  searchFields = [],
  filterOptions = {},
  savedSearches = [],
  onSaveSearch,
  onLoadSearch 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [saveSearchName, setSaveSearchName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // تطبيق البحث
  const handleSearch = () => {
    const searchData = {
      term: searchTerm,
      filters: activeFilters,
      dateRange,
      priceRange
    }
    onSearch?.(searchData)
  }

  // إضافة فلتر
  const addFilter = (key, value) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onFilter?.(newFilters)
  }

  // إزالة فلتر
  const removeFilter = (key) => {
    const newFilters = { ...activeFilters }
    delete newFilters[key]
    setActiveFilters(newFilters)
    onFilter?.(newFilters)
  }

  // مسح جميع الفلاتر
  const clearAllFilters = () => {
    setActiveFilters({})
    setSearchTerm('')
    setDateRange({ from: '', to: '' })
    setPriceRange({ min: '', max: '' })
    onFilter?.({})
    onSearch?.({ term: '', filters: {}, dateRange: { from: '', to: '' }, priceRange: { min: '', max: '' } })
  }

  // حفظ البحث
  const saveCurrentSearch = () => {
    if (!saveSearchName.trim()) return
    
    const searchData = {
      name: saveSearchName,
      term: searchTerm,
      filters: activeFilters,
      dateRange,
      priceRange,
      createdAt: new Date()
    }
    
    onSaveSearch?.(searchData)
    setSaveSearchName('')
    setShowSaveDialog(false)
  }

  // تحميل بحث محفوظ
  const loadSavedSearch = (search) => {
    setSearchTerm(search.term || '')
    setActiveFilters(search.filters || {})
    setDateRange(search.dateRange || { from: '', to: '' })
    setPriceRange(search.priceRange || { min: '', max: '' })
    onLoadSearch?.(search)
  }

  // عدد الفلاتر النشطة
  const activeFilterCount = Object.keys(activeFilters).length + 
    (dateRange.from || dateRange.to ? 1 : 0) +
    (priceRange.min || priceRange.max ? 1 : 0)

  return (
    <Card className="bizmax-card">
      {/* شريط البحث الأساسي */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="البحث الذكي - اكتب أي شيء..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pr-10"
          />
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative"
        >
          <Filter className="h-4 w-4 ml-2" />
          فلاتر متقدمة
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -left-2 h-5 w-5 p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>

        <Button onClick={handleSearch} className="bizmax-button-primary">
          بحث
        </Button>
      </div>

      {/* الفلاتر النشطة */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(activeFilters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="flex items-center gap-1">
              {filterOptions[key]?.label || key}: {value}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeFilter(key)}
              />
            </Badge>
          ))}
          
          {(dateRange.from || dateRange.to) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              التاريخ: {dateRange.from} - {dateRange.to}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => setDateRange({ from: '', to: '' })}
              />
            </Badge>
          )}
          
          {(priceRange.min || priceRange.max) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              السعر: {priceRange.min} - {priceRange.max}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => setPriceRange({ min: '', max: '' })}
              />
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-red-500 hover:text-red-700"
          >
            <RotateCcw className="h-3 w-3 ml-1" />
            مسح الكل
          </Button>
        </div>
      )}

      {/* الفلاتر المتقدمة */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t space-y-6">
          {/* البحث المحفوظ */}
          {savedSearches?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">عمليات البحث المحفوظة</h4>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => loadSavedSearch(search)}
                    className="text-xs"
                  >
                    {search.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* فلاتر مخصصة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* فلاتر الحالة */}
            {filterOptions.status && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select
                  value={activeFilters.status || ''}
                  onChange={(e) => e.target.value ? addFilter('status', e.target.value) : removeFilter('status')}
                  className="bizmax-input w-full h-9"
                >
                  <option value="">جميع الحالات</option>
                  {filterOptions.status.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* فلاتر النوع */}
            {filterOptions.type && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
                <select
                  value={activeFilters.type || ''}
                  onChange={(e) => e.target.value ? addFilter('type', e.target.value) : removeFilter('type')}
                  className="bizmax-input w-full h-9"
                >
                  <option value="">جميع الأنواع</option>
                  {filterOptions.type.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* فلاتر المصدر */}
            {filterOptions.source && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المصدر</label>
                <select
                  value={activeFilters.source || ''}
                  onChange={(e) => e.target.value ? addFilter('source', e.target.value) : removeFilter('source')}
                  className="bizmax-input w-full h-9"
                >
                  <option value="">جميع المصادر</option>
                  {filterOptions.source.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* فلاتر المسؤول */}
            {filterOptions.assignedTo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المسؤول</label>
                <select
                  value={activeFilters.assignedTo || ''}
                  onChange={(e) => e.target.value ? addFilter('assignedTo', e.target.value) : removeFilter('assignedTo')}
                  className="bizmax-input w-full h-9"
                >
                  <option value="">جميع المسؤولين</option>
                  {filterOptions.assignedTo.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* فلاتر الموقع */}
            {filterOptions.location && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline ml-1" />
                  الموقع
                </label>
                <select
                  value={activeFilters.location || ''}
                  onChange={(e) => e.target.value ? addFilter('location', e.target.value) : removeFilter('location')}
                  className="bizmax-input w-full h-9"
                >
                  <option value="">جميع المواقع</option>
                  {filterOptions.location.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* فلاتر الأولوية */}
            {filterOptions.priority && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                <select
                  value={activeFilters.priority || ''}
                  onChange={(e) => e.target.value ? addFilter('priority', e.target.value) : removeFilter('priority')}
                  className="bizmax-input w-full h-9"
                >
                  <option value="">جميع الأولويات</option>
                  {filterOptions.priority.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* نطاق التاريخ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline ml-1" />
                من تاريخ
              </label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>

          {/* نطاق السعر */}
          {filterOptions.priceRange && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline ml-1" />
                  السعر من (جنيه)
                </label>
                <Input
                  type="number"
                  placeholder="100,000"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السعر إلى (جنيه)</label>
                <Input
                  type="number"
                  placeholder="1,000,000"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="bizmax-button-primary">
                <Search className="h-4 w-4 ml-2" />
                تطبيق البحث
              </Button>
              <Button variant="outline" onClick={clearAllFilters}>
                <RotateCcw className="h-4 w-4 ml-2" />
                إعادة تعيين
              </Button>
            </div>

            <div className="flex gap-2">
              {!showSaveDialog ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!searchTerm && Object.keys(activeFilters).length === 0}
                >
                  <Save className="h-4 w-4 ml-2" />
                  حفظ البحث
                </Button>
              ) : (
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="اسم البحث..."
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    className="w-32 h-8"
                    onKeyPress={(e) => e.key === 'Enter' && saveCurrentSearch()}
                  />
                  <Button size="sm" onClick={saveCurrentSearch} disabled={!saveSearchName.trim()}>
                    حفظ
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(false)}>
                    إلغاء
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

