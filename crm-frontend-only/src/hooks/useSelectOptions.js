// Hook مشترك لجميع خيارات القوائم المنسدلة في التطبيق

export const useSelectOptions = () => {
  // خيارات أنواع الوحدات
  const unitTypeOptions = [
    { value: 'apartment', label: 'شقة', icon: '🏠' },
    { value: 'villa', label: 'فيلا', icon: '🏡' },
    { value: 'studio', label: 'استوديو', icon: '🏠' },
    { value: 'duplex', label: 'دوبلكس', icon: '🏢' },
    { value: 'penthouse', label: 'بنتهاوس', icon: '🏢' },
    { value: '', label: '─────────', disabled: true },
    { value: 'shop', label: 'محل تجاري', icon: '🏪' },
    { value: 'office', label: 'مكتب', icon: '🏢' },
    { value: 'clinic', label: 'عيادة', icon: '🏥' },
    { value: 'restaurant', label: 'مطعم', icon: '🍽️' },
    { value: 'cafe', label: 'كافيه', icon: '☕' },
    { value: '', label: '─────────', disabled: true },
    { value: 'warehouse', label: 'مستودع', icon: '📦' },
    { value: 'garage', label: 'جراج', icon: '🚗' },
    { value: 'other', label: 'أخرى', icon: '🔧' }
  ]

  // خيارات حالات الوحدات
  const unitStatusOptions = [
    { value: 'available', label: 'متاح', icon: '✅' },
    { value: 'reserved', label: 'محجوز', icon: '🔶' },
    { value: 'sold', label: 'مباع', icon: '💰' },
    { value: 'maintenance', label: 'صيانة', icon: '🔧' }
  ]

  // خيارات أنواع المشاريع
  const projectTypeOptions = [
    { value: 'residential', label: 'سكني', icon: '🏠' },
    { value: 'commercial', label: 'تجاري', icon: '🏢' },
    { value: 'mixed', label: 'مختلط', icon: '🏗️' },
    { value: 'industrial', label: 'صناعي', icon: '🏭' }
  ]

  // خيارات حالات المشاريع
  const projectStatusOptions = [
    { value: 'planning', label: 'التخطيط', icon: '📋' },
    { value: 'construction', label: 'قيد الإنشاء', icon: '🚧' },
    { value: 'completed', label: 'مكتمل', icon: '✅' },
    { value: 'on_hold', label: 'متوقف', icon: '⏸️' },
    { value: 'cancelled', label: 'ملغي', icon: '❌' }
  ]

  // خيارات حالات العملاء
  const clientStatusOptions = [
    { value: 'new', label: 'جديد', icon: '🆕' },
    { value: 'contacted', label: 'تم التواصل', icon: '📞' },
    { value: 'interested', label: 'مهتم', icon: '👀' },
    { value: 'negotiating', label: 'تحت التفاوض', icon: '💬' },
    { value: 'closed', label: 'تم الإغلاق', icon: '✅' },
    { value: 'lost', label: 'خسارة', icon: '❌' }
  ]

  // خيارات مصادر العملاء
  const clientSourceOptions = [
    { value: 'website', label: 'الموقع الإلكتروني', icon: '🌐' },
    { value: 'social_media', label: 'وسائل التواصل', icon: '📱' },
    { value: 'referral', label: 'إحالة', icon: '👥' },
    { value: 'advertisement', label: 'إعلان', icon: '📢' },
    { value: 'cold_call', label: 'اتصال مباشر', icon: '📞' },
    { value: 'walk_in', label: 'زيارة مباشرة', icon: '🚶' },
    { value: 'exhibition', label: 'معرض', icon: '🏛️' },
    { value: 'other', label: 'أخرى', icon: '🔧' }
  ]

  // خيارات أولويات العملاء
  const clientPriorityOptions = [
    { value: 'high', label: 'عالية', icon: '🔴' },
    { value: 'medium', label: 'متوسطة', icon: '🟡' },
    { value: 'low', label: 'منخفضة', icon: '🟢' }
  ]

  // دوال مساعدة للفلترة
  const getFilterOptions = (baseOptions, includeAll = true) => {
    const allOption = { value: 'all', label: 'جميع الخيارات', icon: '📋' }
    return includeAll 
      ? [allOption, ...baseOptions.filter(option => !option.disabled)]
      : baseOptions.filter(option => !option.disabled)
  }

  return {
    // خيارات أساسية
    unitTypeOptions,
    unitStatusOptions,
    projectTypeOptions,
    projectStatusOptions,
    clientStatusOptions,
    clientSourceOptions,
    clientPriorityOptions,
    
    // خيارات للفلترة (مع خيار "جميع الخيارات")
    unitTypeFilterOptions: getFilterOptions(unitTypeOptions),
    unitStatusFilterOptions: getFilterOptions(unitStatusOptions),
    projectTypeFilterOptions: getFilterOptions(projectTypeOptions),
    projectStatusFilterOptions: getFilterOptions(projectStatusOptions),
    clientStatusFilterOptions: getFilterOptions(clientStatusOptions),
    clientSourceFilterOptions: getFilterOptions(clientSourceOptions),
    clientPriorityFilterOptions: getFilterOptions(clientPriorityOptions),
    
    // دالة مساعدة
    getFilterOptions
  }
}

export default useSelectOptions



