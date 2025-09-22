const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const notificationEmitter = require('../utils/notificationEmitter');
// Removed saveNotification import to avoid circular dependency
const { Op } = require('sequelize');

// Helper function to get all managers
const getAllManagerEmails = async () => {
  try {
    const { User } = require('../../models');
    const managers = await User.findAll({ 
      where: { 
        role: ['admin', 'sales_manager'] 
      },
      attributes: ['email']
    });
    
    return managers.map(manager => manager.email);
  } catch (error) {
    console.error('❌ Error getting manager emails:', error);
    // Fallback to default managers
    return ['admin@crm.com', 'manager@crm.com'];
  }
};

// Helper function to save and send notification
const saveAndSendNotification = async (data, targetUserEmail, sseConnected = false) => {
  try {
    // Save to database first (direct create to avoid circular dependency)
    const { Notification } = require('../../models');
    await Notification.create({
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority || 'medium',
      targetUserEmail: targetUserEmail,
      targetUserName: data.employeeName || data.targetEmployeeName,
      senderEmail: data.managerEmail || data.senderEmail,
      senderName: data.managerName || data.senderName,
      data: data,
      sentViaSSE: sseConnected,
      sentAt: sseConnected ? new Date() : null,
      isRead: false
    });
    
    console.log(`💾 Notification saved to database for: ${targetUserEmail}`);
  } catch (error) {
    console.error('❌ Error saving notification to database:', error);
  }
};

