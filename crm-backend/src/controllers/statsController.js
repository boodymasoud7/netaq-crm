const { User, Client, Lead, Sale, Project, Task, Interaction } = require('../../models/index.js');
const { Op } = require('sequelize');

// Get comprehensive statistics for Manager Dashboard
exports.getManagerStats = async (req, res) => {
  try {
    console.log('📊 Getting comprehensive manager statistics...');
    
    // Remove early return - execute full stats calculation

    // Get current date for filtering
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // 1. Users/Employees Statistics
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const salesUsers = await User.count({ 
      where: { 
        role: { [Op.in]: ['sales', 'sales_agent', 'sales_manager'] },
        status: 'active'
      } 
    });

    // 2. Clients Statistics
    const totalClients = await Client.count();
    const newClientsThisMonth = await Client.count({
      where: {
        createdAt: { [Op.gte]: thisMonth }
      }
    });

    // Calculate average client rating
    const clientRatingStats = await Client.findAll({
      where: {
        rating: { [Op.not]: null }
      },
      attributes: [
        [Client.sequelize.fn('AVG', Client.sequelize.col('rating')), 'averageRating'],
        [Client.sequelize.fn('COUNT', '*'), 'ratedClients']
      ],
      raw: true
    });

    // 3. Leads Statistics
    const totalLeads = await Lead.count();
    const activeLeads = await Lead.count({
      where: { status: { [Op.ne]: 'converted' } }
    });
    const convertedLeads = await Lead.count({
      where: { status: 'converted' }
    });
    const newLeadsThisMonth = await Lead.count({
      where: {
        createdAt: { [Op.gte]: thisMonth }
      }
    });
    const hotLeads = await Lead.count({
      where: { priority: 'high' }
    });

    // Leads by status
    const leadsByStatus = await Lead.findAll({
      attributes: [
        'status',
        [Lead.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    // 4. Sales Statistics
    const totalSales = await Sale.count();
    const completedSales = await Sale.count({
      where: { status: 'completed' }
    });
    const salesThisMonth = await Sale.count({
      where: {
        status: 'completed',
        saleDate: { [Op.gte]: thisMonth }
      }
    });

    // Revenue statistics
    const revenueStats = await Sale.findAll({
      where: { status: 'completed' },
      attributes: [
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'totalRevenue'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('commission')), 'totalCommission'],
        [Sale.sequelize.fn('AVG', Sale.sequelize.col('price')), 'averageSaleValue'],
        [Sale.sequelize.fn('COUNT', '*'), 'totalCompletedSales']
      ],
      raw: true
    });

    const revenueThisMonth = await Sale.findAll({
      where: {
        status: 'completed',
        saleDate: { [Op.gte]: thisMonth }
      },
      attributes: [
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'monthlyRevenue'],
        [Sale.sequelize.fn('COUNT', '*'), 'monthlySales']
      ],
      raw: true
    });

    // Sales by person
    const salesByPerson = await Sale.findAll({
      where: { status: 'completed' },
      attributes: [
        'salesPerson',
        [Sale.sequelize.fn('COUNT', '*'), 'salesCount'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'totalValue'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('commission')), 'totalCommission']
      ],
      group: ['salesPerson'],
      order: [[Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'DESC']],
      limit: 10
    });

    // 5. Projects Statistics
    const totalProjects = await Project.count();
    const activeProjects = await Project.count({
      where: { status: 'active' }
    });
    const completedProjects = await Project.count({
      where: { status: 'completed' }
    });

    // 6. Tasks Statistics
    const totalTasks = await Task.count();
    const completedTasks = await Task.count({
      where: { status: 'completed' }
    });
    const overdueTasks = await Task.count({
      where: {
        dueDate: { [Op.lt]: today },
        status: { [Op.ne]: 'completed' }
      }
    });

    // 7. Recent Activities (Interactions)
    const recentInteractions = await Interaction.findAll({
      where: {
        createdAt: { [Op.gte]: today }
      },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'itemType', 'itemId', 'type', 'description', 'createdAt', 'createdBy']
    });

    // Today's interactions count
    const todayInteractions = await Interaction.count({
      where: {
        createdAt: { [Op.gte]: today }
      }
    });

    // 8. Monthly Trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthData = {
        month: monthStart.toLocaleString('ar-EG', { month: 'long', year: 'numeric' }),
        monthIndex: now.getMonth() - i,
        clients: await Client.count({
          where: {
            createdAt: { [Op.between]: [monthStart, monthEnd] }
          }
        }),
        leads: await Lead.count({
          where: {
            createdAt: { [Op.between]: [monthStart, monthEnd] }
          }
        }),
        sales: await Sale.count({
          where: {
            status: 'completed',
            saleDate: { [Op.between]: [monthStart, monthEnd] }
          }
        }),
        revenue: await Sale.sum('price', {
          where: {
            status: 'completed',
            saleDate: { [Op.between]: [monthStart, monthEnd] }
          }
        }) || 0
      };
      
      monthlyTrends.push(monthData);
    }

    // 9. Performance Metrics
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;
    const salesConversionRate = totalLeads > 0 ? ((completedSales / totalLeads) * 100) : 0;
    const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100) : 0;

    // 10. Response Time (mock for now - would need interaction timestamps in real implementation)
    const averageResponseTime = 2.5; // hours - mock data

    // Compile comprehensive stats
    const stats = {
      // Overview
      overview: {
        totalUsers,
        activeUsers,
        salesUsers,
        totalClients,
        totalLeads,
        activeLeads,
        totalSales: completedSales,
        totalProjects,
        totalTasks
      },

      // Users
      users: {
        total: totalUsers,
        active: activeUsers,
        salesTeam: salesUsers,
        inactiveUsers: totalUsers - activeUsers
      },

      // Clients
      clients: {
        totalClients,
        newThisMonth: newClientsThisMonth,
        averageRating: clientRatingStats[0]?.averageRating ? parseFloat(clientRatingStats[0].averageRating).toFixed(1) : 0,
        ratedClients: clientRatingStats[0]?.ratedClients || 0
      },

      // Leads
      leads: {
        totalLeads,
        activeLeads,
        convertedLeads,
        newThisMonth: newLeadsThisMonth,
        hotLeads,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        statusDistribution: leadsByStatus.reduce((acc, item) => {
          acc[item.dataValues.status] = parseInt(item.dataValues.count);
          return acc;
        }, {})
      },

      // Sales
      sales: {
        totalSales: completedSales,
        salesThisMonth,
        totalRevenue: parseFloat(revenueStats[0]?.totalRevenue || 0),
        monthlyRevenue: parseFloat(revenueThisMonth[0]?.monthlyRevenue || 0),
        averageSaleValue: parseFloat(revenueStats[0]?.averageSaleValue || 0),
        totalCommission: parseFloat(revenueStats[0]?.totalCommission || 0),
        salesConversionRate: parseFloat(salesConversionRate.toFixed(2)),
        topSalespeople: salesByPerson.map(person => ({
          name: person.dataValues.salesPerson,
          salesCount: parseInt(person.dataValues.salesCount),
          totalValue: parseFloat(person.dataValues.totalValue || 0),
          totalCommission: parseFloat(person.dataValues.totalCommission || 0)
        }))
      },

      // Projects
      projects: {
        totalProjects,
        activeProjects,
        completedProjects,
        completionRate: totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(2) : 0
      },

      // Tasks
      tasks: {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: parseFloat(taskCompletionRate.toFixed(2))
      },

      // Activity
      activity: {
        todayInteractions,
        recentInteractions: recentInteractions.map(interaction => ({
          id: interaction.id,
          type: interaction.type,
          itemType: interaction.itemType,
          itemId: interaction.itemId,
          description: interaction.description,
          createdAt: interaction.createdAt,
          createdBy: interaction.createdBy
        })),
        averageResponseTime
      },

      // Trends
      trends: {
        monthly: monthlyTrends
      },

      // Performance KPIs
      kpis: {
        conversionRate,
        salesConversionRate,
        taskCompletionRate,
        averageResponseTime,
        clientSatisfaction: clientRatingStats[0]?.averageRating ? parseFloat(clientRatingStats[0].averageRating) : 0
      }
    };

    console.log('✅ Manager statistics compiled successfully');
    const totalRevenue = parseFloat(revenueStats[0]?.totalRevenue || 0);
    console.log(`📊 Stats summary: ${totalClients} clients, ${totalLeads} leads, ${completedSales} sales, ${totalRevenue.toFixed(0)} revenue`);

    res.json({
      success: true,
      message: 'Manager statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting manager statistics:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الحصول على الإحصائيات',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get real-time activity feed
exports.getActivityFeed = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    console.log('📡 Getting activity feed...');
    
    // Get recent activities from different tables
    const activities = [];
    
    // Get all users for lookup
    const allUsers = await User.findAll({
      attributes: ['id', 'name']
    });
    const userLookup = {};
    allUsers.forEach(user => {
      userLookup[user.id] = user.name;
    });
    
    // Recent clients (last 7 days)
    const recentClients = await Client.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Recent leads (last 7 days)
    const recentLeads = await Lead.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Recent sales (last 7 days)
    const recentSales = await Sale.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Recent tasks (last 7 days)
    const recentTasks = await Task.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Convert to activity format
    recentClients.forEach(client => {
      const creatorName = userLookup[client.createdBy] || userLookup[client.assignedTo] || 'مستخدم غير معروف';
      activities.push({
        id: `client_${client.id}`,
        type: 'create',
        itemType: 'client',
        itemId: client.id,
        description: `عميل جديد: ${client.name}`,
        createdAt: client.createdAt,
        createdBy: creatorName,
        timeAgo: getTimeAgo(client.createdAt)
      });
    });
    
    recentLeads.forEach(lead => {
      const creatorName = userLookup[lead.createdBy] || userLookup[lead.assignedTo] || 'مستخدم غير معروف';
      activities.push({
        id: `lead_${lead.id}`,
        type: 'create',
        itemType: 'lead',
        itemId: lead.id,
        description: `عميل محتمل جديد: ${lead.name}`,
        createdAt: lead.createdAt,
        createdBy: creatorName,
        timeAgo: getTimeAgo(lead.createdAt)
      });
    });
    
    recentSales.forEach(sale => {
      activities.push({
        id: `sale_${sale.id}`,
        type: 'create',
        itemType: 'sale',
        itemId: sale.id,
        description: `مبيعة جديدة: ${sale.clientName} - ${sale.price} جنيه`,
        createdAt: sale.createdAt,
        createdBy: sale.salesPerson || 'نظام',
        timeAgo: getTimeAgo(sale.createdAt)
      });
    });
    
    recentTasks.forEach(task => {
      const creatorName = userLookup[task.createdBy] || task.assignedTo || 'مستخدم غير معروف';
      activities.push({
        id: `task_${task.id}`,
        type: 'create',
        itemType: 'task',
        itemId: task.id,
        description: `مهمة جديدة: ${task.title}`,
        createdAt: task.createdAt,
        createdBy: creatorName,
        timeAgo: getTimeAgo(task.createdAt)
      });
    });
    
    // Sort all activities by date
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const paginatedActivities = activities.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    console.log(`📡 Activity feed: ${activities.length} total activities, ${paginatedActivities.length} returned`);

    res.json({
      success: true,
      message: 'Activity feed retrieved successfully',
      data: {
        activities: paginatedActivities,
        pagination: {
          total: activities.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < activities.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting activity feed:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الحصول على تدفق الأنشطة',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  if (!date) return 'وقت غير معروف';
  
  const now = new Date();
  const activityDate = new Date(date);
  
  // Check if date is valid
  if (isNaN(activityDate.getTime())) {
    return 'وقت غير صحيح';
  }
  
  const diffInSeconds = Math.floor((now - activityDate) / 1000);
  
  if (diffInSeconds < 0) return 'الآن';
  if (diffInSeconds < 60) return `منذ ${diffInSeconds} ثانية`;
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  
  const days = Math.floor(diffInSeconds / 86400);
  return `منذ ${days} ${days === 1 ? 'يوم' : 'يوم'}`;
}

module.exports = exports;
