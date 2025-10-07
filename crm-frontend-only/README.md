# نظام إدارة علاقات العملاء (CRM) - الواجهة الأمامية فقط

هذا مشروع الواجهة الأمامية (Frontend Only) لنظام CRM العقاري، تم إنشاؤه بدون أي اعتمادية على Firebase أو أي backend خارجي.

## 🚀 المميزات

- ✅ واجهة مستخدم كاملة بدون backend
- ✅ بيانات تجريبية شاملة (عملاء، leads، مشاريع، مبيعات)
- ✅ نظام تسجيل دخول محاكي
- ✅ إدارة الحالات والأدوار
- ✅ لوحة تحكم بإحصائيات تفاعلية
- ✅ تصميم عربي متجاوب
- ✅ Abstraction layer جاهز للربط بأي backend

## 🔧 التقنيات المستخدمة

- **React 18** - مكتبة الواجهة الأمامية
- **Vite** - أداة البناء والتطوير
- **Tailwind CSS** - مكتبة التصميم
- **React Router** - التنقل بين الصفحات
- **React Hook Form** - إدارة النماذج
- **Chart.js & Recharts** - الرسوم البيانية
- **React Hot Toast** - التنبيهات
- **Lucide React** - الأيقونات

## 📁 هيكل المشروع

```
src/
├── components/          # المكونات القابلة لإعادة الاستخدام
├── pages/              # صفحات التطبيق
├── contexts/           # Context providers (Auth, Notifications)
├── hooks/              # Custom hooks للبيانات
├── lib/                # مكتبات مساعدة (API, Roles, Utils)
├── services/           # خدمات البيانات
├── data/               # البيانات التجريبية
├── utils/              # دوال مساعدة
└── styles/             # ملفات التصميم
```

## 🚀 تشغيل المشروع

### 1. تثبيت المتطلبات

```bash
npm install
```

### 2. تشغيل الخادم المحلي

```bash
npm run dev
```

سيفتح المشروع على: `http://localhost:5173`

### 3. بيانات تسجيل الدخول التجريبية

```
البريد الإلكتروني: admin@example.com
كلمة المرور: admin123
```

## 📊 البيانات التجريبية

يحتوي المشروع على بيانات تجريبية شاملة:

- **العملاء**: 5 عملاء بحالات مختلفة
- **العملاء المحتملين**: 4 leads بمراحل متنوعة  
- **المشاريع**: 3 مشاريع عقارية
- **المبيعات**: عمليات بيع مكتملة ومعلقة
- **المستخدمين**: فريق عمل بأدوار متنوعة
- **المهام والتذكيرات**: مهام يومية وتذكيرات
- **الإحصائيات**: بيانات للرسوم البيانية

## 🔧 Abstraction Layer

تم إنشاء طبقة abstraction في المجلدات التالية:

### `src/lib/api.js`
- محاكاة للـ APIs
- يمكن استبداله بـ REST API أو GraphQL
- يدعم authentication وإدارة الجلسات

### `src/services/dataService.js`
- خدمات البيانات المنظمة
- CRUD operations لكل entity
- Error handling موحد

### `src/hooks/useData.js`
- Custom hooks للبيانات
- State management محلي
- Loading وerror states

## 🔗 ربط Backend جديد

لربط backend جديد، يكفي تعديل الملفات التالية:

### 1. تحديث API Configuration

```javascript
// src/lib/api.js
const API_CONFIG = {
  baseUrl: 'https://your-api-url.com/api',
  timeout: 5000,
  enableMockData: false // تعطيل البيانات التجريبية
}
```

### 2. تحديث Authentication

```javascript
// src/lib/api.js - authAPI
login: async (email, password) => {
  const response = await fetch(`${API_CONFIG.baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  return response.json()
}
```

### 3. تحديث Database Operations

```javascript
// src/lib/api.js - dbAPI
getClients: async () => {
  const response = await fetch(`${API_CONFIG.baseUrl}/clients`)
  return response.json()
}
```

## 📱 الصفحات المتاحة

- **الداشبورد** - إحصائيات ورسوم بيانية
- **العملاء** - إدارة قاعدة العملاء
- **العملاء المحتملين** - متابعة الـ leads
- **المشاريع** - عرض المشاريع العقارية
- **المبيعات** - تتبع عمليات البيع
- **المستخدمين** - إدارة فريق العمل
- **المهام** - إدارة المهام اليومية
- **التذكيرات** - نظام التذكيرات
- **التقارير** - تقارير مفصلة
- **الإعدادات** - إعدادات النظام

## 🎨 التخصيص

### الألوان والتصميم

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          // ... your custom colors
        }
      }
    }
  }
}
```

### إضافة صفحات جديدة

1. إنشاء component في `src/pages/`
2. إضافة route في `src/App.jsx`
3. تحديث permissions في `src/lib/roles.js`

## 🔐 نظام الأدوار والصلاحيات

- **Admin** - صلاحيات كاملة
- **Sales Manager** - إدارة المبيعات والفريق
- **Sales Agent** - إدارة العملاء المخصصين
- **Marketing Specialist** - إدارة الـ leads والتسويق
- **Customer Service** - خدمة العملاء

## 📈 الأداء

- **React.memo** للمكونات المُحسنة
- **useMemo & useCallback** للحالات المعقدة
- **Code splitting** للصفحات
- **Lazy loading** للمكونات الثقيلة

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
npm test

# coverage report
npm run test:coverage
```

## 🚀 النشر

### Build للإنتاج

```bash
npm run build
```

### معاينة الـ build

```bash
npm run preview
```

## 📞 الدعم

للاستفسارات أو المساعدة، يرجى التواصل مع فريق التطوير.

---

**ملاحظة**: هذا المشروع جاهز للاستخدام كواجهة أمامية مستقلة ويمكن ربطه بأي backend لاحقاً.



