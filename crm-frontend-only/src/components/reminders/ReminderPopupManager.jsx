import React from 'react'
import { useReminderPopup } from '../../contexts/ReminderPopupContext'
import ReminderPopupModal from './ReminderPopupModal'

/**
 * مدير popup التذكيرات - يعرض popup عند استحقاق التذكيرات
 * يتم إضافته إلى App.jsx ليعمل في جميع أنحاء التطبيق
 */
export default function ReminderPopupManager() {
  const {
    activeReminder,
    isPopupOpen,
    reminderQueueLength,
    completeReminder,
    dismissReminder,
    closeReminderPopup
  } = useReminderPopup()

  // عرض معلومات debug في وضع التطوير فقط عند التغيير
  if (process.env.NODE_ENV === 'development' && isPopupOpen) {
    console.log('🔔 ReminderPopupManager - Popup opened:', {
      isPopupOpen,
      hasActiveReminder: !!activeReminder,
      reminderQueueLength,
      activeReminderNote: activeReminder?.note?.substring(0, 50) + '...'
    })
  }

  return (
    <ReminderPopupModal
      reminder={activeReminder}
      isOpen={isPopupOpen}
      onComplete={completeReminder}
      onDismiss={dismissReminder}
      onClose={closeReminderPopup}
    />
  )
}