// Handle preflight requests for SSE
router.options('/stream', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin && ['http://localhost:3000', 'http://localhost:3001'].includes(req.headers.origin) ? req.headers.origin : 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// SSE stream للإشعارات الفورية - Custom auth middleware for query token
const sseAuthMiddleware = (req, res, next) => {
  // استخراج الـ token من query parameter أو header
  let token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  console.log('🔍 SSE Auth - Token from query:', req.query.token ? 'Present' : 'Not present');
  console.log('🔍 SSE Auth - Token from header:', req.headers.authorization ? 'Present' : 'Not present');
  
  if (!token) {
    console.log('❌ SSE Auth - No token provided');
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // التحقق من الـ token باستخدام الـ middleware الأصلي
  const { verifyToken } = require('../middleware/auth');
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    console.log('✅ SSE Auth - Valid token for connection:', decoded.email);
    next();
  } catch (error) {
    console.log('❌ SSE Auth - Invalid token:', error.message);
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

router.get('/stream', sseAuthMiddleware, (req, res) => {
  console.log('📡 New SSE connection from user:', req.user?.email);
  
  // إعداد SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin && ['http://localhost:3000', 'http://localhost:3001'].includes(req.headers.origin) ? req.headers.origin : 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  // Handle connection close
  req.on('close', () => {
    console.log('🔌 SSE connection closed for user:', req.user?.email);
    clearInterval(heartbeat);
    // Remove event listeners
    notificationEmitter.off('managerNotification', handleManagerNotification);
    notificationEmitter.off('newLead', handleNewLead);
    notificationEmitter.off('newClient', handleNewClient);
  });

  // Handle connection error
  req.on('error', (error) => {
    console.error('❌ SSE connection error for user:', req.user?.email, error.message);
    clearInterval(heartbeat);
  });

  // إرسال heartbeat كل 30 ثانية للحفاظ على الاتصال
  const heartbeat = setInterval(() => {
    res.write('data: {"type":"heartbeat"}\n\n');
  }, 30000);

  // إرسال رسالة ترحيب
  res.write('data: {"type":"connected","message":"Connected to notification stream"}\n\n');

  // الاستماع لأحداث الإشعارات
  const handleManagerNotification = (data) => {
    // التحقق من أن المستخدم مدير
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending notification to manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'managerNotification',
        ...data
      })}\n\n`);
    }
  };

  const handleLeadConverted = (data) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending lead conversion notification to manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'leadConverted',
        ...data
      })}\n\n`);
    }
  };

  const handleNewLead = (data) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending new lead notification to manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'newLead',
        ...data
      })}\n\n`);
    }
  };

  const handleNewClient = async (data) => {
    console.log('🎯 Processing new client notification:', {
      employeeEmail: data.employeeEmail,
      employeeName: data.employeeName,
      clientName: data.clientName
    });
    
    // Save notification to database for all managers
    const managerEmails = await getAllManagerEmails();
    for (const managerEmail of managerEmails) {
      await saveAndSendNotification(data, managerEmail, false);
    }
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending new client notification to manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'newClient',
        ...data
      })}\n\n`);
      
      // Update sentViaSSE flag for this manager
      await saveAndSendNotification(data, req.user.email, true);
    }
  };

  const handleInteractionAdded = async (data) => {
    console.log('🎯 Processing interaction added notification:', {
      employeeName: data.employeeName,
      clientName: data.clientName
    });
    
    // Save notification to database for all managers
    const managerEmails = await getAllManagerEmails();
    for (const managerEmail of managerEmails) {
      await saveAndSendNotification(data, managerEmail, false);
    }
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending interaction added notification to manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'interactionAdded',
        ...data
      })}\n\n`);
      
      // Update sentViaSSE flag for this manager
      await saveAndSendNotification(data, req.user.email, true);
    }
  };

  const handleNoteAdded = async (data) => {
    console.log('🎯 handleNoteAdded CALLED! Processing note added notification:', {
      employeeName: data.employeeName,
      clientName: data.clientName,
      dataKeys: Object.keys(data)
    });
    
    console.log('👤 Current connected user:', {
      email: req.user?.email,
      role: req.user?.role,
      isManager: req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')
    });
    
    // Save notification to database for all managers
    try {
      const managerEmails = await getAllManagerEmails();
      console.log('📧 Manager emails from database:', managerEmails);
      
      // Fallback: if no managers found, use known manager email
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      console.log('📋 Final manager emails to save to:', finalManagerEmails);
      
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
        console.log('💾 Notification saved to database for:', managerEmail);
      }
    } catch (error) {
      console.error('❌ Error getting manager emails, using fallback:', error);
      // Emergency fallback
      await saveAndSendNotification(data, 'boodymasoud9@gmail.com', false);
      console.log('💾 Notification saved to database for fallback manager: boodymasoud9@gmail.com');
    }
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending note added notification to connected manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'noteAdded',
        ...data
      })}\n\n`);
      
      // Update sentViaSSE flag for this manager
      await saveAndSendNotification(data, req.user.email, true);
      console.log('✅ SSE notification sent and database updated for:', req.user.email);
    } else {
      console.log('ℹ️ No manager connected via SSE. Notification saved to database only.');
    }
  };

  const handleNoteReply = async (data) => {
    console.log('🎯 Processing note reply notification:', {
      targetEmployeeEmail: data.targetEmployeeEmail,
      managerName: data.managerName
    });
    
    let targetEmail = data.targetEmployeeEmail;
    
    // If target email doesn't contain @, treat it as a name and look up the email
    if (targetEmail && !targetEmail.includes('@')) {
      const { User } = require('../../models');
      try {
        // Try to find user by name first
        let user = await User.findOne({ 
          where: { 
            name: targetEmail 
          }
        });
        
        // If not found by name, try by email (fallback)
        if (!user) {
          user = await User.findOne({ 
            where: { 
              email: targetEmail 
            }
          });
        }
        
        if (user) {
          targetEmail = user.email;
          console.log('✅ Found employee email by name lookup:', targetEmail);
        } else {
          console.warn('⚠️ Could not find user with name:', data.targetEmployeeEmail);
          return; // Exit if we can't find the user
        }
      } catch (error) {
        console.error('❌ Error finding employee email:', error);
        return; // Exit on error
      }
    }
    
    // Save notification to database for the target employee
    if (targetEmail) {
      await saveAndSendNotification(data, targetEmail, false);
    }
    
    // إشعار رد المدير يروح للموظف المحدد، مش للمديرين
    if (req.user && targetEmail === req.user.email) {
      console.log('📤 Sending note reply notification to employee:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'noteReply',
        ...data
      })}\n\n`);
      
      // Update sentViaSSE flag
      await saveAndSendNotification(data, targetEmail, true);
    } else {
      console.log('❌ Note reply notification not sent via SSE. Saved to database for:', targetEmail);
    }
  };

  // معالج إشعارات تكليف المهام
  const handleTaskAssigned = async (data) => {
    console.log('🎯 Processing task assigned notification:', {
      assignedToEmail: data.assignedToEmail,
      userEmail: req.user?.email,
      assignedToName: data.assignedToName
    });
    
    // Save notification to database first
    if (data.assignedToEmail) {
      await saveAndSendNotification(data, data.assignedToEmail, false);
    }
    
    // إرسال للموظف المكلف بالمهمة إذا كان متصل
    if (req.user && data.assignedToEmail && data.assignedToEmail === req.user.email) {
      console.log('📤 Sending task assigned notification to employee:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'taskAssigned',
        ...data
      })}\n\n`);
      
      // Update sentViaSSE flag
      await saveAndSendNotification(data, data.assignedToEmail, true);
    } else {
      console.log('❌ Task assigned notification not sent via SSE. Saved to database. Reason:', {
        userExists: !!req.user,
        hasAssignedEmail: !!data.assignedToEmail,
        emailMatch: data.assignedToEmail === req.user?.email
      });
    }
  };

  // معالج إشعارات إجراءات المهام
  const handleTaskAction = (data) => {
    // إرسال للمدراء
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending task action notification to manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'taskAction',
        ...data
      })}\n\n`);
    }
  };

  // معالج إشعارات ملاحظات المهام
  const handleTaskNoteAdded = async (data) => {
    console.log('🎯 Processing task note added notification:', {
      employeeName: data.employeeName,
      taskTitle: data.taskTitle
    });
    
    // Save notification to database for all managers
    const managerEmails = await getAllManagerEmails();
    for (const managerEmail of managerEmails) {
      await saveAndSendNotification(data, managerEmail, false);
    }
    
    // إرسال للمدراء المتصلين
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending task note added notification to manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'taskNoteAdded',
        ...data
      })}\n\n`);
      
      // Update sentViaSSE flag for this manager
      await saveAndSendNotification(data, req.user.email, true);
    }
  };

  // معالج ردود المدير على ملاحظات المهام
  const handleTaskNoteReply = async (data) => {
    console.log('🎯 Processing task note reply notification:', {
      employeeName: data.employeeName,
      employeeEmail: data.employeeEmail
    });
    
    // Save notification to database for the employee
    let targetEmail = data.employeeEmail;
    
    // If no email provided, try to find it by name (fallback)
    if (!targetEmail && data.employeeName) {
      const { User } = require('../../models');
      try {
        // Try to find user by name first
        let user = await User.findOne({ 
          where: { 
            name: data.employeeName 
          }
        });
        
        // If not found by name, try by email (fallback)
        if (!user) {
          user = await User.findOne({ 
            where: { 
              email: data.employeeName 
            }
          });
        }
        
        if (user) {
          targetEmail = user.email;
          console.log('✅ Found employee email by name lookup:', targetEmail);
        } else {
          console.warn('⚠️ Could not find user with name:', data.employeeName);
        }
      } catch (error) {
        console.error('❌ Error finding employee email:', error);
      }
    }
    
    if (targetEmail) {
      await saveAndSendNotification(data, targetEmail, false);
      
      // إرسال للموظف إذا كان متصل
      if (req.user && targetEmail === req.user.email) {
        console.log('📤 Sending task note reply notification to employee:', req.user.email);
        res.write(`data: ${JSON.stringify({
          type: 'taskNoteReply',
          ...data
        })}\n\n`);
        
        // Update sentViaSSE flag
        await saveAndSendNotification(data, targetEmail, true);
      } else {
        console.log('❌ Task note reply notification not sent via SSE. Saved to database.');
      }
    } else {
      console.error('❌ No target email found for task note reply notification');
    }
  };

  // معالج إشعارات المشاريع الجديدة - لجميع المستخدمين
  const handleNewProject = (data) => {
    if (req.user) {
      console.log('📤 Sending new project notification to user:', req.user.email, 'Role:', req.user.role);
      res.write(`data: ${JSON.stringify({
        type: 'newProject',
        ...data
      })}\n\n`);
    }
  };

  // معالج إشعارات المبيعات الجديدة
  const handleNewSale = (data) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending new sale notification to manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'newSale',
        ...data
      })}\n\n`);
    }
  };

  // معالج إشعارات الوحدات الجديدة - لجميع المستخدمين
  const handleNewUnit = (data) => {
    if (req.user) {
      console.log('📤 Sending new unit notification to user:', req.user.email, 'Role:', req.user.role);
      res.write(`data: ${JSON.stringify({
        type: 'newUnit',
        ...data
      })}\n\n`);
    }
  };

  // معالج إشعارات إكمال المتابعات
  const handleFollowUpCompleted = async (data) => {
    console.log('✅ Processing follow-up completed notification:', {
      employeeName: data.employeeName,
      clientName: data.clientName,
      result: data.result
    });
    
    // Save notification to database for all managers
    const managerEmails = await getAllManagerEmails();
    for (const managerEmail of managerEmails) {
      await saveAndSendNotification(data, managerEmail, false);
    }
    
    // إرسال للمدراء المتصلين
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_manager')) {
      console.log('📤 Sending follow-up completed notification to manager:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'followUpCompleted',
        ...data
      })}\n\n`);
      
      // Update sentViaSSE flag for this manager
      await saveAndSendNotification(data, req.user.email, true);
    }
  };
  
  // معالج إشعارات المتابعات المخصصة للموظفين
  const handleFollowUpAssigned = async (data) => {
    console.log('📋 Processing follow-up assigned notification:', data.title);
    
    // إرسال للموظف المخصص له المتابعة
    if (req.user && req.user.id === data.employeeId) {
      console.log('📤 Sending follow-up assigned notification to employee:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'followUpAssigned',
        ...data
      })}\n\n`);
    }
  };
  
  // معالج إشعارات المتابعات المستحقة
  const handleFollowUpDue = async (data) => {
    console.log('⏰ Processing follow-up due notification:', data.title);
    
    // إرسال للموظف المخصص له المتابعة
    if (req.user && req.user.id === data.employeeId) {
      console.log('📤 Sending follow-up due notification to employee:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'followUpDue',
        ...data
      })}\n\n`);
    }
  };
  
  // معالج إشعارات المتابعات المتأخرة
  const handleFollowUpOverdue = async (data) => {
    console.log('🚨 Processing follow-up overdue notification:', data.title);
    
    // إرسال للموظف المخصص له المتابعة
    if (req.user && req.user.id === data.employeeId) {
      console.log('📤 Sending follow-up overdue notification to employee:', req.user.email);
      res.write(`data: ${JSON.stringify({
        type: 'followUpOverdue',
        ...data
      })}\n\n`);
    }
  };

  // تسجيل المستمعين للاتصال الحالي
  notificationEmitter.on('managerNotification', handleManagerNotification);
  notificationEmitter.on('leadConverted', handleLeadConverted);
  notificationEmitter.on('newLead', handleNewLead);
  notificationEmitter.on('newClient', handleNewClient);
  notificationEmitter.on('interactionAdded', handleInteractionAdded);
  notificationEmitter.on('noteAdded', handleNoteAdded);
  notificationEmitter.on('noteReply', handleNoteReply);
  notificationEmitter.on('taskAssigned', handleTaskAssigned);
  notificationEmitter.on('taskAction', handleTaskAction);
  notificationEmitter.on('taskNoteAdded', handleTaskNoteAdded);
  notificationEmitter.on('taskNoteReply', handleTaskNoteReply);
  notificationEmitter.on('newProject', handleNewProject);
  notificationEmitter.on('newSale', handleNewSale);
  notificationEmitter.on('newUnit', handleNewUnit);
  notificationEmitter.on('followUpCompleted', handleFollowUpCompleted);
  notificationEmitter.on('followUpAssigned', handleFollowUpAssigned);
  notificationEmitter.on('followUpDue', handleFollowUpDue);
  notificationEmitter.on('followUpOverdue', handleFollowUpOverdue);
  
  console.log('🔗 SSE connection established for user:', req.user?.email);

  // تنظيف عند إغلاق الاتصال
  req.on('close', () => {
    console.log('📡 SSE connection closed for user:', req.user?.email);
    clearInterval(heartbeat);
    notificationEmitter.removeListener('managerNotification', handleManagerNotification);
    notificationEmitter.removeListener('leadConverted', handleLeadConverted);
    notificationEmitter.removeListener('newLead', handleNewLead);
    notificationEmitter.removeListener('newClient', handleNewClient);
    notificationEmitter.removeListener('interactionAdded', handleInteractionAdded);
    notificationEmitter.removeListener('noteAdded', handleNoteAdded);
    notificationEmitter.removeListener('noteReply', handleNoteReply);
    notificationEmitter.removeListener('taskAssigned', handleTaskAssigned);
    notificationEmitter.removeListener('taskAction', handleTaskAction);
    notificationEmitter.removeListener('taskNoteAdded', handleTaskNoteAdded);
    notificationEmitter.removeListener('taskNoteReply', handleTaskNoteReply);
    // إزالة المستمعين الجدد
    notificationEmitter.removeListener('newProject', handleNewProject);
    notificationEmitter.removeListener('newSale', handleNewSale);
    notificationEmitter.removeListener('newUnit', handleNewUnit);
    notificationEmitter.removeListener('followUpCompleted', handleFollowUpCompleted);
  });
});

