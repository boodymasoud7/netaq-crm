/**
 * أدوات التعامل مع التوقيت - مضبوط على توقيت مصر
 */

// توقيت مصر الثابت
export const EGYPT_TIMEZONE = 'Africa/Cairo'

/**
 * الحصول على الوقت الحالي بتوقيت مصر
 */
export const getCurrentEgyptTime = () => {
  return new Date().toLocaleString('en-CA', {
    timeZone: EGYPT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(' ', 'T')
}

/**
 * تحويل تاريخ إلى توقيت مصر لعرضه في datetime-local input
 */
export const toEgyptDateTimeLocal = (date) => {
  if (!date) return ''
  
  const egyptDate = new Date(date)
  
  // التأكد من أن التاريخ صحيح
  if (isNaN(egyptDate.getTime())) return ''
  
  // تحويل إلى توقيت مصر
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: EGYPT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',  
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(egyptDate)
  const dateStr = parts.find(p => p.type === 'year')?.value + '-' +
                  parts.find(p => p.type === 'month')?.value + '-' +
                  parts.find(p => p.type === 'day')?.value
  const timeStr = parts.find(p => p.type === 'hour')?.value + ':' +
                  parts.find(p => p.type === 'minute')?.value
  
  return `${dateStr}T${timeStr}`
}

/**
 * تحويل قيمة datetime-local إلى تاريخ صحيح بتوقيت مصر
 */
export const fromEgyptDateTimeLocal = (dateTimeLocalValue) => {
  if (!dateTimeLocalValue) return null
  
  // إنشاء تاريخ محلي ثم تحويله لتوقيت مصر
  const localDate = new Date(dateTimeLocalValue)
  
  // التأكد من صحة التاريخ
  if (isNaN(localDate.getTime())) return null
  
  return localDate
}

/**
 * الحصول على وقت افتراضي (الآن + دقائق إضافية) بتوقيت مصر
 */
export const getDefaultReminderTime = (minutesFromNow = 5) => {
  const now = new Date()
  
  // إضافة الدقائق المطلوبة
  const defaultTime = new Date(now.getTime() + (minutesFromNow * 60 * 1000))
  
  // تحويل لتوقيت مصر في صيغة datetime-local
  return toEgyptDateTimeLocal(defaultTime)
}

/**
 * تنسيق التاريخ للعرض بالعربية وتوقيت مصر
 */
export const formatEgyptDateTime = (date) => {
  if (!date) return 'غير محدد'
  
  try {
    return new Date(date).toLocaleString('ar-EG', {
      timeZone: EGYPT_TIMEZONE,
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error)
    return 'تاريخ غير صحيح'
  }
}

/**
 * التحقق من أن التوقيت في المستقبل بتوقيت مصر
 */
export const isInFuture = (date) => {
  if (!date) return false
  
  const targetDate = new Date(date)
  const nowInEgypt = new Date()
  
  return targetDate > nowInEgypt
}

/**
 * حساب الفرق بالدقائق بين تاريخين بتوقيت مصر
 */
export const getMinutesDifference = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0
  
  return Math.floor((d2 - d1) / (1000 * 60))
}

/**
 * الحصول على الوقت الحالي بتوقيت مصر (كـ Date object)
 */
export const getNowInEgypt = () => {
  return new Date()
}

/**
 * تحويل أي تاريخ إلى نص مقروء بتوقيت مصر
 */
export const toEgyptTimeString = (date) => {
  if (!date) return ''
  
  return new Date(date).toLocaleTimeString('ar-EG', {
    timeZone: EGYPT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}










