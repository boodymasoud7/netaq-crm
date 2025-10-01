'use strict';

module.exports = (sequelize, DataTypes) => {
  const Reminder = sequelize.define('Reminder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'نص التذكير مطلوب'
        },
        len: {
          args: [1, 1000],
          msg: 'نص التذكير يجب أن يكون بين 1 و 1000 حرف'
        }
      }
    },
    remind_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'remind_at',
      validate: {
        isDate: {
          msg: 'تاريخ التذكير يجب أن يكون تاريخاً صحيحاً'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'done'),
      defaultValue: 'pending',
      allowNull: false,
      validate: {
        isIn: {
          args: [['pending', 'done']],
          msg: 'حالة التذكير يجب أن تكون pending أو done'
        }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      field: 'updated_at'
    }
  }, {
    tableName: 'reminders',
    timestamps: false, // نحن نستخدم created_at و updated_at يدوياً
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['remind_at']
      },
      {
        fields: ['user_id', 'status']
      }
    ],
    hooks: {
      beforeUpdate: (reminder) => {
        reminder.updated_at = new Date();
      }
    }
  });

  // تعريف العلاقات
  Reminder.associate = function(models) {
    // علاقة مع المستخدم
    Reminder.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  // دوال مساعدة للنموذج
  Reminder.findPendingReminders = async function() {
    return await this.findAll({
      where: {
        status: 'pending',
        remind_at: {
          [sequelize.Sequelize.Op.lte]: new Date()
        }
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['remind_at', 'ASC']]
    });
  };

  Reminder.findUserReminders = async function(userId, options = {}) {
    const where = { user_id: userId };
    
    if (options.status) {
      where.status = options.status;
    }
    
    if (options.from) {
      where.remind_at = {
        ...where.remind_at,
        [sequelize.Sequelize.Op.gte]: options.from
      };
    }
    
    if (options.to) {
      where.remind_at = {
        ...where.remind_at,
        [sequelize.Sequelize.Op.lte]: options.to
      };
    }

    return await this.findAll({
      where,
      order: [['remind_at', options.order || 'DESC']],
      limit: options.limit || 50,
      offset: options.offset || 0
    });
  };

  Reminder.markAsDone = async function(id, userId) {
    const reminder = await this.findOne({
      where: {
        id,
        user_id: userId
      }
    });

    if (!reminder) {
      throw new Error('التذكير غير موجود');
    }

    if (reminder.status === 'done') {
      throw new Error('التذكير منجز بالفعل');
    }

    reminder.status = 'done';
    reminder.updated_at = new Date();
    await reminder.save();

    return reminder;
  };

  Reminder.createReminder = async function(data) {
    // التحقق من أن التاريخ في المستقبل
    const remindAt = new Date(data.remind_at);
    const now = new Date();
    
    if (remindAt <= now) {
      throw new Error('تاريخ التذكير يجب أن يكون في المستقبل');
    }

    return await this.create({
      user_id: data.user_id,
      note: data.note,
      remind_at: remindAt,
      status: 'pending'
    });
  };

  return Reminder;
};