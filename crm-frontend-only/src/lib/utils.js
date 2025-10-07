import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// تنسيق التواريخ للعربية
export function formatDateArabic(date) {
  if (!date) return 'غير محدد'
  
  try {
    // التعامل مع Firebase Timestamp
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    
    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) {
      return 'تاريخ غير صحيح'
    }
    
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Cairo'
    }
    
    // تنسيق ميلادي مع الوقت بتنسيق DD/MM/YYYY HH:MM AM/PM
    return new Intl.DateTimeFormat('ar-EG', options).format(dateObj)
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error)
    return 'تاريخ غير صحيح'
  }
}

// تنسيق الأرقام للعربية
export function formatNumberArabic(number) {
  if (!number) return '0'
  
  return new Intl.NumberFormat('ar-SA').format(number)
}

// تنسيق حجم الملفات
export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// تنسيق العملة للجنيه المصري
export function formatCurrencyArabic(amount) {
  if (!amount) return '0 جنيه'
  
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// تحويل النص الإنجليزي للأرقام العربية
export function toArabicNumbers(str) {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return str.toString().replace(/[0-9]/g, (w) => arabicNumbers[+w])
}

// تحويل الأرقام العربية للإنجليزية
export function toEnglishNumbers(str) {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return str.toString().replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w))
}

// تحديد نوع الجهاز
export function isMobile() {
  return window.innerWidth < 768
}

// تنظيف النصوص
export function sanitizeText(text) {
  if (!text) return ''
  return text.trim().replace(/\s+/g, ' ')
}

// إنشاء معرف فريد
export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// تحويل الملف إلى Base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

// تحديد لون الحالة
export function getStatusColor(status) {
  const colors = {
    'نشط': 'bg-green-100 text-green-800',
    'غير نشط': 'bg-red-100 text-red-800',
    'محتمل': 'bg-yellow-100 text-yellow-800',
    'محول': 'bg-blue-100 text-blue-800',
    'معلق': 'bg-orange-100 text-orange-800',
    'مكتمل': 'bg-green-100 text-green-800',
    'ملغي': 'bg-red-100 text-red-800'
  }
  
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// تحديد أيقونة الحالة
export function getStatusIcon(status) {
  const icons = {
    'نشط': '✅',
    'غير نشط': '❌',
    'محتمل': '⏳',
    'محول': '🎯',
    'معلق': '⏸️',
    'مكتمل': '✅',
    'ملغي': '❌'
  }
  
  return icons[status] || '📋'
}

// تنسيق العملة (alias for formatCurrencyArabic)
export function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return '0 جنيه'
  
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// تنسيق رقم الهاتف المصري للعرض بالشكل المحلي العادي
export function formatPhoneNumber(phone) {
  if (!phone) return ''
  
  // إزالة كل شيء عدا الأرقام والرمز +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // التعامل مع الأرقام التي تبدأ بـ +20 (التنسيق الدولي)
  if (cleaned.startsWith('+20')) {
    const numberPart = cleaned.substring(3) // إزالة +20
    
    if (numberPart.length >= 10) {
      // تحويل إلى الشكل المحلي: +201234567890 -> 01234567890
      return '0' + numberPart
    }
  }
  
  // التعامل مع الأرقام التي تبدأ بـ 20 (بدون +)
  if (cleaned.startsWith('20') && cleaned.length >= 12) {
    const numberPart = cleaned.substring(2)
    
    if (numberPart.length >= 10) {
      // تحويل إلى الشكل المحلي: 201234567890 -> 01234567890
      return '0' + numberPart
    }
  }
  
  // إذا كان الرقم يبدأ بـ 01 بالفعل (الشكل المحلي)
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return cleaned // إرجاع الرقم كما هو
  }
  
  // إذا كان الرقم مجرد 10 أرقام (بدون 0 في البداية)
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    return '0' + cleaned // إضافة الصفر في البداية
  }
  
  // إذا كان الرقم 9 أرقام فقط
  if (cleaned.length === 9) {
    return '01' + cleaned // إضافة 01 في البداية
  }
  
  // إرجاع الرقم كما هو إذا لم يطابق أي نمط
  return phone
}

// تحويل النص للأحرف الأولى كبيرة
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// اختصار النص
export function truncateText(text, length = 100) {
  if (!text) return ''
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// تحقق من صحة البريد الإلكتروني
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// تحقق من صحة رقم الهاتف المصري
export function validateEgyptianPhone(phone) {
  const cleaned = phone.replace(/\D/g, '')
  // رقم مصري محلي (11 رقم يبدأ بـ 01)
  return cleaned.length === 11 && cleaned.startsWith('01')
}

// alias للتوافق
export const validateSaudiPhone = validateEgyptianPhone

// تنسيق التاريخ للـ HTML date input
export function formatDateForInput(date) {
  if (!date) return ''
  
  try {
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    if (isNaN(dateObj.getTime())) return ''
    
    return dateObj.toISOString().split('T')[0]
  } catch (error) {
    return ''
  }
}

// تنسيق الوقت للـ HTML time input
export function formatTimeForInput(time) {
  if (!time) return ''
  
  try {
    if (typeof time === 'string' && time.includes(':')) {
      return time
    }
    
    const timeObj = time.toDate ? time.toDate() : new Date(time)
    if (isNaN(timeObj.getTime())) return ''
    
    return timeObj.toLocaleTimeString('en-GB', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return ''
  }
}

// حساب الوقت المتبقي
export function getTimeRemaining(targetDate) {
  if (!targetDate) return null
  
  try {
    const dateObj = targetDate.toDate ? targetDate.toDate() : new Date(targetDate)
    const now = new Date()
    const diff = dateObj.getTime() - now.getTime()
    
    // إذا كان التاريخ في الماضي
    if (diff < 0) {
      const pastDiff = Math.abs(diff)
      const days = Math.floor(pastDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((pastDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((pastDiff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) return `متأخر ${days} يوم`
      if (hours > 0) return `متأخر ${hours} ساعة`
      if (minutes > 0) return `متأخر ${minutes} دقيقة`
      return 'متأخر'
    }
    
    // إذا كان التاريخ في المستقبل
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `خلال ${days} يوم`
    if (hours > 0) return `خلال ${hours} ساعة`
    if (minutes > 0) return `خلال ${minutes} دقيقة`
    return 'الآن'
    
  } catch (error) {
    console.error('خطأ في حساب الوقت المتبقي:', error)
    return null
  }
}
