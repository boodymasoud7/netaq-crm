import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

const CustomSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "اختر...", 
  searchable = false,
  disabled = false,
  className = "",
  size = "default",
  error = false,
  icon = null
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const selectRef = useRef(null)
  const searchInputRef = useRef(null)

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // التركيز على البحث عند فتح القائمة
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  // فلترة الخيارات بناءً على البحث
  const filteredOptions = options.filter(option =>
    option.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // العثور على الخيار المحدد
  const selectedOption = options.find(option => option.value === value)

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setSearchTerm('')
    }
  }

  const handleSelect = (option) => {
    if (!option.disabled) {
      onChange(option.value)
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  const sizeClasses = {
    sm: "h-8 text-sm px-2",
    default: "h-10 px-3",
    lg: "h-12 px-4 text-lg"
  }

  return (
    <div className={cn("relative", className)} ref={selectRef}>
      {/* زر التحديد */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between bg-white border rounded-lg transition-all duration-200",
          "text-right font-medium text-gray-900",
          sizeClasses[size],
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-300 hover:border-gray-400 focus:border-green-500 focus:ring-green-500/20",
          disabled
            ? "bg-gray-50 text-gray-400 cursor-not-allowed"
            : "hover:bg-gray-50 focus:bg-white cursor-pointer",
          isOpen && !disabled && "border-green-500 ring-2 ring-green-500/20 shadow-sm"
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && (
            <span className="text-gray-500 flex-shrink-0">
              {icon}
            </span>
          )}
          <span className={cn(
            "truncate",
            selectedOption ? "text-gray-900" : "text-gray-500"
          )}>
            {selectedOption ? (
              <div className="flex items-center gap-2">
                {selectedOption.icon && (
                  <span className="text-sm">{selectedOption.icon}</span>
                )}
                <span>{selectedOption.label}</span>
              </div>
            ) : (
              placeholder
            )}
          </span>
        </div>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180",
            disabled && "text-gray-300"
          )} 
        />
      </button>

      {/* القائمة المنسدلة */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* مربع البحث */}
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث..."
                  className="w-full pr-10 pl-3 py-2 text-sm border border-gray-200 rounded-md focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none text-right"
                />
              </div>
            </div>
          )}

          {/* قائمة الخيارات */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'لا توجد نتائج مطابقة' : 'لا توجد خيارات متاحة'}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value || index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={cn(
                    "w-full px-4 py-3 text-right text-sm transition-colors duration-150",
                    "flex items-center justify-between group",
                    option.disabled
                      ? "text-gray-400 cursor-not-allowed bg-gray-50"
                      : "text-gray-900 hover:bg-green-50 hover:text-green-700 cursor-pointer",
                    value === option.value && !option.disabled && "bg-green-50 text-green-700"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {option.icon && (
                      <span className="text-sm flex-shrink-0">{option.icon}</span>
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                  
                  {value === option.value && !option.disabled && (
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomSelect