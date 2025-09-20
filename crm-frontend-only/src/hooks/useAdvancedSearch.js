import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from './useDebounce'

export function useAdvancedSearch(data = [], options = {}) {
  const {
    searchFields = ['name', 'email', 'phone'],
    filterFields = ['status', 'type', 'source'],
    sortFields = ['name', 'createdAt', 'updatedAt'],
    defaultSort = 'name',
    defaultOrder = 'asc',
    enablePagination = true,
    itemsPerPage = 50
  } = options

  // دالة مساعدة للوصول للقيم المتداخلة
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // حالة البحث
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState(defaultSort)
  const [sortOrder, setSortOrder] = useState(defaultOrder)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState('grid')
  const [savedSearches, setSavedSearches] = useState([])

  // تأخير البحث لتحسين الأداء
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // تحميل البحث المحفوظ من التخزين المحلي
  useEffect(() => {
    const saved = localStorage.getItem('savedSearches')
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved))
      } catch (error) {
        console.error('خطأ في تحميل البحث المحفوظ:', error)
      }
    }
  }, [])

  // البحث النصي المتقدم
  const performTextSearch = (items, term) => {
    if (!term) return items
    
    const searchWords = term.toLowerCase().split(' ').filter(word => word.length > 0)
    
    return items.filter(item => {
      return searchWords.every(word => {
        return searchFields.some(field => {
          const fieldValue = getNestedValue(item, field)
          return fieldValue && fieldValue.toString().toLowerCase().includes(word)
        })
      })
    })
  }

  // تطبيق الفلاتر
  const applyFilters = (items, activeFilters) => {
    let filtered = items

    // فلاتر عادية
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(item => {
          const itemValue = getNestedValue(item, key)
          return itemValue === value
        })
      }
    })

    // فلتر التاريخ
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = getNestedValue(item, 'createdAt') || getNestedValue(item, 'date')
        if (!itemDate) return false
        
        const date = itemDate.toDate ? itemDate.toDate() : new Date(itemDate)
        
        if (dateRange.from && date < new Date(dateRange.from)) return false
        if (dateRange.to && date > new Date(dateRange.to)) return false
        
        return true
      })
    }

    // فلتر السعر
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(item => {
        const price = getNestedValue(item, 'price') || getNestedValue(item, 'startPrice') || 0
        
        if (priceRange.min && price < parseFloat(priceRange.min)) return false
        if (priceRange.max && price > parseFloat(priceRange.max)) return false
        
        return true
      })
    }

    return filtered
  }

  // ترتيب النتائج
  const sortResults = (items, sortField, order) => {
    return [...items].sort((a, b) => {
      const aValue = getNestedValue(a, sortField)
      const bValue = getNestedValue(b, sortField)

      // التعامل مع القيم الفارغة
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return order === 'asc' ? 1 : -1
      if (bValue == null) return order === 'asc' ? -1 : 1

      // ترتيب التواريخ
      if (sortField.includes('Date') || sortField.includes('At')) {
        const dateA = aValue.toDate ? aValue.toDate() : new Date(aValue)
        const dateB = bValue.toDate ? bValue.toDate() : new Date(bValue)
        return order === 'asc' ? dateA - dateB : dateB - dateA
      }

      // ترتيب الأرقام
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue
      }

      // ترتيب النصوص
      const stringA = aValue.toString().toLowerCase()
      const stringB = bValue.toString().toLowerCase()
      
      if (order === 'asc') {
        return stringA.localeCompare(stringB, 'ar')
      } else {
        return stringB.localeCompare(stringA, 'ar')
      }
    })
  }

  // النتائج المفلترة والمرتبة
  const filteredAndSortedResults = useMemo(() => {
    let results = [...data]
    
    // تطبيق البحث النصي
    results = performTextSearch(results, debouncedSearchTerm)
    
    // تطبيق الفلاتر
    results = applyFilters(results, filters)
    
    // ترتيب النتائج
    results = sortResults(results, sortBy, sortOrder)
    
    return results
  }, [data, debouncedSearchTerm, filters, dateRange, priceRange, sortBy, sortOrder])

  // تقسيم الصفحات
  const paginatedResults = useMemo(() => {
    if (!enablePagination) return filteredAndSortedResults
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    return filteredAndSortedResults.slice(startIndex, endIndex)
  }, [filteredAndSortedResults, currentPage, itemsPerPage, enablePagination])

  // دوال التحكم
  const handleSearch = (searchData) => {
    setSearchTerm(searchData.term || '')
    setFilters(searchData.filters || {})
    setDateRange(searchData.dateRange || { from: '', to: '' })
    setPriceRange(searchData.priceRange || { min: '', max: '' })
    setCurrentPage(1) // إعادة تعيين الصفحة عند البحث الجديد
  }

  const handleFilter = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleSort = (field, order) => {
    setSortBy(field)
    setSortOrder(order)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // حفظ البحث
  const saveSearch = (searchData) => {
    const newSearch = {
      ...searchData,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    
    const updatedSearches = [...savedSearches, newSearch]
    setSavedSearches(updatedSearches)
    localStorage.setItem('savedSearches', JSON.stringify(updatedSearches))
  }

  // تحميل بحث محفوظ
  const loadSearch = (search) => {
    setSearchTerm(search.term || '')
    setFilters(search.filters || {})
    setDateRange(search.dateRange || { from: '', to: '' })
    setPriceRange(search.priceRange || { min: '', max: '' })
    setCurrentPage(1)
  }

  // حذف بحث محفوظ
  const deleteSavedSearch = (searchId) => {
    const updatedSearches = savedSearches.filter(search => search.id !== searchId)
    setSavedSearches(updatedSearches)
    localStorage.setItem('savedSearches', JSON.stringify(updatedSearches))
  }

  // إعادة تعيين البحث
  const resetSearch = () => {
    setSearchTerm('')
    setFilters({})
    setDateRange({ from: '', to: '' })
    setPriceRange({ min: '', max: '' })
    setSortBy(defaultSort)
    setSortOrder(defaultOrder)
    setCurrentPage(1)
  }

  // تصدير النتائج
  const exportResults = (format = 'csv') => {
    const dataToExport = filteredAndSortedResults.map(item => {
      // تسطيح البيانات للتصدير
      const flattened = {}
      searchFields.forEach(field => {
        flattened[field] = getNestedValue(item, field) || ''
      })
      filterFields.forEach(field => {
        flattened[field] = getNestedValue(item, field) || ''
      })
      return flattened
    })

    if (format === 'csv') {
      exportToCSV(dataToExport)
    } else if (format === 'json') {
      exportToJSON(dataToExport)
    }
  }

  // تصدير إلى CSV
  const exportToCSV = (data) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `search-results-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // تصدير إلى JSON
  const exportToJSON = (data) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `search-results-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  // إحصائيات البحث
  const searchStats = useMemo(() => {
    return {
      totalItems: data.length,
      filteredItems: filteredAndSortedResults.length,
      currentPageItems: paginatedResults.length,
      totalPages: Math.ceil(filteredAndSortedResults.length / itemsPerPage),
      filteringPercentage: data.length > 0 ? ((filteredAndSortedResults.length / data.length) * 100).toFixed(1) : 0,
      hasFilters: Object.keys(filters).length > 0 || searchTerm || dateRange.from || dateRange.to || priceRange.min || priceRange.max
    }
  }, [data.length, filteredAndSortedResults.length, paginatedResults.length, itemsPerPage, filters, searchTerm, dateRange, priceRange])

  return {
    // البيانات
    results: paginatedResults,
    allFilteredResults: filteredAndSortedResults,
    totalCount: filteredAndSortedResults.length,
    
    // الحالة
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    dateRange,
    priceRange,
    currentPage,
    viewMode,
    savedSearches,
    searchStats,
    
    // الدوال
    handleSearch,
    handleFilter,
    handleSort,
    handlePageChange,
    setSearchTerm,
    setFilters,
    setViewMode,
    saveSearch,
    loadSearch,
    deleteSavedSearch,
    resetSearch,
    exportResults,
    
    // دوال مساعدة
    isLoading: false,
    hasFilters: searchStats.hasFilters
  }
}

