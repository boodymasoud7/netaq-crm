# 🏢 نظام نطاق لإدارة علاقات العملاء - Netaq CRM System

<div align="center">

![Netaq CRM](https://img.shields.io/badge/Netaq-CRM%20System-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)
![AWS](https://img.shields.io/badge/AWS-EC2-orange)
![Build Status](https://github.com/boodymasoud7/netaq-crm/workflows/Deploy%20to%20AWS%20EC2/badge.svg)

**نظام نطاق المتكامل لإدارة العقارات والعملاء مع نشر تلقائي على AWS**

🌐 **الموقع**: [www.netaqcrm.site](https://www.netaqcrm.site)

[🚀 التثبيت](#-التثبيت) • [📖 الاستخدام](#-الاستخدام) • [🔧 النشر](#-النشر) • [📝 المساهمة](#-المساهمة)

</div>

---

## 📋 نظرة عامة

نظام CRM متقدم مصمم خصيصاً لشركات العقارات، يوفر إدارة شاملة للعملاء والعقارات والمتابعات مع واجهة عربية سهلة الاستخدام.

### ✨ المميزات الرئيسية

- 👥 **إدارة العملاء**: قاعدة بيانات شاملة للعملاء الحاليين والمحتملين
- 🏠 **إدارة العقارات**: كتالوج تفاعلي للعقارات والوحدات  
- 📞 **نظام المتابعات**: جدولة وإدارة المكالمات والاجتماعات
- 💰 **إدارة المبيعات**: تتبع الصفقات وحساب العمولات
- 📊 **التقارير والتحليلات**: رؤى ذكية حول الأداء
- 🗺️ **الخرائط التفاعلية**: عرض المشاريع على WikiMapia
- 💬 **واتساب للأعمال**: إرسال العروض والمتابعة
- 🧮 **حاسبة التمويل**: حساب الأقساط والفوائد

---

## 🏗️ البنية التقنية

### Backend (API)
- **Node.js** + Express.js
- **PostgreSQL** قاعدة بيانات
- **Sequelize** ORM
- **JWT** المصادقة والأمان
- **PM2** إدارة العمليات

### Frontend (React)
- **React 18** + **Vite**
- **Tailwind CSS** التصميم
- **React Router** التنقل
- **Chart.js** الرسوم البيانية
- **Lucide React** الأيقونات

### DevOps & Deployment
- **AWS EC2** الاستضافة
- **Nginx** خادم الويب
- **GitHub Actions** النشر التلقائي
- **Let's Encrypt** شهادات SSL

---

## 🚀 التثبيت

### 1️⃣ متطلبات النظام

```bash
- Node.js 18+
- PostgreSQL 14+
- Git
- AWS EC2 Instance (Ubuntu 22.04)
```

### 2️⃣ استنساخ المشروع

```bash
git clone https://github.com/your-username/crm-system.git
cd crm-system
```

### 3️⃣ إعداد قاعدة البيانات

```bash
# إنشاء قاعدة البيانات
sudo -u postgres createdb crm_production
sudo -u postgres createuser crmadmin
sudo -u postgres psql -c "ALTER USER crmadmin PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crm_production TO crmadmin;"
```

### 4️⃣ إعداد Backend

```bash
cd crm-backend

# تثبيت التبعيات
npm install

# نسخ وتحرير ملف البيئة
cp ../scripts/env.template .env
nano .env  # أضف بيانات قاعدة البيانات الخاصة بك

# تشغيل Migrations
npx sequelize-cli db:migrate

# إنشاء مستخدم المدير
npx sequelize-cli db:seed --seed 20250831192643-admin-user.js

# تشغيل الخادم
npm start
```

### 5️⃣ إعداد Frontend

```bash
cd crm-frontend-only

# تثبيت التبعيات
npm install

# نسخ ملف البيئة
cp ../scripts/frontend-env.example .env
nano .env  # أضف رابط API الخاص بك

# البناء للإنتاج
npm run build

# تشغيل للتطوير
npm run dev
```

---

## 🔧 النشر على AWS

### 1️⃣ إعداد GitHub Secrets

في إعدادات مستودع GitHub، أضف هذه الأسرار:

```bash
EC2_HOST = your-ec2-ip-address
EC2_USER = ubuntu
EC2_KEY = your-private-key-content
EC2_PORT = 22
```

### 2️⃣ إعداد السيرفر

```bash
# اتصل بسيرفر AWS
ssh -i your-key.pem ubuntu@your-ec2-ip

# شغل سكريبت الإعداد
curl -o setup-server.sh https://raw.githubusercontent.com/your-repo/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh your-db-password
```

### 3️⃣ النشر التلقائي

بعد الإعداد، كل `git push` للفرع الرئيسي سيقوم بـ:

- ✅ تثبيت التبعيات
- ✅ بناء التطبيق  
- ✅ إنشاء نسخة احتياطية
- ✅ نشر الكود الجديد
- ✅ تشغيل Migrations
- ✅ إعادة تشغيل الخدمات
- ✅ فحص صحة النظام

---

## 📖 الاستخدام

### 🔑 تسجيل الدخول الأولي

```
المستخدم: admin
كلمة المرور: Admin123!
الرابط: http://your-server-ip:8000
```

### 📱 الوظائف الرئيسية

1. **لوحة التحكم**: نظرة عامة على الإحصائيات
2. **العملاء**: إدارة قاعدة بيانات العملاء
3. **العملاء المحتملون**: تتبع الفرص الجديدة
4. **المتابعات**: جدولة المكالمات والاجتماعات
5. **المبيعات**: إدارة الصفقات والعقود
6. **المشاريع**: كتالوج العقارات والوحدات
7. **التقارير**: تحليلات وإحصائيات مفصلة

### 🔐 إدارة المستخدمين

- **مدير**: صلاحيات كاملة
- **موظف مبيعات**: إدارة العملاء والمتابعات
- **محاسب**: الوصول للتقارير المالية

---

## 🔍 مراقبة النظام

### صحة النظام

```bash
# فحص حالة الخدمات
pm2 list
sudo systemctl status nginx postgresql

# مراقبة الأداء
pm2 monit

# عرض السجلات
pm2 logs crm-backend
sudo tail -f /var/log/nginx/error.log
```

### النسخ الاحتياطية

```bash
# نسخة احتياطية يدوية
cd /home/ubuntu/crm/crm-backend
npm run backup

# استعادة نسخة احتياطية
~/crm/scripts/rollback.sh 20231201_140500
```

---

## 🔧 التطوير

### تشغيل البيئة المحلية

```bash
# Backend
cd crm-backend
npm run dev

# Frontend (في terminal منفصل)
cd crm-frontend-only  
npm run dev
```

### إضافة ميزات جديدة

1. **إنشاء فرع جديد**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **تطوير الميزة** في `crm-backend` و `crm-frontend-only`

3. **اختبار محلي**:
   ```bash
   npm test  # إذا توفر
   ```

4. **رفع التغييرات**:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

5. **إنشاء Pull Request** على GitHub

---

## 📊 API Documentation

### Base URL
```
Production: http://your-server-ip:8000/api
Development: http://localhost:8000/api
```

### Authentication
```bash
# تسجيل الدخول
POST /api/auth/login
Content-Type: application/json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}

# استخدام التوكن
Authorization: Bearer YOUR_JWT_TOKEN
```

### أمثلة على API Endpoints

```bash
# العملاء
GET    /api/clients              # جميع العملاء
POST   /api/clients              # إضافة عميل جديد
GET    /api/clients/:id          # عميل محدد
PUT    /api/clients/:id          # تحديث عميل
DELETE /api/clients/:id          # حذف عميل

# المتابعات
GET    /api/follow-ups           # جميع المتابعات
POST   /api/follow-ups           # إضافة متابعة جديدة
PUT    /api/follow-ups/:id       # تحديث متابعة

# المبيعات
GET    /api/sales               # جميع المبيعات
POST   /api/sales               # إضافة صفقة جديدة
```

---

## 🛠️ استكشاف الأخطاء

### مشاكل شائعة

| المشكلة | السبب | الحل |
|---------|-------|-----|
| 502 Bad Gateway | الخادم الخلفي متوقف | `pm2 restart crm-backend` |
| Database connection error | قاعدة البيانات متوقفة | `sudo systemctl restart postgresql` |
| Frontend لا يحمل | مشاكل في البناء | `cd crm-frontend-only && npm run build` |
| SSL Certificate expired | شهادة SSL منتهية | `sudo certbot renew` |

### سجلات مفيدة

```bash
# سجلات التطبيق
pm2 logs crm-backend --lines 50

# سجلات Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# سجلات قاعدة البيانات
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 📝 المساهمة

نرحب بمساهماتكم! يرجى اتباع هذه الخطوات:

1. **Fork** المشروع
2. إنشاء **فرع للميزة الجديدة** (`git checkout -b feature/AmazingFeature`)
3. **Commit** التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. **Push** للفرع (`git push origin feature/AmazingFeature`)
5. فتح **Pull Request**

### معايير المساهمة

- كود نظيف ومعلق عليه
- اختبار الميزات الجديدة
- توثيق التغييرات في CHANGELOG.md
- اتباع نمط الكود الموجود

---

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

## 👥 الفريق

- **المطور الرئيسي**: [اسمك هنا]
- **فريق المساهمين**: [قائمة المساهمين]

---

## 📞 الدعم

- 📧 **البريد الإلكتروني**: support@your-domain.com
- 🐛 **تقرير الأخطاء**: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 **الوثائق**: [Wiki](https://github.com/your-repo/wiki)

---

## 🔄 سجل التغييرات

### الإصدار 1.0.0 (2025-01-01)
- ✅ إصدار أولي مع جميع المميزات الأساسية
- ✅ نشر تلقائي على AWS
- ✅ واجهة مستخدم عربية كاملة
- ✅ نظام مصادقة وتخويل
- ✅ تكامل مع خرائط WikiMapia

---

<div align="center">

**مع تحيات فريق التطوير** 🚀

Made with ❤️ for Real Estate CRM

</div>
