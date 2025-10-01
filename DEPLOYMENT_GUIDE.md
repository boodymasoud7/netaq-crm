# 🚀 دليل النشر والتطوير المستمر - CRM System

## 📋 نظرة عامة

هذا النظام مجهز بالكامل للنشر التلقائي على AWS EC2 مع إمكانية التطوير المستمر.

### ✅ المميزات المتاحة:
- 🔄 **نشر تلقائي** مع كل push للـ main branch
- 🛡️ **نسخ احتياطية** قبل كل تحديث  
- ⚡ **Zero downtime** لا توقف للموقع
- 🔄 **Rollback سريع** في حالة المشاكل
- 📊 **مراقبة الأداء** مع PM2
- 🔐 **أمان متقدم** مع Nginx + SSL

---

## 🛠️ الإعداد الأولي

### 1. إعداد AWS EC2

```bash
# اختر Ubuntu 22.04 LTS
# Instance Type: t3.micro أو أكبر
# Security Group: ports 22, 80, 443, 8000
```

### 2. إعداد السيرفر

```bash
# اتصل بالسيرفر
ssh -i your-key.pem ubuntu@your-ec2-ip

# شغل script الإعداد
curl -o setup-server.sh https://raw.githubusercontent.com/your-repo/scripts/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh your-db-password
```

### 3. إعداد GitHub Repository

```bash
# في GitHub Repository Settings > Secrets:
EC2_HOST = your-ec2-ip-address
EC2_USER = ubuntu  
EC2_KEY = your-private-key-content
```

---

## 🚀 النشر التلقائي

### كيف يعمل:

1. **تعديل محلي** → `git push origin main`
2. **GitHub Actions** → ينشر تلقائياً
3. **نسخة احتياطية** → يتم إنشاؤها قبل النشر
4. **تحديث السيرفر** → frontend + backend
5. **اختبار صحة** → يتأكد من عمل النظام

### المراحل التفصيلية:

```yaml
✅ 1. Checkout code
✅ 2. Install dependencies  
✅ 3. Build frontend
✅ 4. Create backup
✅ 5. Deploy to server
✅ 6. Run migrations
✅ 7. Start services
✅ 8. Health check
```

---

## 🔧 التطوير اليومي

### سير العمل:

```bash
# 1. تعديل الكود محلياً
git add .
git commit -m "Add new feature"

# 2. push → النشر التلقائي
git push origin main

# 3. مراقبة النشر في GitHub Actions
# 4. اختبار الموقع المحدث
```

### أوامر مفيدة على السيرفر:

```bash
# مراقبة الحالة
~/status.sh

# نشر سريع (إذا GitHub Actions معطل)
~/quick-deploy.sh

# مراقبة logs
pm2 logs crm-backend

# إعادة تشغيل
pm2 restart crm-backend
```

---

## 🛡️ النسخ الاحتياطية

### تلقائياً:
- ✅ **يومياً الساعة 3 ص** → Google Drive  
- ✅ **قبل كل نشر** → Local backup
- ✅ **الاحتفاظ بـ 7 نسخ** → تنظيف تلقائي

### يدوياً:
```bash
# نسخة احتياطية فورية
cd /home/ubuntu/crm/crm-backend
npm run backup

# استعادة نسخة احتياطية
~/crm/scripts/rollback.sh 20231201_140500
```

---

## 🔄 إدارة المشاكل

### إذا فشل النشر:

```bash
# 1. شاهد logs الخطأ
pm2 logs crm-backend

# 2. Rollback لآخر نسخة سليمة
~/crm/scripts/rollback.sh

# 3. أصلح المشكلة محلياً وادفع مرة أخرى
```

### مراقبة الأداء:

```bash
# حالة النظام
pm2 monit

# استخدام الذاكرة
free -h

# مساحة القرص
df -h

# نشاط قاعدة البيانات
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

---

## 🌐 إعداد الدومين و SSL

### ربط الدومين:

```bash
# 1. في DNS، أشر A record لـ EC2 IP
your-domain.com → your-ec2-ip

# 2. حديث nginx config
sudo nano /etc/nginx/sites-available/crm
# غير your-domain.com للدومين الحقيقي

# 3. تفعيل SSL
sudo certbot --nginx -d your-domain.com
```

### تحديث environment:

```bash
# حديث frontend URL
nano /home/ubuntu/.env
FRONTEND_URL=https://your-domain.com

# أعد تشغيل
pm2 restart crm-backend
```

---

## 📊 مراقبة قاعدة البيانات

### الاتصال بـ pgAdmin:

```
Host: your-ec2-ip
Port: 5432
Database: crm_production  
Username: crmadmin
Password: your-password
```

### اتصال آمن عبر SSH:

```bash
# Local terminal
ssh -L 5432:localhost:5432 ubuntu@your-ec2-ip

# ثم في pgAdmin:
Host: localhost
Port: 5432
```

---

## 🔧 استكشاف الأخطاء

### مشاكل شائعة:

| المشكلة | الحل |
|---------|-----|
| 502 Bad Gateway | `pm2 restart crm-backend` |
| Database connection | تأكد من PostgreSQL يعمل |
| Permission denied | `sudo chown -R ubuntu:ubuntu /home/ubuntu/crm` |
| Out of memory | زود حجم EC2 instance |
| SSL expired | `sudo certbot renew` |

### فحص شامل:

```bash
# فحص الخدمات
sudo systemctl status nginx postgresql

# فحص PM2
pm2 list

# فحص الشبكة
netstat -tlnp | grep :8000

# فحص logs
tail -f /var/log/nginx/error.log
pm2 logs crm-backend --lines 50
```

---

## 📱 إعدادات إضافية

### إشعارات Slack:

```bash
# أضف في .env
SLACK_WEBHOOK=https://hooks.slack.com/your-webhook

# سيرسل إشعار مع كل نشر ناجح
```

### مراقبة متقدمة:

```bash
# إعداد Grafana (اختياري)
# إعداد New Relic (اختياري)  
# إعداد DataDog (اختياري)
```

---

## 🎯 الخلاصة

### للتطوير اليومي:
1. ✏️ **عدل محلياً** 
2. 📤 **git push**
3. ⏱️ **انتظر دقيقتين**
4. ✅ **اختبر الموقع**

### للطوارئ:
1. 🚨 **rollback فوري**
2. 🔍 **تشخيص المشكلة**  
3. 🛠️ **إصلاح محلي**
4. 🚀 **نشر جديد**

**النظام مجهز بالكامل للعمل الاحترافي! 🎉**

---

## 📞 دعم إضافي

### ملفات مهمة:
- 📄 `/home/ubuntu/.env` - إعدادات البيئة
- 📄 `/home/ubuntu/crm/scripts/` - Scripts مفيدة
- 📄 `/var/log/nginx/` - logs الـ web server
- 📄 `/home/ubuntu/crm/logs/` - logs التطبيق

### أوامر سريعة:
```bash
# حالة عامة
~/status.sh

# نشر سريع  
~/quick-deploy.sh

# مراقبة فورية
pm2 monit

# logs فورية
pm2 logs --lines 100
```





