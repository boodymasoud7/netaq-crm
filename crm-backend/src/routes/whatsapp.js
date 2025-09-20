const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');
const whatsappAPI = require('../services/whatsappBusinessAPI');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   POST /api/whatsapp/send
// @desc    Send single WhatsApp message
// @access  Private
router.post('/send', requirePermission('send_messages'), async (req, res) => {
  try {
    const { phone, message, contactName } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف والرسالة مطلوبان'
      });
    }

    // Replace placeholders
    const personalizedMessage = message.replace('{name}', contactName || 'العميل');

    const result = await whatsappAPI.sendTextMessage(phone, personalizedMessage);

    res.json({
      success: true,
      message: 'تم إرسال الرسالة بنجاح',
      data: result
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال الرسالة'
    });
  }
});

// @route   POST /api/whatsapp/bulk-send
// @desc    Send bulk WhatsApp messages
// @access  Private
router.post('/bulk-send', requirePermission('send_bulk_messages'), async (req, res) => {
  try {
    const { contacts, message } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'قائمة جهات الاتصال مطلوبة'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'نص الرسالة مطلوب'
      });
    }

    // Use WhatsApp Business API bulk send
    const bulkResult = await whatsappAPI.sendBulkMessages(contacts, message, 1000);
    
    const results = bulkResult.results;
    const successCount = bulkResult.successCount;
    const failureCount = bulkResult.failureCount;

    console.log(`📊 Bulk WhatsApp Results: ${successCount} success, ${failureCount} failed`);

    res.json({
      success: true,
      message: `تم إرسال ${successCount} رسالة بنجاح من أصل ${contacts.length}`,
      data: {
        totalSent: contacts.length,
        successCount,
        failureCount,
        results
      }
    });

  } catch (error) {
    console.error('Error sending bulk WhatsApp messages:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال الرسائل'
    });
  }
});

// @route   GET /api/whatsapp/templates
// @desc    Get WhatsApp message templates from API
// @access  Private
router.get('/templates', requirePermission('view_templates'), async (req, res) => {
  try {
    // Get templates from WhatsApp Business API
    const apiTemplates = await whatsappAPI.getMessageTemplates();
    
    // Local templates as fallback
    const localTemplates = [
      {
        id: 'welcome',
        name: 'رسالة ترحيب',
        content: `مرحباً {name}! 👋

نشكركم لاختيار شركتنا العقارية. نحن هنا لمساعدتكم في العثور على العقار المثالي.

للاستفسارات: 📞 ${process.env.COMPANY_PHONE || '01234567890'}

فريق المبيعات`,
        category: 'welcome',
        source: 'local'
      },
      {
        id: 'followup',
        name: 'متابعة استفسار',
        content: `أهلاً {name} 🏠

نود متابعة استفسارك حول العقارات في منطقة القاهرة الجديدة.

لدينا عروض جديدة قد تناسبك:
✨ أسعار مميزة
🏗️ تشطيب فاخر  
📍 مواقع متميزة

هل يمكننا ترتيب موعد لمعاينة العقارات؟

${process.env.COMPANY_NAME || 'فريق المبيعات'}`,
        category: 'followup',
        source: 'local'
      }
    ];

    let allTemplates = localTemplates;

    // Add API templates if available
    if (apiTemplates.success) {
      const formattedAPITemplates = apiTemplates.templates.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        status: template.status,
        language: template.language,
        source: 'whatsapp_api',
        components: template.components
      }));
      
      allTemplates = [...localTemplates, ...formattedAPITemplates];
    }

    res.json({
      success: true,
      data: {
        templates: allTemplates,
        apiConnected: apiTemplates.success,
        totalCount: allTemplates.length
      }
    });

  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب القوالب'
    });
  }
});

// @route   GET /api/whatsapp/status
// @desc    Get WhatsApp Business API status
// @access  Private
router.get('/status', async (req, res) => {
  try {
    const status = await whatsappAPI.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        provider: 'WhatsApp Business API',
        features: {
          textMessages: true,
          templateMessages: true,
          mediaMessages: true,
          bulkMessages: true,
          webhooks: true,
          messageStatus: true
        },
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking WhatsApp status:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء فحص حالة الخدمة'
    });
  }
});

// @route   GET /api/whatsapp/webhook
// @desc    Verify WhatsApp webhook
// @access  Public
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const result = whatsappAPI.verifyWebhook(mode, token, challenge);
  
  if (result) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// @route   POST /api/whatsapp/webhook
// @desc    Handle WhatsApp webhook events
// @access  Public
router.post('/webhook', (req, res) => {
  try {
    const webhookData = whatsappAPI.processWebhook(req.body);
    
    if (webhookData) {
      console.log('📱 WhatsApp Webhook Event:', webhookData.type);
      
      if (webhookData.type === 'message') {
        // Handle incoming messages
        console.log('📥 Incoming messages:', webhookData.messages);
        
        // Auto-mark as read
        webhookData.messages.forEach(async (message) => {
          await whatsappAPI.markMessageAsRead(message.id);
        });
      }
      
      if (webhookData.type === 'status') {
        // Handle message status updates
        console.log('📊 Message status updates:', webhookData.statuses);
      }
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).send('Error');
  }
});

// @route   POST /api/whatsapp/send-template
// @desc    Send WhatsApp template message
// @access  Private
router.post('/send-template', requirePermission('send_messages'), async (req, res) => {
  try {
    const { phone, templateName, parameters = [], contactName } = req.body;

    if (!phone || !templateName) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف واسم القالب مطلوبان'
      });
    }

    // Replace name placeholder in parameters
    const processedParameters = parameters.map(param => 
      param.replace('{name}', contactName || 'العميل')
    );

    const result = await whatsappAPI.sendTemplateMessage(phone, templateName, 'ar', processedParameters);

    res.json({
      success: true,
      message: 'تم إرسال رسالة القالب بنجاح',
      data: result
    });

  } catch (error) {
    console.error('Error sending template message:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال رسالة القالب'
    });
  }
});

// @route   POST /api/whatsapp/create-template
// @desc    Create new WhatsApp message template
// @access  Private (Admin only)
router.post('/create-template', requirePermission('manage_templates'), async (req, res) => {
  try {
    const { name, category, language, components } = req.body;

    if (!name || !category || !components) {
      return res.status(400).json({
        success: false,
        message: 'اسم القالب والفئة والمحتوى مطلوبان'
      });
    }

    const result = await whatsappAPI.createMessageTemplate(name, category, language || 'ar', components);

    res.json({
      success: true,
      message: 'تم إنشاء القالب بنجاح',
      data: result
    });

  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء القالب'
    });
  }
});

module.exports = router;




