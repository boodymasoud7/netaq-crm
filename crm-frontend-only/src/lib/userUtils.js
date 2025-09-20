/**
 * دوال مساعدة للتعامل مع بيانات المستخدمين
 */

// خريطة المستخدمين المعروفين في النظام
const KNOWN_USERS = {
  46: 'المدير الرئيسي',
  47: 'omayma',
  48: 'esraa', 
  49: 'maged',
  '46': 'المدير الرئيسي',
  '47': 'omayma',
  '48': 'esraa',
  '49': 'maged'
}

/**
 * الحصول على اسم المستخدم من assignedTo
 * @param {string|number} assignedTo - معرف أو اسم المستخدم
 * @returns {string} اسم المستخدم المعروض
 */
export const getDisplayUserName = (assignedTo) => {
  if (!assignedTo) return 'غير محدد'
  
  // إذا كان رقم أو string رقم
  if (typeof assignedTo === 'number' || !isNaN(assignedTo)) {
    return KNOWN_USERS[assignedTo] || `مستخدم #${assignedTo}`
  }
  
  // إذا كان اسم مباشرة، ارجعه كما هو
  return assignedTo
}

/**
 * الحصول على اسم الموظف المسؤول عن العميل في المتابعة
 * @param {Object} followUp - بيانات المتابعة
 * @returns {string} اسم الموظف المسؤول
 */
export const getResponsibleEmployeeName = (followUp) => {
  // أولوية للموظف المسؤول عن العميل المحتمل
  if (followUp.lead?.assignedTo) {
    return getDisplayUserName(followUp.lead.assignedTo)
  }
  
  // ثانياً: الموظف المسؤول عن العميل
  if (followUp.client?.assignedTo) {
    return getDisplayUserName(followUp.client.assignedTo)
  }
  
  // أخيراً: المخصص له المتابعة (كخيار احتياطي)
  if (followUp.assignedUser?.name) {
    return followUp.assignedUser.name
  }
  
  return 'غير محدد'
}

/**
 * الحصول على بيانات الموظف المسؤول عن العميل (مع ID)
 * @param {Object} followUp - بيانات المتابعة  
 * @returns {Object|null} بيانات الموظف {id, name}
 */
export const getResponsibleEmployee = (followUp) => {
  // أولوية للموظف المسؤول عن العميل المحتمل
  if (followUp.lead?.assignedTo) {
    const assignedTo = followUp.lead.assignedTo
    return {
      id: typeof assignedTo === 'number' ? assignedTo : (isNaN(assignedTo) ? null : parseInt(assignedTo)),
      name: getDisplayUserName(assignedTo)
    }
  }
  
  // ثانياً: الموظف المسؤول عن العميل
  if (followUp.client?.assignedTo) {
    const assignedTo = followUp.client.assignedTo
    return {
      id: typeof assignedTo === 'number' ? assignedTo : (isNaN(assignedTo) ? null : parseInt(assignedTo)),
      name: getDisplayUserName(assignedTo)
    }
  }
  
  // أخيراً: المخصص له المتابعة (كخيار احتياطي)
  return followUp.assignedUser || null
}







