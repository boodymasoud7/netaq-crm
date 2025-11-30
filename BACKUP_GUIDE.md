# 💾 دليل النسخ الاحتياطي الشامل

## 📋 المحتويات
1. [نسخ احتياطي من GitHub](#1-نسخ-احتياطي-من-github)
2. [نسخ احتياطي من السيرفر AWS](#2-نسخ-احتياطي-من-السيرفر-aws)
3. [نسخ احتياطي لقاعدة البيانات](#3-نسخ-احتياطي-لقاعدة-البيانات)
4. [نسخ احتياطي شامل (كل شيء)](#4-نسخ-احتياطي-شامل)

---

## 1️⃣ نسخ احتياطي من GitHub (الأسهل والأسرع) ⭐

### الطريقة الأولى: Clone من GitHub
```bash
# انتقل للمجلد الذي تريد حفظ النسخة فيه
cd D:\Backups

# استنسخ المشروع بالكامل
git clone https://github.com/boodymasoud7/netaq-crm.git netaq-crm-backup-$(date +%Y%m%d)

# أو بدون Git history (أصغر حجماً)
git clone --depth 1 https://github.com/boodymasoud7/netaq-crm.git netaq-crm-backup-$(date +%Y%m%d)
```

### الطريقة الثانية: تحميل ZIP من GitHub
```
1. افتح: https://github.com/boodymasoud7/netaq-crm
2. اضغط على زر "Code" (الأخضر)
3. اختر "Download ZIP"
4. احفظ الملف في مكان آمن
```

---

## 2️⃣ نسخ احتياطي من السيرفر AWS

### أ) نسخ الكود فقط (Source Code)

#### الطريقة 1: باستخدام SCP (موصى بها)
```bash
# نسخ المشروع بالكامل من السيرفر
scp -i "your-key.pem" -r ubuntu@your-ec2-ip:/home/ubuntu/crm "D:\Backups\crm-server-backup-$(date +%Y%m%d)"

# أو إذا كنت تعرف الـ IP
scp -i "your-key.pem" -r ubuntu@YOUR_SERVER_IP:/home/ubuntu/crm D:\Backups\crm-server-backup
```

#### الطريقة 2: باستخدام rsync (أسرع للملفات الكبيرة)
```bash
# نسخ مع الحفاظ على الصلاحيات
rsync -avz -e "ssh -i your-key.pem" ubuntu@your-ec2-ip:/home/ubuntu/crm/ D:\Backups\crm-server-backup\

# مع شريط تقدم
rsync -avz --progress -e "ssh -i your-key.pem" ubuntu@your-ec2-ip:/home/ubuntu/crm/ D:\Backups\crm-server-backup\
```

### ب) نسخ ملفات محددة فقط

#### نسخ Frontend فقط:
```bash
scp -i "your-key.pem" -r ubuntu@your-ec2-ip:/home/ubuntu/crm/crm-frontend-only D:\Backups\frontend-backup
```

#### نسخ Backend فقط:
```bash
scp -i "your-key.pem" -r ubuntu@your-ec2-ip:/home/ubuntu/crm/crm-backend D:\Backups\backend-backup
```

#### نسخ ملفات الإعدادات:
```bash
# نسخ .env files
scp -i "your-key.pem" ubuntu@your-ec2-ip:/home/ubuntu/crm/crm-backend/.env D:\Backups\env-files\backend.env
scp -i "your-key.pem" ubuntu@your-ec2-ip:/home/ubuntu/crm/crm-frontend-only/.env D:\Backups\env-files\frontend.env
```

---

## 3️⃣ نسخ احتياطي لقاعدة البيانات PostgreSQL

### أ) من السيرفر مباشرة

#### الطريقة 1: نسخ احتياطي كامل
```bash
# اتصل بالسيرفر أولاً
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# أنشئ نسخة احتياطية من قاعدة البيانات
sudo -u postgres pg_dump crm_production > ~/crm_backup_$(date +%Y%m%d_%H%M%S).sql

# أو مع الضغط
sudo -u postgres pg_dump crm_production | gzip > ~/crm_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# ثم انسخها لجهازك
exit
scp -i "your-key.pem" ubuntu@your-ec2-ip:~/crm_backup_*.sql.gz D:\Backups\database\
```

#### الطريقة 2: نسخ احتياطي بصيغة custom (أفضل للاستعادة)
```bash
# على السيرفر
ssh -i "your-key.pem" ubuntu@your-ec2-ip
sudo -u postgres pg_dump -Fc crm_production > ~/crm_backup_$(date +%Y%m%d).dump

# انسخها لجهازك
exit
scp -i "your-key.pem" ubuntu@your-ec2-ip:~/crm_backup_*.dump D:\Backups\database\
```

### ب) باستخدام النظام المدمج في المشروع

المشروع لديه نظام نسخ احتياطي مدمج!

```bash
# اتصل بالسيرفر
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# انتقل لمجلد المشروع
cd ~/crm/crm-backend

# أنشئ نسخة احتياطية
npm run backup
# أو
node src/services/localBackupService.js

# النسخ الاحتياطية محفوظة في
ls -lh ~/crm/crm-backend/backups/

# انسخها لجهازك
exit
scp -i "your-key.pem" -r ubuntu@your-ec2-ip:/home/ubuntu/crm/crm-backend/backups D:\Backups\
```

---

## 4️⃣ نسخ احتياطي شامل (كل شيء) 🎯

### سكريبت شامل لنسخ كل شيء:

```bash
#!/bin/bash
# احفظ هذا في ملف backup-all.sh

# المتغيرات
SERVER_IP="your-ec2-ip"
KEY_FILE="your-key.pem"
BACKUP_DIR="D:\Backups\full-backup-$(date +%Y%m%d_%H%M%S)"

echo "🚀 بدء النسخ الاحتياطي الشامل..."

# 1. إنشاء مجلد النسخة الاحتياطية
mkdir -p "$BACKUP_DIR"

# 2. نسخ الكود من GitHub
echo "📦 نسخ من GitHub..."
git clone --depth 1 https://github.com/boodymasoud7/netaq-crm.git "$BACKUP_DIR/github-source"

# 3. نسخ الكود من السيرفر
echo "🖥️ نسخ من السيرفر..."
scp -i "$KEY_FILE" -r ubuntu@$SERVER_IP:/home/ubuntu/crm "$BACKUP_DIR/server-source"

# 4. نسخ قاعدة البيانات
echo "💾 نسخ قاعدة البيانات..."
ssh -i "$KEY_FILE" ubuntu@$SERVER_IP "sudo -u postgres pg_dump crm_production | gzip > /tmp/db_backup.sql.gz"
scp -i "$KEY_FILE" ubuntu@$SERVER_IP:/tmp/db_backup.sql.gz "$BACKUP_DIR/database.sql.gz"
ssh -i "$KEY_FILE" ubuntu@$SERVER_IP "rm /tmp/db_backup.sql.gz"

# 5. نسخ ملفات الإعدادات
echo "⚙️ نسخ ملفات الإعدادات..."
mkdir -p "$BACKUP_DIR/configs"
scp -i "$KEY_FILE" ubuntu@$SERVER_IP:/home/ubuntu/crm/crm-backend/.env "$BACKUP_DIR/configs/backend.env"
scp -i "$KEY_FILE" ubuntu@$SERVER_IP:/home/ubuntu/crm/crm-frontend-only/.env "$BACKUP_DIR/configs/frontend.env"

# 6. نسخ النسخ الاحتياطية الموجودة
echo "📂 نسخ النسخ الاحتياطية الموجودة..."
scp -i "$KEY_FILE" -r ubuntu@$SERVER_IP:/home/ubuntu/crm/crm-backend/backups "$BACKUP_DIR/existing-backups"

# 7. نسخ uploads (إذا وجدت)
echo "📸 نسخ الملفات المرفوعة..."
scp -i "$KEY_FILE" -r ubuntu@$SERVER_IP:/home/ubuntu/crm/crm-backend/uploads "$BACKUP_DIR/uploads" 2>/dev/null || echo "لا توجد uploads"

# 8. إنشاء ملف معلومات
echo "📝 إنشاء ملف المعلومات..."
cat > "$BACKUP_DIR/backup-info.txt" << EOF
===========================================
نسخة احتياطية شاملة - Netaq CRM
===========================================
التاريخ: $(date)
السيرفر: $SERVER_IP
المشروع: netaq-crm

المحتويات:
- github-source/     : الكود من GitHub
- server-source/     : الكود من السيرفر
- database.sql.gz    : قاعدة البيانات
- configs/           : ملفات الإعدادات
- existing-backups/  : النسخ الاحتياطية السابقة
- uploads/           : الملفات المرفوعة

للاستعادة، راجع ملف RESTORE_GUIDE.md
===========================================
EOF

echo "✅ اكتمل النسخ الاحتياطي في: $BACKUP_DIR"
echo "📊 حجم النسخة الاحتياطية:"
du -sh "$BACKUP_DIR"
```

---

## 5️⃣ نسخ احتياطي تلقائي (Automated Backup)

### سكريبت للنسخ الاحتياطي اليومي التلقائي:

```bash
# على السيرفر
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# أنشئ سكريبت النسخ الاحتياطي
cat > ~/daily-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# إنشاء مجلد النسخ الاحتياطية
mkdir -p $BACKUP_DIR

# نسخ قاعدة البيانات
sudo -u postgres pg_dump crm_production | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# نسخ الكود
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /home/ubuntu/crm

# حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup completed: $DATE"
EOF

# اجعل السكريبت قابل للتنفيذ
chmod +x ~/daily-backup.sh

# أضفه لـ crontab (يومياً الساعة 2 صباحاً)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/daily-backup.sh >> /home/ubuntu/backup.log 2>&1") | crontab -

echo "✅ تم إعداد النسخ الاحتياطي التلقائي اليومي"
```

---

## 6️⃣ نسخ احتياطي سريع (Quick Backup)

### للنسخ السريع في حالة الطوارئ:

```bash
# نسخ كل شيء في أمر واحد
ssh -i "your-key.pem" ubuntu@your-ec2-ip "cd ~ && tar -czf emergency-backup-$(date +%Y%m%d).tar.gz crm && sudo -u postgres pg_dump crm_production | gzip > db-emergency-$(date +%Y%m%d).sql.gz"

# ثم انسخها لجهازك
scp -i "your-key.pem" ubuntu@your-ec2-ip:~/emergency-backup-*.tar.gz D:\Backups\
scp -i "your-key.pem" ubuntu@your-ec2-ip:~/db-emergency-*.sql.gz D:\Backups\
```

---

## 7️⃣ التحقق من النسخة الاحتياطية

### تأكد من سلامة النسخة:

```bash
# تحقق من حجم الملفات
ls -lh D:\Backups\

# تحقق من قاعدة البيانات
gunzip -c database.sql.gz | head -n 50

# تحقق من الكود
cd D:\Backups\crm-server-backup
git log -1
npm list --depth=0
```

---

## 8️⃣ استعادة النسخة الاحتياطية

### استعادة قاعدة البيانات:

```bash
# على السيرفر
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# استعادة من SQL
gunzip -c ~/crm_backup.sql.gz | sudo -u postgres psql crm_production

# أو من dump
sudo -u postgres pg_restore -d crm_production ~/crm_backup.dump
```

### استعادة الكود:

```bash
# على السيرفر
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# احذف الكود القديم (بعد أخذ نسخة!)
mv ~/crm ~/crm.old

# استعادة من النسخة الاحتياطية
tar -xzf ~/code_backup.tar.gz -C ~/

# أعد تشغيل الخدمات
cd ~/crm/crm-backend
npm install
pm2 restart crm-backend

cd ~/crm/crm-frontend-only
npm install
npm run build
sudo systemctl reload nginx
```

---

## 9️⃣ أفضل الممارسات

### ✅ نصائح مهمة:

1. **نسخ احتياطي منتظم**:
   - يومياً: قاعدة البيانات
   - أسبوعياً: الكود كاملاً
   - شهرياً: نسخة شاملة

2. **أماكن متعددة**:
   - GitHub (الكود)
   - السيرفر (نسخ تلقائية)
   - جهازك المحلي
   - خدمة سحابية (Google Drive, Dropbox)

3. **تسمية واضحة**:
   ```
   crm-backup-20251130-full.tar.gz
   crm-db-20251130-143000.sql.gz
   ```

4. **اختبار الاستعادة**:
   - اختبر استعادة النسخة الاحتياطية شهرياً
   - تأكد من سلامة البيانات

5. **الأمان**:
   - شفّر النسخ الاحتياطية الحساسة
   - لا تحفظ كلمات المرور في النسخ
   - استخدم أذونات محدودة

---

## 🔟 حجم النسخ الاحتياطية المتوقع

| النوع | الحجم التقريبي |
|-------|----------------|
| الكود فقط (بدون node_modules) | ~50-100 MB |
| الكود مع node_modules | ~500 MB - 1 GB |
| قاعدة البيانات (مضغوطة) | ~10-50 MB |
| قاعدة البيانات (غير مضغوطة) | ~50-200 MB |
| النسخة الشاملة | ~1-2 GB |

---

## 📞 للطوارئ

### إذا فقدت الوصول للسيرفر:
1. ✅ الكود محفوظ على GitHub
2. ✅ يمكنك استنساخه في أي وقت
3. ✅ قاعدة البيانات لديها نسخ تلقائية على السيرفر

### إذا تعطل السيرفر:
1. ✅ استنسخ الكود من GitHub
2. ✅ أنشئ سيرفر جديد
3. ✅ استعد قاعدة البيانات من آخر نسخة
4. ✅ شغّل المشروع

---

## 📋 Checklist للنسخ الاحتياطي

- [ ] نسخ الكود من GitHub
- [ ] نسخ الكود من السيرفر
- [ ] نسخ قاعدة البيانات
- [ ] نسخ ملفات .env
- [ ] نسخ الملفات المرفوعة (uploads)
- [ ] نسخ النسخ الاحتياطية الموجودة
- [ ] التحقق من سلامة النسخ
- [ ] حفظ في مكان آمن
- [ ] توثيق التاريخ والمحتويات

---

**آخر تحديث**: 30 نوفمبر 2025
**الحالة**: ✅ جاهز للاستخدام
