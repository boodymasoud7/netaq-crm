'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await queryInterface.bulkInsert('Users', [
      {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'المدير العام',
        role: 'admin',
        department: 'الإدارة',
        phone: '+201234567890',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'ahmed.samir@company.com', 
        password: await bcrypt.hash('sales123', 12),
        name: 'أحمد سمير',
        role: 'sales_manager',
        department: 'المبيعات',
        phone: '+201123456789',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'sara.ahmed@company.com',
        password: await bcrypt.hash('agent123', 12), 
        name: 'سارة أحمد',
        role: 'sales_agent',
        department: 'المبيعات',
        phone: '+201234567890',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'mariam.youssef@company.com',
        password: await bcrypt.hash('marketing123', 12),
        name: 'مريم يوسف', 
        role: 'marketing_specialist',
        department: 'التسويق',
        phone: '+201345678901',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: {
        [Sequelize.Op.in]: [
          'admin@example.com',
          'ahmed.samir@company.com', 
          'sara.ahmed@company.com',
          'mariam.youssef@company.com'
        ]
      }
    }, {});
  }
};