// API لإرسال الأحداث من الفرونت إند
router.post('/emit', authMiddleware, (req, res) => {
  try {
    const { event, data } = req.body;
    
    console.log('📨 Received notification emit request:', { 
      event, 
      dataTitle: data?.title,
      user: req.user?.email 
    });
    
    if (!event || !data) {
      console.error('❌ Missing event or data:', { event: !!event, data: !!data });
      return res.status(400).json({ error: 'Event and data are required' });
    }

    // إرسال الحدث عبر EventEmitter
    console.log('🔄 Emitting event:', event, 'to EventEmitter');
    notificationEmitter.emit(event, data);
    
    console.log('✅ Event emitted successfully:', event);
    res.json({ success: true, message: 'Event emitted successfully' });
    
  } catch (error) {
    console.error('❌ Error in emit endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to emit event', 
      details: error.message 
    });
  }
});

// تسجيل المستمعين مرة واحدة فقط عند تحميل الملف
let listenersRegistered = false;

if (!listenersRegistered) {
  console.log('🔗 Registering global event listeners...');
  
  notificationEmitter.on('managerNotification', async (data) => {
    console.log('👨‍💼 Processing manager notification');
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ Manager notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global managerNotification handler:', error);
    }
  });
  
  notificationEmitter.on('leadConverted', async (data) => {
    console.log('🎯 Processing lead converted notification');
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ Lead converted notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global leadConverted handler:', error);
    }
  });
  
  notificationEmitter.on('newLead', async (data) => {
    console.log('🆕 Processing new lead notification');
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ New lead notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global newLead handler:', error);
    }
  });
  
  notificationEmitter.on('newClient', async (data) => {
    console.log('👥 Processing new client notification for:', data.clientName);
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      
      // حفظ الإشعار لكل مدير
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ New client notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global newClient handler:', error);
    }
  });
  
  notificationEmitter.on('interactionAdded', async (data) => {
    console.log('💬 Processing interaction added notification for:', data.clientName);
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      
      // حفظ الإشعار لكل مدير
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ Interaction notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global interactionAdded handler:', error);
    }
  });
  
  // المستمع الرئيسي لـ noteAdded
  notificationEmitter.on('noteAdded', async (data) => {
    console.log('📝 Processing note added notification for:', data.clientName);
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      
      // حفظ الإشعار لكل مدير
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ Note notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global noteAdded handler:', error);
    }
  });
  
  notificationEmitter.on('noteReply', async (data) => {
    console.log('💬 Processing note reply notification for:', data.targetEmployeeEmail || data.employeeEmail);
    
    try {
      let targetEmail = data.targetEmployeeEmail || data.employeeEmail;
      
      // إذا كان الإيميل اسم وليس إيميل، ابحث عن المستخدم
      if (targetEmail && !targetEmail.includes('@')) {
        const { User } = require('../../models');
        const user = await User.findOne({
          where: {
            name: targetEmail
          }
        });
        
        if (user) {
          console.log('👤 Found user by name:', targetEmail, '→', user.email);
          targetEmail = user.email;
        } else {
          console.warn('⚠️ User not found by name:', targetEmail);
        }
      }
      
      if (targetEmail) {
        await saveAndSendNotification(data, targetEmail, false);
        console.log('✅ Note reply notification saved successfully for:', targetEmail);
      } else {
        console.warn('⚠️ Could not determine target email for note reply');
      }
    } catch (error) {
      console.error('❌ Error in global noteReply handler:', error);
    }
  });
  
  notificationEmitter.on('taskAssigned', async (data) => {
    console.log('📋 Processing task assigned notification for:', data.assignedToEmail);
    
    try {
      let targetEmail = data.assignedToEmail;
      
      // إذا كان الإيميل اسم وليس إيميل، ابحث عن المستخدم
      if (targetEmail && !targetEmail.includes('@')) {
        const { User } = require('../../models');
        const user = await User.findOne({
          where: {
            name: targetEmail
          }
        });
        
        if (user) {
          console.log('👤 Found user by name:', targetEmail, '→', user.email);
          targetEmail = user.email;
        } else {
          console.warn('⚠️ User not found by name:', targetEmail);
        }
      }
      
      if (targetEmail) {
        await saveAndSendNotification(data, targetEmail, false);
        console.log('✅ Task assigned notification saved successfully for:', targetEmail);
      } else {
        console.warn('⚠️ Could not determine target email for task assignment');
      }
    } catch (error) {
      console.error('❌ Error in global taskAssigned handler:', error);
    }
  });
  
  notificationEmitter.on('taskAction', async (data) => {
    console.log('⚡ Processing task action notification');
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      
      // حفظ الإشعار لكل مدير
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ Task action notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global taskAction handler:', error);
    }
  });
  
  notificationEmitter.on('taskNoteAdded', async (data) => {
    console.log('📝 Processing task note added notification');
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      
      // حفظ الإشعار لكل مدير
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ Task note notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global taskNoteAdded handler:', error);
    }
  });
  
  notificationEmitter.on('taskNoteReply', async (data) => {
    console.log('💬 Processing task note reply notification for:', data.employeeEmail);
    
    try {
      let targetEmail = data.employeeEmail;
      
      // إذا كان الإيميل اسم وليس إيميل، ابحث عن المستخدم
      if (targetEmail && !targetEmail.includes('@')) {
        const { User } = require('../../models');
        const user = await User.findOne({
          where: {
            name: targetEmail
          }
        });
        
        if (user) {
          console.log('👤 Found user by name:', targetEmail, '→', user.email);
          targetEmail = user.email;
        } else {
          console.warn('⚠️ User not found by name:', targetEmail);
        }
      }
      
      if (targetEmail) {
        await saveAndSendNotification(data, targetEmail, false);
        console.log('✅ Task note reply notification saved successfully for:', targetEmail);
      } else {
        console.warn('⚠️ Could not determine target email for task note reply');
      }
    } catch (error) {
      console.error('❌ Error in global taskNoteReply handler:', error);
    }
  });
  
  notificationEmitter.on('newProject', async (data) => {
    console.log('🏗️ Processing new project notification:', data.projectName);
    
    try {
      // إرسال للجميع (مديرين وموظفين)
      const { User } = require('../../models');
      const allUsers = await User.findAll({
        attributes: ['email']
      });
      
      for (const user of allUsers) {
        await saveAndSendNotification(data, user.email, false);
      }
      
      console.log('✅ New project notification saved for all users');
    } catch (error) {
      console.error('❌ Error in global newProject handler:', error);
    }
  });
  
  notificationEmitter.on('newSale', async (data) => {
    console.log('💰 Processing new sale notification');
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['boodymasoud9@gmail.com'];
      
      // حفظ الإشعار لكل مدير
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ New sale notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global newSale handler:', error);
    }
  });
  
  notificationEmitter.on('newUnit', async (data) => {
    console.log('🏠 Processing new unit notification:', data.unitNumber);
    
    try {
      // إرسال للجميع (مديرين وموظفين)
      const { User } = require('../../models');
      const allUsers = await User.findAll({
        attributes: ['email']
      });
      
      for (const user of allUsers) {
        await saveAndSendNotification(data, user.email, false);
      }
      
      console.log('✅ New unit notification saved for all users');
    } catch (error) {
      console.error('❌ Error in global newUnit handler:', error);
    }
  });
  
  notificationEmitter.on('followUpCompleted', async (data) => {
    console.log('✅ Processing follow-up completed notification:', {
      employeeName: data.employeeName,
      clientName: data.clientName,
      result: data.result
    });
    
    try {
      const managerEmails = await getAllManagerEmails();
      const finalManagerEmails = managerEmails.length > 0 ? managerEmails : ['admin@crm.com'];
      
      // حفظ الإشعار لكل مدير
      for (const managerEmail of finalManagerEmails) {
        await saveAndSendNotification(data, managerEmail, false);
      }
      
      console.log('✅ Follow-up completed notification saved successfully');
    } catch (error) {
      console.error('❌ Error in global followUpCompleted handler:', error);
    }
  });
  
  listenersRegistered = true;
  console.log('✅ Global event listeners registered successfully');
}

// Clear all notifications for current user
router.delete('/clear-all', authMiddleware, async (req, res) => {
  try {
    console.log('🗑️ Clear-all notifications request received');
    console.log('👤 User:', req.user ? req.user.email : 'No user');
    
    const { Notification } = require('../../models');
    
    if (!req.user || !req.user.email) {
      console.error('❌ No user or email in request');
      return res.status(401).json({
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    // Delete all notifications for the current user
    const deletedCount = await Notification.destroy({
      where: {
        targetUserEmail: req.user.email
      }
    });

    console.log(`✅ Cleared ${deletedCount} notifications for ${req.user.email}`);

    res.json({
      message: 'All notifications cleared successfully',
      deletedCount
    });

  } catch (error) {
    console.error('❌ Clear all notifications error:', error);
    res.status(500).json({
      message: 'Server error while clearing notifications',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
