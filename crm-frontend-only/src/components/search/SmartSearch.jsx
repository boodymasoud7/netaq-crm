import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  Filter, 
  X, 
  Star, 
  Clock, 
  TrendingUp,
  User,
  Building2,
  DollarSign,
  MapPin,
  Calendar
} from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { useDebounce } from '../../hooks/useDebounce'

const SEARCH_CATEGORIES = {
  all: { name: 'الكل', icon: Search, color: 'text-gray-600' },
  clients: { name: 'العملاء', icon: User, color: 'text-blue-600' },
  leads: { name: 'العملاء المحتملين', icon: TrendingUp, color: 'text-orange-600' },
  projects: { name: 'المشاريع', icon: Building2, color: 'text-purple-600' },
  sales: { name: 'المبيعات', icon: DollarSign, color: 'text-green-600' },
  locations: { name: 'المواقع', icon: MapPin, color: 'text-red-600' }
}

const QUICK_FILTERS = [
  { label: 'اليوم', value: 'today', icon: Clock },
  { label: 'هذا الأسبوع', value: 'week', icon: Calendar },
  { label: 'هذا الشهر', value: 'month', icon: Calendar },
  { label: 'المفضلة', value: 'favorites', icon: Star }
]

export default function SmartSearch({ 
  onSearch, 
  onFilter, 
  placeholder = "ابحث في جميع البيانات...",
  showCategories = true,
  showQuickFilters = true,
  recentSearches = [],
  suggestions = [],
  className = ""
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeFilters, setActiveFilters] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const searchRef = useRef(null)
  const debouncedQuery = useDebounce(query, 300)

  // إغلاق البحث عند النقر خارجه
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // تنفيذ البحث عند تغيير النص
  useEffect(() => {
    if (debouncedQuery && onSearch) {
      onSearch({
        query: debouncedQuery,
        category: selectedCategory,
        filters: activeFilters
      })
    }
  }, [debouncedQuery, selectedCategory, activeFilters, onSearch])

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    if (onFilter) {
      onFilter({ category, filters: activeFilters })
    }
  }

  const handleQuickFilter = (filter) => {
    const newFilters = activeFilters.includes(filter)
      ? activeFilters.filter(f => f !== filter)
      : [...activeFilters, filter]
    
    setActiveFilters(newFilters)
    if (onFilter) {
      onFilter({ category: selectedCategory, filters: newFilters })
    }
  }

  const clearSearch = () => {
    setQuery('')
    setActiveFilters([])
    setSelectedCategory('all')
    if (onSearch) {
      onSearch({ query: '', category: 'all', filters: [] })
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {SEARCH_CATEGORIES[selectedCategory].name}
            </Badge>
          )}
        </div>
        
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleQueryChange}
          onFocus={() => setIsOpen(true)}
          className="pr-20 pl-10 h-11 text-sm"
        />
        
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {activeFilters.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {activeFilters.length}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-6 w-6 p-0"
          >
            <Filter className="h-3 w-3" />
          </Button>
          
          {(query || activeFilters.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg">
          <div className="p-4 space-y-4">
            {/* Categories */}
            {showCategories && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  الفئات
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(SEARCH_CATEGORIES).map(([key, category]) => {
                    const Icon = category.icon
                    const isActive = selectedCategory === key
                    
                    return (
                      <button
                        key={key}
                        onClick={() => handleCategorySelect(key)}
                        className={`flex items-center gap-2 p-2 text-sm rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                            : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : category.color}`} />
                        <span>{category.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick Filters */}
            {showQuickFilters && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  فلاتر سريعة
                </h4>
                <div className="flex flex-wrap gap-2">
                  {QUICK_FILTERS.map((filter) => {
                    const Icon = filter.icon
                    const isActive = activeFilters.includes(filter.value)
                    
                    return (
                      <button
                        key={filter.value}
                        onClick={() => handleQuickFilter(filter.value)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full transition-colors ${
                          isActive
                            ? 'bg-primary-100 text-primary-700 border border-primary-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {filter.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && !query && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  عمليات البحث الأخيرة
                </h4>
                <div className="space-y-1">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(search)}
                      className="flex items-center gap-2 w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Clock className="h-3 w-3 text-gray-400" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && query && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  اقتراحات
                </h4>
                <div className="space-y-1">
                  {suggestions.slice(0, 8).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="flex items-center gap-2 w-full p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Search className="h-3 w-3 text-gray-400" />
                      <span className="flex-1 text-right">{suggestion.text}</span>
                      {suggestion.category && (
                        <Badge variant="outline" className="text-xs">
                          {SEARCH_CATEGORIES[suggestion.category]?.name}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query && suggestions.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">لا توجد نتائج للبحث</p>
                <p className="text-xs text-gray-400 mt-1">جرب كلمات مختلفة أو استخدم الفلاتر</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-40 shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">البحث المتقدم</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  التاريخ من
                </label>
                <Input type="date" className="h-8 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  التاريخ إلى
                </label>
                <Input type="date" className="h-8 text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  الحالة
                </label>
                <select className="w-full h-8 text-sm border border-gray-300 rounded-md">
                  <option value="">جميع الحالات</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  الموظف المسؤول
                </label>
                <select className="w-full h-8 text-sm border border-gray-300 rounded-md">
                  <option value="">جميع الموظفين</option>
                  <option value="me">أنا فقط</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="flex-1">
                تطبيق الفلاتر
              </Button>
              <Button variant="outline" size="sm">
                إعادة تعيين
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

