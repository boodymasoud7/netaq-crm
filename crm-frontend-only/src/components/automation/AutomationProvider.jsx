import React, { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { followUpAutomation } from '../../services/followUpAutomationService'

/**
 * مزود نظام الأتمتة - يحمل ويفعل النظام تلقائياً للمديرين
 */
const AutomationProvider = ({ children }) => {
  const { currentUser, userProfile } = useAuth()
  const { isAdmin, isSalesManager } = usePermissions()

  useEffect(() => {
    // التأكد من تحميل معلومات المستخدم
    if (currentUser && userProfile) {
      console.log('🤖 AutomationProvider: User loaded, role:', userProfile.role)
      
      // حفظ معلومات المستخدم في localStorage للـ automation service
      try {
        localStorage.setItem('userRole', userProfile.role || 'user')
        localStorage.setItem('currentUser', JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          role: userProfile.role,
          displayName: userProfile.displayName || userProfile.name
        }))
        
        console.log('✅ User info saved to localStorage for automation')
      } catch (error) {
        console.warn('⚠️ Failed to save user info:', error)
      }
      
      // إذا كان مدير، التأكد من تفعيل النظام
      if (isAdmin() || isSalesManager()) {
        console.log('👑 Manager detected, ensuring automation is available')
        
        // تحفيز النظام للتحقق من التفعيل
        setTimeout(() => {
          if (!followUpAutomation.isEnabled) {
            console.log('🚀 Manually triggering automation check for manager')
            followUpAutomation.attemptAutoStart()
          }
        }, 2000)
      }
    }
  }, [currentUser, userProfile, isAdmin, isSalesManager])

  // هذا المكون لا يعرض شيئاً، فقط يحمل النظام في الخلفية
  return <>{children}</>
}

export default AutomationProvider
