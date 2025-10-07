import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Hook لإرسال الإشعارات عبر API للباك إند
export function useSSENotificationSender() {
  const { currentUser, userProfile } = useAuth()

  // إرسال إشعار تحويل عميل محتمل
  const sendLeadConvertedNotification = useCallback(async (leadName) => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'leadConverted',
      id: `lead-converted-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'تحويل عميل محتمل - إنجاز موظف',
      message: `قام ${userProfile.displayName || userProfile.name || userProfile.email} بتحويل العميل المحتمل "${leadName}" إلى عميل فعلي`,
      icon: '🎯✨',
      priority: 'high',
      employeeName: userProfile.displayName || userProfile.name || userProfile.email,
      employeeEmail: userProfile.email || currentUser.email,
      leadName: leadName,
      action: 'lead_converted'
    }

    console.log('📤 Sending lead converted notification:', notification)

    try {
      // إرسال للباك إند عبر fetch
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'leadConverted',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ Lead converted notification sent successfully')
      } else {
        console.error('❌ Failed to send notification:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار عميل محتمل جديد
  const sendNewLeadNotification = useCallback(async (leadName) => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'newLead',
      id: `new-lead-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'عميل محتمل جديد',
      message: `تم إضافة عميل محتمل جديد "${leadName}" بواسطة ${userProfile.displayName || userProfile.name || userProfile.email}`,
      icon: '🎯',
      priority: 'medium',
      employeeName: userProfile.displayName || userProfile.name || userProfile.email,
      employeeEmail: userProfile.email || currentUser.email,
      leadName: leadName,
      action: 'lead_added'
    }

    console.log('📤 Sending new lead notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'newLead',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ New lead notification sent successfully')
      } else {
        console.error('❌ Failed to send notification:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار عميل فعلي جديد
  const sendNewClientNotification = useCallback(async (clientName) => {
    if (!currentUser) {
      console.warn('⚠️ No current user for new client notification');
      return;
    }
    
    const profile = userProfile || currentUser;

    const notification = {
      type: 'newClient',
      id: `new-client-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'عميل فعلي جديد',
      message: `تم إضافة عميل فعلي جديد "${clientName}" بواسطة ${profile.displayName || profile.name || profile.email}`,
      icon: '👤✨',
      priority: 'medium',
      employeeName: profile.displayName || profile.name || profile.email,
      employeeEmail: profile.email || currentUser.email,
      clientName: clientName,
      action: 'client_added'
    }

    console.log('📤 Sending new client notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'newClient',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ New client notification sent successfully')
      } else {
        console.error('❌ Failed to send notification:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار إضافة تفاعل
  const sendInteractionAddedNotification = useCallback(async (clientName, clientType = 'عميل', interactionType = 'تفاعل') => {
    if (!currentUser) {
      console.warn('⚠️ No current user for interaction added notification');
      return;
    }
    
    const profile = userProfile || currentUser;

    const notification = {
      type: 'interactionAdded',
      id: `interaction-added-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'تفاعل جديد - نشاط موظف',
      message: `قام ${profile.displayName || profile.name || profile.email} بإضافة ${interactionType} لـ${clientType} "${clientName}"`,
      icon: '💬✨',
      priority: 'medium',
      employeeName: profile.displayName || profile.name || profile.email,
      employeeEmail: profile.email || currentUser.email,
      clientName: clientName,
      clientType: clientType,
      interactionType: interactionType,
      action: 'interaction_added'
    }

    console.log('📤 Sending interaction added notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'interactionAdded',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ Interaction added notification sent successfully')
      } else {
        console.error('❌ Failed to send notification:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار إضافة ملاحظة
  const sendNoteAddedNotification = useCallback(async (clientName, clientType = 'عميل', noteContent = '') => {
    if (!currentUser) {
      console.warn('⚠️ No current user for note added notification');
      return;
    }
    
    // Use currentUser as fallback if userProfile is not available
    const profile = userProfile || currentUser;

    const notification = {
      type: 'noteAdded',
      id: `note-added-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'ملاحظة جديدة - نشاط موظف',
      message: `قام ${profile.displayName || profile.name || profile.email} بإضافة ملاحظة لـ${clientType} "${clientName}"${noteContent ? `: "${noteContent.substring(0, 50)}${noteContent.length > 50 ? '...' : ''}"` : ''}`,
      icon: '📝✨',
      priority: 'medium',
      employeeName: profile.displayName || profile.name || profile.email,
      employeeEmail: profile.email || currentUser.email,
      clientName: clientName,
      clientType: clientType,
      noteContent: noteContent,
      action: 'note_added'
    }

    console.log('📤 Sending note added notification:', notification)
    console.log('🔍 Profile data:', { 
      userProfile: !!userProfile, 
      currentUser: !!currentUser, 
      profileName: profile?.name,
      profileEmail: profile?.email 
    });

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'noteAdded',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ Note added notification sent successfully')
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send notification:', response.status, response.statusText);
        console.error('❌ Response body:', errorText);
      }
    } catch (error) {
      console.error('❌ Error sending note added notification:', error)
      console.error('❌ Error details:', error.message)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار رد المدير على ملاحظة
  const sendNoteReplyNotification = useCallback(async (employeeEmail, clientName, clientType = 'عميل', replyContent = '') => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'noteReply',
      id: `note-reply-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'رد على ملاحظتك',
      message: `رد ${userProfile.displayName || userProfile.name || userProfile.email} على ملاحظتك لـ${clientType} "${clientName}"${replyContent ? `: "${replyContent.substring(0, 50)}${replyContent.length > 50 ? '...' : ''}"` : ''}`,
      icon: '💬👨‍💼',
      priority: 'high',
      managerName: userProfile.displayName || userProfile.name || userProfile.email,
      managerEmail: userProfile.email || currentUser.email,
      targetEmployeeEmail: employeeEmail,
      clientName: clientName,
      clientType: clientType,
      replyContent: replyContent,
      action: 'note_reply'
    }

    console.log('📤 Sending note reply notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'noteReply',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ Note reply notification sent successfully')
      } else {
        console.error('❌ Failed to send notification:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار تكليف مهمة جديدة
  const sendTaskAssignedNotification = useCallback(async (taskData) => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'taskAssigned',
      id: `task-assigned-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'مهمة جديدة مكلف بها',
      message: `تم تكليفك بمهمة جديدة: "${taskData.title}"`,
      icon: '📋✨',
      priority: taskData.priority || 'medium',
      assignerName: userProfile.displayName || userProfile.name || userProfile.email,
      assignerEmail: userProfile.email || currentUser.email,
      taskTitle: taskData.title,
      taskId: taskData.id,
      assignedToEmail: taskData.assignedToEmail,
      assignedToName: taskData.assignedTo,
      dueDate: taskData.dueDate,
      action: 'task_assigned'
    }

    console.log('📤 Sending task assigned notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'taskAssigned',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ Task assigned notification sent successfully')
      } else {
        console.error('❌ Failed to send task assigned notification:', response.status)
      }
    } catch (error) {
      console.error('❌ Error sending task assigned notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار إجراء موظف في المهمة
  const sendTaskActionNotification = useCallback(async (actionData) => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'taskAction',
      id: `task-action-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'إجراء جديد في المهمة',
      message: `قام ${userProfile.displayName || userProfile.name} بـ ${actionData.action} في المهمة "${actionData.taskTitle}"`,
      icon: '⚡📋',
      priority: 'medium',
      employeeName: userProfile.displayName || userProfile.name || userProfile.email,
      employeeEmail: userProfile.email || currentUser.email,
      taskTitle: actionData.taskTitle,
      taskId: actionData.taskId,
      action: actionData.action,
      actionDetails: actionData.details || '',
      taskAction: 'employee_action'
    }

    console.log('📤 Sending task action notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'taskAction',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ Task action notification sent successfully')
      } else {
        console.error('❌ Failed to send task action notification:', response.status)
      }
    } catch (error) {
      console.error('❌ Error sending task action notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار إضافة ملاحظة للمهمة
  const sendTaskNoteAddedNotification = useCallback(async (noteData) => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'taskNoteAdded',
      id: `task-note-added-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'ملاحظة جديدة في المهمة',
      message: `أضاف ${userProfile.displayName || userProfile.name} ملاحظة جديدة في المهمة "${noteData.taskTitle}"`,
      icon: '📝📋',
      priority: noteData.priority || 'medium',
      employeeName: userProfile.displayName || userProfile.name || userProfile.email,
      employeeEmail: userProfile.email || currentUser.email,
      taskTitle: noteData.taskTitle,
      taskId: noteData.taskId,
      noteTitle: noteData.title,
      noteType: noteData.type,
      action: 'task_note_added'
    }

    console.log('📤 Sending task note added notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'taskNoteAdded',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ Task note added notification sent successfully')
      } else {
        console.error('❌ Failed to send task note added notification:', response.status)
      }
    } catch (error) {
      console.error('❌ Error sending task note added notification:', error)
    }
  }, [currentUser, userProfile])

  // إشعار رد المدير على ملاحظة مهمة
  const sendTaskNoteReplyNotification = useCallback(async (noteData) => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'taskNoteReply',
      id: `task-note-reply-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'رد المدير على ملاحظتك',
      message: `رد ${userProfile.displayName || userProfile.name || userProfile.email} على ملاحظتك في المهمة "${noteData.taskTitle}"`,
      icon: '💬👨‍💼',
      priority: 'high',
      managerName: userProfile.displayName || userProfile.name || userProfile.email,
      managerEmail: userProfile.email || currentUser.email,
      employeeName: noteData.originalAuthor,
      taskTitle: noteData.taskTitle,
      taskId: noteData.taskId,
      replyContent: noteData.replyContent,
      action: 'task_note_reply'
    }

    console.log('📤 Sending task note reply notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'taskNoteReply',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ Task note reply notification sent successfully')
      } else {
        console.error('❌ Failed to send task note reply notification:', response.status)
      }
    } catch (error) {
      console.error('❌ Error sending task note reply notification:', error)
      throw error
    }
  }, [currentUser, userProfile])

  // إرسال إشعار مشروع جديد
  const sendNewProjectNotification = useCallback(async (projectName, projectType = 'مشروع') => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'newProject',
      id: `project-added-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: '🏗️ مشروع جديد تمت إضافته',
      message: `تم إضافة مشروع جديد "${projectName}" بواسطة ${userProfile.displayName || userProfile.name || userProfile.email}`,
      icon: '🏗️✨',
      priority: 'high',
      employeeName: userProfile.displayName || userProfile.name || userProfile.email,
      employeeEmail: userProfile.email || currentUser.email,
      projectName: projectName,
      projectType: projectType,
      action: 'project_added'
    }

    console.log('📤 Sending new project notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'newProject',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ New project notification sent successfully')
      } else {
        console.error('❌ Failed to send notification:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار بيعة جديدة
  const sendNewSaleNotification = useCallback(async (clientName, saleAmount, projectName = '') => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'newSale',
      id: `sale-added-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'بيعة جديدة - إنجاز مبيعات',
      message: `قام ${userProfile.displayName || userProfile.name || userProfile.email} بإضافة بيعة جديدة للعميل "${clientName}" بقيمة ${saleAmount.toLocaleString()} ج.م${projectName ? ` في مشروع "${projectName}"` : ''}`,
      icon: '💰✨',
      priority: 'high',
      employeeName: userProfile.displayName || userProfile.name || userProfile.email,
      employeeEmail: userProfile.email || currentUser.email,
      clientName: clientName,
      saleAmount: saleAmount,
      projectName: projectName,
      action: 'sale_added'
    }

    console.log('📤 Sending new sale notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'newSale',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ New sale notification sent successfully')
      } else {
        console.error('❌ Failed to send notification:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار وحدة جديدة
  const sendNewUnitNotification = useCallback(async (unitNumber, projectName, unitType = 'وحدة') => {
    if (!currentUser || !userProfile) return

    const notification = {
      type: 'newUnit',
      id: `unit-added-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: '🏠 وحدة جديدة تمت إضافتها',
      message: `تم إضافة ${unitType} رقم "${unitNumber}" في مشروع "${projectName}" بواسطة ${userProfile.displayName || userProfile.name || userProfile.email}`,
      icon: '🏠✨',
      priority: 'medium',
      employeeName: userProfile.displayName || userProfile.name || userProfile.email,
      employeeEmail: userProfile.email || currentUser.email,
      unitNumber: unitNumber,
      projectName: projectName,
      unitType: unitType,
      action: 'unit_added'
    }

    console.log('📤 Sending new unit notification:', notification)

    try {
      const response = await fetch('/api/notifications-stream/emit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          event: 'newUnit',
          data: notification
        })
      })

      if (response.ok) {
        console.log('✅ New unit notification sent successfully')
      } else {
        console.error('❌ Failed to send notification:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error)
    }
  }, [currentUser, userProfile])

  // إرسال إشعار إكمال المتابعة
  const sendFollowUpCompletedNotification = useCallback(async (followUpTitle, clientName, result = '') => {
    if (!currentUser) {
      console.warn('⚠️ No current user for follow-up completed notification');
      return;
    }
    
    // Use currentUser as fallback if userProfile is not available
    const profile = userProfile || currentUser;

    const notification = {
      type: 'followUpCompleted',
      id: `followup-completed-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: result?.includes('مهتم') || result?.includes('تحويل') ? '🎉 نتيجة إيجابية من الفريق!' : '📋 متابعة مكتملة من الفريق',
      message: `قام ${profile.displayName || profile.name || profile.email} بإكمال متابعة "${followUpTitle}"${clientName ? ` للعميل "${clientName}"` : ''}${result ? ` - النتيجة: ${result}` : ''}`,
      icon: result?.includes('مهتم') || result?.includes('تحويل') ? '🎉' : '📋',
      priority: result?.includes('مهتم') || result?.includes('تحويل') ? 'high' : 'medium',
      employeeName: profile.displayName || profile.name || profile.email,
      employeeEmail: profile.email || currentUser.email,
      followUpTitle: followUpTitle,
      clientName: clientName,
      result: result,
      action: 'followup_completed'
    }

    console.log('📤 Sending follow-up completed notification:', notification)
    console.log('🔍 Profile data:', { 
      userProfile: !!userProfile, 
      currentUser: !!currentUser, 
      profileName: profile?.name,
      currentUserRole: currentUser?.role
    })

    try {
      // إرسال الإشعار للخادم
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(notification)
      })

      if (response.ok) {
        console.log('✅ Follow-up completed notification sent successfully')
        
        // أيضاً إرسال event للـ SSE
        try {
          await fetch('/api/notifications-stream/emit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              event: 'followUpCompleted',
              data: notification
            })
          })
          console.log('✅ Follow-up completed event emitted to SSE')
        } catch (sseError) {
          console.error('❌ Failed to emit SSE event:', sseError)
        }
      } else {
        console.error('❌ Failed to send follow-up completed notification:', response.status)
      }
    } catch (error) {
      console.error('❌ Error sending follow-up completed notification:', error)
    }
  }, [currentUser, userProfile])

  return {
    sendLeadConvertedNotification,
    sendNewLeadNotification,
    sendNewClientNotification,
    sendInteractionAddedNotification,
    sendNoteAddedNotification,
    sendNoteReplyNotification,
    sendTaskAssignedNotification,
    sendTaskActionNotification,
    sendTaskNoteAddedNotification,
    sendTaskNoteReplyNotification,
    // الإضافات الجديدة
    sendNewProjectNotification,
    sendNewSaleNotification,
    sendNewUnitNotification,
    sendFollowUpCompletedNotification
  }
}

export default useSSENotificationSender
