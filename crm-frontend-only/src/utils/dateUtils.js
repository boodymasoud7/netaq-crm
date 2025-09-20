// Date utilities for Arabic/Hijri date formatting and conversion

/**
 * Format date to Arabic locale with Gregorian calendar (force Gregorian)
 */
export const formatDateToArabic = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // Force Gregorian calendar by using en-US locale with Arabic numerals
    const gregorianDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    // Translate to Arabic
    const dayNames = {
      'Sunday': 'الأحد',
      'Monday': 'الإثنين', 
      'Tuesday': 'الثلاثاء',
      'Wednesday': 'الأربعاء',
      'Thursday': 'الخميس',
      'Friday': 'الجمعة',
      'Saturday': 'السبت'
    }
    
    const monthNames = {
      'January': 'يناير',
      'February': 'فبراير',
      'March': 'مارس',
      'April': 'أبريل',
      'May': 'مايو',
      'June': 'يونيو',
      'July': 'يوليو',
      'August': 'أغسطس',
      'September': 'سبتمبر',
      'October': 'أكتوبر',
      'November': 'نوفمبر',
      'December': 'ديسمبر'
    }
    
    let arabicDate = gregorianDate
    Object.entries(dayNames).forEach(([en, ar]) => {
      arabicDate = arabicDate.replace(en, ar)
    })
    Object.entries(monthNames).forEach(([en, ar]) => {
      arabicDate = arabicDate.replace(en, ar)
    })
    
    return arabicDate
  } catch (error) {
    console.error('Error formatting date to Arabic:', error)
    return date.toString()
  }
}

/**
 * Format date and time to Arabic locale with Gregorian calendar
 */
export const formatDateTimeToArabic = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // Get Gregorian date parts
    const day = dateObj.getDate()
    const month = dateObj.getMonth() + 1
    const year = dateObj.getFullYear()
    const hours = dateObj.getHours()
    const minutes = dateObj.getMinutes()
    
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]
    
    const period = hours >= 12 ? 'م' : 'ص'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    
    return `${day} ${monthNames[month - 1]} ${year} - ${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  } catch (error) {
    console.error('Error formatting datetime to Arabic:', error)
    return date.toString()
  }
}

/**
 * Format time only to Arabic locale
 */
export const formatTimeToArabic = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    return dateObj.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error formatting time to Arabic:', error)
    return date.toString()
  }
}

/**
 * Convert date to HTML input format (YYYY-MM-DD)
 */
export const dateToInputFormat = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toISOString().split('T')[0]
  } catch (error) {
    console.error('Error converting date to input format:', error)
    return ''
  }
}

/**
 * Convert time to HTML input format (HH:MM)
 */
export const timeToInputFormat = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toTimeString().slice(0, 5)
  } catch (error) {
    console.error('Error converting time to input format:', error)
    return ''
  }
}

/**
 * Get relative time in Arabic
 */
export const getRelativeTimeInArabic = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const diffMs = dateObj.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 0) {
      const pastMinutes = Math.abs(diffMinutes)
      if (pastMinutes < 60) {
        return `منذ ${pastMinutes} دقيقة`
      } else if (pastMinutes < 1440) {
        const pastHours = Math.floor(pastMinutes / 60)
        return `منذ ${pastHours} ساعة`
      } else {
        const pastDays = Math.floor(pastMinutes / 1440)
        return `منذ ${pastDays} يوم`
      }
    } else {
      if (diffMinutes < 60) {
        return `خلال ${diffMinutes} دقيقة`
      } else if (diffMinutes < 1440) {
        return `خلال ${diffHours} ساعة`
      } else {
        return `خلال ${diffDays} يوم`
      }
    }
  } catch (error) {
    console.error('Error getting relative time:', error)
    return ''
  }
}

/**
 * Check if date is overdue
 */
export const isOverdue = (date) => {
  if (!date) return false
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.getTime() < new Date().getTime()
  } catch (error) {
    console.error('Error checking if overdue:', error)
    return false
  }
}

/**
 * Get minutes until due (negative if overdue)
 */
export const getMinutesUntilDue = (date) => {
  if (!date) return 0
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    const now = new Date()
    return Math.floor((dateObj.getTime() - now.getTime()) / (1000 * 60))
  } catch (error) {
    console.error('Error getting minutes until due:', error)
    return 0
  }
}

/**
 * Format Firebase Timestamp to Arabic date
 */
export const formatFirebaseTimestamp = (timestamp) => {
  if (!timestamp) return ''
  
  try {
    let date
    if (timestamp.seconds) {
      // Firestore Timestamp
      date = new Date(timestamp.seconds * 1000)
    } else if (timestamp.toDate) {
      // Firestore Timestamp object
      date = timestamp.toDate()
    } else {
      date = new Date(timestamp)
    }
    
    return formatDateTimeToArabic(date)
  } catch (error) {
    console.error('Error formatting Firebase timestamp:', error)
    return 'غير مح��د'
  }
}

/**
 * Get current date in Arabic format
 */
export const getCurrentDateInArabic = () => {
  return formatDateToArabic(new Date())
}

/**
 * Get current time in Arabic format
 */
export const getCurrentTimeInArabic = () => {
  return formatTimeToArabic(new Date())
}