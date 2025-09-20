'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Insert sample projects
    await queryInterface.bulkInsert('Projects', [
      {
        name: 'كمبوند الياسمين الجديد',
        location: 'القاهرة الجديدة - التجمع الخامس',
        developer: 'شركة الياسمين للتطوير العقاري',
        totalUnits: 500,
        availableUnits: 350,
        priceRange: '2.5 - 8 مليون جنيه',
        status: 'under_construction',
        completion: 65,
        amenities: JSON.stringify(['حمام سباحة', 'صالة ألعاب رياضية', 'منطقة أطفال', 'مول تجاري', 'أمن 24 ساعة']),
        description: 'كمبوند سكني متكامل في قلب التجمع الخامس بتشطيبات عالية الجودة',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'أبراج النيل الذهبية',
        location: 'المعادي',
        developer: 'مجموعة النيل العقارية',
        totalUnits: 200,
        availableUnits: 45,
        priceRange: '5 - 15 مليون جنيه',
        status: 'completed',
        completion: 100,
        amenities: JSON.stringify(['إطلالة على النيل', 'مطاعم', 'سبا', 'مواقف سيارات', 'كونسيرج']),
        description: 'أبراج سكنية فاخرة بإطلالة مباشرة على نهر النيل',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'قرية البحر الأحمر السياحية',
        location: 'الغردقة',
        developer: 'شركة البحر الأحمر للسياحة',
        totalUnits: 300,
        availableUnits: 280,
        priceRange: '1.5 - 6 مليون جنيه',
        status: 'planning',
        completion: 15,
        amenities: JSON.stringify(['شاطئ خاص', 'مرسى يخوت', 'ملاعب جولف', 'فنادق', 'مراكز تسوق']),
        description: 'قرية سياحية متكاملة على ساحل البحر الأحمر',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Insert sample clients
    await queryInterface.bulkInsert('Clients', [
      {
        name: 'أحمد محمد علي',
        email: 'ahmed.ali@example.com',
        phone: '+201123456789',
        address: 'شارع النصر، مدينة نصر، القاهرة',
        budget: 4500000,
        status: 'active',
        source: 'موقع الشركة',
        notes: 'مهتم بشقق 3 غرف في التجمع الخامس',
        assignedTo: 'سارة أحمد',
        lastContact: new Date('2025-08-30'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'فاطمة حسن إبراهيم',
        email: 'fatma.hassan@example.com',
        phone: '+201234567890',
        address: 'شارع الهرم، الجيزة',
        budget: 7500000,
        status: 'potential',
        source: 'إعلان فيسبوك',
        notes: 'تبحث عن شقة بإطلالة على النيل',
        assignedTo: 'أحمد سمير',
        lastContact: new Date('2025-08-31'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'محمد عبدالله',
        email: 'mohamed.abdullah@example.com',
        phone: '+201987654321',
        address: 'المقطم، القاهرة',
        budget: 2800000,
        status: 'converted',
        source: 'توصية صديق',
        notes: 'تم شراء شقة في كمبوند الياسمين',
        assignedTo: 'سارة أحمد',
        lastContact: new Date('2025-08-29'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Insert sample leads
    await queryInterface.bulkInsert('Leads', [
      {
        name: 'سمير أحمد محمود',
        email: 'samir.ahmed@example.com',
        phone: '+201555666777',
        interest: 'شقة 2 غرفة في القاهرة الجديدة',
        budget: 3200000,
        status: 'new',
        source: 'جوجل',
        priority: 'high',
        notes: 'اتصال أول مرة - يريد موعد للمعاينة',
        assignedTo: 'مريم يوسف',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'نورا عبدالفتاح',
        email: 'nora.abdelfatah@example.com',
        phone: '+201888999000',
        interest: 'فيلا في كمبوند',
        budget: 12000000,
        status: 'contacted',
        source: 'معرض عقاري',
        priority: 'urgent',
        notes: 'تم التواصل - مهتمة جداً - موعد غداً',
        assignedTo: 'أحمد سمير',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'خالد محمد',
        email: 'khaled.mohamed@example.com',
        phone: '+201333444555',
        interest: 'وحدة سياحية في الساحل الشمالي',
        budget: 2500000,
        status: 'qualified',
        source: 'إنستجرام',
        priority: 'medium',
        notes: 'لديه الميزانية - يحتاج تفاصيل أكثر',
        assignedTo: 'سارة أحمد',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Insert sample sales
    await queryInterface.bulkInsert('Sales', [
      {
        clientName: 'محمد عبدالله',
        clientId: 3,
        projectName: 'كمبوند الياسمين الجديد',
        projectId: 1,
        unitType: 'شقة 3 غرف',
        price: 4200000,
        commission: 210000,
        status: 'completed',
        saleDate: new Date('2025-08-25'),
        salesPerson: 'سارة أحمد',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clientName: 'عمرو حسام',
        clientId: null,
        projectName: 'أبراج النيل الذهبية',
        projectId: 2,
        unitType: 'شقة 4 غرف - إطلالة نيل',
        price: 8500000,
        commission: 425000,
        status: 'pending',
        saleDate: new Date('2025-08-30'),
        salesPerson: 'أحمد سمير',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Insert sample tasks
    await queryInterface.bulkInsert('Tasks', [
      {
        title: 'متابعة عميل سمير أحمد',
        description: 'الاتصال بالعميل لتحديد موعد المعاينة وإرسال تفاصيل المشروع',
        assignedTo: 'مريم يوسف',
        dueDate: new Date('2025-09-02'),
        priority: 'high',
        status: 'pending',
        category: 'follow_up',
        progress: 0,
        tags: JSON.stringify(['عميل جديد', 'موعد معاينة']),
        leadName: 'سمير أحمد محمود',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'إعداد عرض تقديمي لنورا',
        description: 'تحضير عرض تقديمي شامل عن الفيلات المتاحة مع الأسعار والتفاصيل',
        assignedTo: 'أحمد سمير',
        dueDate: new Date('2025-09-01'),
        priority: 'urgent',
        status: 'in_progress',
        category: 'meeting',
        progress: 60,
        tags: JSON.stringify(['عرض تقديمي', 'فيلا', 'عميل مهم']),
        leadName: 'نورا عبدالفتاح',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'إنهاء أوراق بيع محمد عبدالله',
        description: 'استكمال جميع الأوراق القانونية وتسليم الوحدة',
        assignedTo: 'سارة أحمد',
        dueDate: new Date('2025-09-05'),
        priority: 'medium',
        status: 'completed',
        category: 'documentation',
        progress: 100,
        tags: JSON.stringify(['بيع مكتمل', 'أوراق قانونية']),
        leadName: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Tasks', null, {});
    await queryInterface.bulkDelete('Sales', null, {});
    await queryInterface.bulkDelete('Leads', null, {});
    await queryInterface.bulkDelete('Clients', null, {});
    await queryInterface.bulkDelete('Projects', null, {});
  }
};
