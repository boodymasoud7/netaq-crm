const EventEmitter = require('events');

class NotificationEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // دعم عدد أكبر من الاتصالات
  }

  // إرسال إشعار تحويل عميل محتمل
  emitLeadConverted(data) {
    console.log('📡 Emitting leadConverted event:', data);
    this.emit('leadConverted', data);
  }

  // إرسال إشعار عميل جديد
  emitNewLead(data) {
    console.log('📡 Emitting newLead event:', data);
    this.emit('newLead', data);
  }

  // إرسال إشعار عميل فعلي جديد
  emitNewClient(data) {
    console.log('📡 Emitting newClient event:', data);
    this.emit('newClient', data);
  }

  // إرسال إشعار عام للمديرين
  emitManagerNotification(data) {
    console.log('📡 Emitting managerNotification event:', data);
    this.emit('managerNotification', data);
  }
}

// إنشاء instance واحد للتطبيق كله
const notificationEmitter = new NotificationEmitter();

module.exports = notificationEmitter;




