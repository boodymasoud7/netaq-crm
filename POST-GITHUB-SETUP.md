# 🚀 ما بعد رفع المشروع على GitHub - خطوات النشر

## 📋 الخطوات المطلوبة بعد رفع الكود

### 1️⃣ تحديث معلومات المشروع

بعد رفع المشروع على GitHub، حدث هذه الملفات:

#### في `README.md`:
```bash
# استبدل هذه الروابط بروابط مشروعك الفعلية:
- https://github.com/your-username/crm-system.git
- https://github.com/your-username/crm-system/issues
- https://github.com/your-username/crm-system/wiki
```

#### في `crm-backend/ecosystem.config.js`:
```javascript
repo: 'git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git'
// أو
repo: 'https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git'
```

#### في `package.json`:
```json
{
  "repository": {
    "url": "https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/YOUR_REPO_NAME#readme"
}
```

---

### 2️⃣ إعداد AWS EC2

#### تشغيل السكريبت على السيرفر:
```bash
# اتصل بسيرفر AWS
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP

# حمل وشغل سكريبت الإعداد
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO_NAME/main/scripts/quick-setup.sh
chmod +x quick-setup.sh
./quick-setup.sh

# أو مع كلمة مرور مخصصة لقاعدة البيانات:
./quick-setup.sh your_custom_db_password
```

---

### 3️⃣ إعداد GitHub Secrets

في صفحة المشروع على GitHub:
```
Settings → Secrets and variables → Actions → New repository secret
```

أضف هذه الأسرار:

| Secret Name | Value | مثال |
|-------------|-------|------|
| `EC2_HOST` | عنوان IP للسيرفر | `54.123.45.67` |
| `EC2_USER` | اسم المستخدم | `ubuntu` |
| `EC2_KEY` | محتوى private key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `EC2_PORT` | منفذ SSH (اختياري) | `22` |

#### كيفية الحصول على EC2_KEY:
```bash
# في جهازك المحلي:
cat your-aws-key.pem
# انسخ كامل المحتوى بما في ذلك البداية والنهاية
```

---

### 4️⃣ إعداد ملفات البيئة على السيرفر

#### نسخ إعدادات قاعدة البيانات:
```bash
# على سيرفر AWS
cd /home/ubuntu/crm/crm-backend
cp /home/ubuntu/crm/.env.production .env

# تحرير الملف إذا لزم الأمر
nano .env
```

#### إعداد Frontend environment:
```bash
cd /home/ubuntu/crm/crm-frontend-only
cat > .env << EOF
VITE_API_URL=http://$(curl -s http://checkip.amazonaws.com/):8000
VITE_API_BASE_URL=http://$(curl -s http://checkip.amazonaws.com/):8000/api
NODE_ENV=production
VITE_NODE_ENV=production
EOF
```

---

### 5️⃣ أول نشر يدوي (إذا لزم الأمر)

```bash
# على سيرفر AWS
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git crm

cd crm/crm-backend
npm install --only=production
npx sequelize-cli db:migrate --env production
npx sequelize-cli db:seed --seed 20250831192643-admin-user.js --env production

cd ../crm-frontend-only  
npm install
npm run build

cd ../crm-backend
pm2 start ecosystem.config.js --env production
pm2 save

sudo systemctl reload nginx
```

---

### 6️⃣ اختبار النشر التلقائي

```bash
# في مشروعك المحلي:
echo "Test auto-deploy" >> test.txt
git add .
git commit -m "Test: Auto-deployment"
git push origin main

# راقب GitHub Actions:
# https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions
```

---

### 7️⃣ الدخول للنظام

بعد اكتمال النشر:
```
الرابط: http://YOUR_SERVER_IP
المستخدم: admin
كلمة المرور: Admin123!
```

---

### 8️⃣ إعداد الدومين و SSL (اختياري)

#### ربط دومين:
```bash
# في إعدادات DNS، أضف A record:
your-domain.com → YOUR_SERVER_IP
```

#### تثبيت SSL:
```bash
# على السيرفر
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# تحديث frontend URL
nano /home/ubuntu/crm/crm-backend/.env
# FRONTEND_URL=https://your-domain.com

pm2 restart crm-backend
```

---

### 9️⃣ مراقبة النظام

```bash
# فحص حالة الخدمات
./status.sh

# مراقبة PM2
pm2 monit

# عرض logs
pm2 logs crm-backend

# إعادة تشغيل إذا لزم
pm2 restart crm-backend
```

---

### 🔟 مشاكل شائعة وحلولها

#### GitHub Actions فشل:
```bash
# تأكد من صحة secrets
# تحقق من وجود المجلدات على السيرفر:
ls -la /home/ubuntu/crm
```

#### Backend لا يعمل:
```bash
# تحقق من logs
pm2 logs crm-backend

# تأكد من قاعدة البيانات
sudo -u postgres psql -c "SELECT 1;"

# إعادة تشغيل
pm2 restart crm-backend
```

#### Frontend لا يحمل:
```bash
# تأكد من بناء الملفات
ls -la /home/ubuntu/crm/crm-frontend-only/dist/

# إعادة البناء
cd /home/ubuntu/crm/crm-frontend-only
npm run build

# إعادة تشغيل nginx
sudo systemctl reload nginx
```

---

## ✅ **Checklist النهائي**

- [ ] رفع الكود على GitHub
- [ ] تحديث الروابط في الملفات
- [ ] تشغيل quick-setup.sh على AWS
- [ ] إضافة GitHub Secrets
- [ ] إعداد ملفات البيئة
- [ ] اختبار النشر التلقائي
- [ ] تسجيل الدخول للنظام
- [ ] إعداد الدومين (اختياري)
- [ ] اختبار جميع الوظائف

---

## 🎉 **مبروك! نظام CRM جاهز للعمل** 

العمل فقط المطلوب الآن:
1. **كود جديد** → `git push`
2. **انتظار دقيقتين** → GitHub Actions يعمل
3. **النظام محدث تلقائياً** → زيارة الموقع

**نظام نشر احترافي 100%! 🚀**
