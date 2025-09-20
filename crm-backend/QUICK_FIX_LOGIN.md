# 🔧 حل سريع لمشكلة تسجيل الدخول

## المشكلة:
خطأ 401 - Invalid email or password عند محاولة تسجيل الدخول

## الحلول السريعة:

### 1. جرب الحسابات الافتراضية:
```
📧 admin@crm.com
🔑 admin123
```
أو
```
📧 manager@crm.com  
🔑 manager123
```

### 2. إنشاء المستخدم يدوياً:

**تشغيل هذا الأمر في PowerShell Admin:**

```powershell
cd "D:\New folder\test\last\backup vercel\last update\crm-backend"

# إنشاء ملف SQL لإدخال المستخدم
@"
INSERT INTO users (name, email, password, role, phone, "isActive", created_at, updated_at) 
VALUES (
  'المدير الرئيسي', 
  'boodymasoud9@gmail.com', 
  '$2b$10$rOvRoi5mJ/a45Bs/oG.cceY1qm2TQOm3GQhJlpE25tQPE1pjE4.7W', 
  'admin', 
  '+201234567890', 
  true, 
  NOW(), 
  NOW()
);
"@ | Out-File -Encoding UTF8 create_admin.sql

echo "ملف SQL تم إنشاؤه - استخدم أي PostgreSQL client لتنفيذه"
```

### 3. إعادة تشغيل سريعة:

```bash
# إيقاف الخادم
Get-Process -Name "node" | Stop-Process -Force

# تشغيل الخادم مرة أخرى  
cd "D:\New folder\test\last\backup vercel\last update\crm-backend"
npm start
```

### 4. كلمة المرور المشفرة:
- كلمة المرور `sales123` المشفرة: `$2b$10$rOvRoi5mJ/a45Bs/oG.cceY1qm2TQOm3GQhJlpE25tQPE1pjE4.7W`

## بعد إنشاء المستخدم:
```
📧 البريد: boodymasoud9@gmail.com
🔑 كلمة المرور: sales123
```

## في حالة استمرار المشكلة:
1. تحقق من أن الخادم يعمل على المنفذ 8000
2. تحقق من إعدادات قاعدة البيانات
3. امسح cache المتصفح
4. جرب في نافذة متصفح خاصة (Incognito)







