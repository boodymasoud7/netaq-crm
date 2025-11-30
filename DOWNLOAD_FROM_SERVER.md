# 📥 دليل تحميل المشروع من السيرفر AWS

## 🎯 الهدف
تحميل المشروع بالكامل من السيرفر AWS EC2 إلى جهازك المحلي

---

## 📋 المتطلبات

قبل البدء، تأكد من توفر:
- ✅ **ملف المفتاح (.pem)** للاتصال بالسيرفر
- ✅ **IP السيرفر** أو اسم النطاق
- ✅ **مساحة كافية** على القرص (~2-3 GB)

---

## 🚀 الطريقة 1: تحميل باستخدام SCP (الأسهل)

### **خطوة واحدة - تحميل كل شيء:**

```powershell
# افتح PowerShell أو Command Prompt وشغل هذا الأمر:
scp -i "path\to\your-key.pem" -r ubuntu@YOUR_SERVER_IP:/home/ubuntu/crm D:\Downloaded_CRM_Project

# مثال:
# scp -i "D:\keys\aws-key.pem" -r ubuntu@3.25.123.456:/home/ubuntu/crm D:\Downloaded_CRM_Project
```

**شرح الأمر:**
- `-i "path\to\your-key.pem"` → مسار ملف المفتاح
- `-r` → نسخ المجلد بالكامل مع جميع المجلدات الفرعية
- `ubuntu@YOUR_SERVER_IP` → اسم المستخدم وIP السيرفر
- `:/home/ubuntu/crm` → مسار المشروع على السيرفر
- `D:\Downloaded_CRM_Project` → المكان الذي سيحفظ فيه على جهازك

---

## 🔧 الطريقة 2: تحميل باستخدام WinSCP (واجهة رسومية)

### **1. تحميل WinSCP:**
```
https://winscp.net/eng/download.php
```

### **2. الاتصال بالسيرفر:**
1. افتح WinSCP
2. اختر **New Site**
3. املأ البيانات:
   - **File protocol**: SFTP
   - **Host name**: YOUR_SERVER_IP (مثل: 3.25.123.456)
   - **Port number**: 22
   - **User name**: ubuntu
4. اضغط على **Advanced**
5. اذهب إلى **SSH → Authentication**
6. في **Private key file**، اختر ملف `.pem` الخاص بك
7. اضغط **OK** ثم **Login**

### **3. تحميل المشروع:**
1. في الجانب الأيمن (السيرفر)، انتقل إلى: `/home/ubuntu/crm`
2. في الجانب الأيسر (جهازك)، انتقل إلى: `D:\`
3. اسحب مجلد `crm` من اليمين إلى اليسار
4. انتظر حتى يكتمل التحميل

---

## 💻 الطريقة 3: تحميل باستخدام rsync (الأسرع للملفات الكبيرة)

### **إذا كان لديك rsync مثبت:**

```powershell
rsync -avz --progress -e "ssh -i path\to\your-key.pem" ubuntu@YOUR_SERVER_IP:/home/ubuntu/crm/ D:\Downloaded_CRM_Project\
```

**المميزات:**
- ✅ يعرض شريط التقدم
- ✅ أسرع من SCP
- ✅ يمكن استئناف التحميل إذا انقطع

---

## 📦 الطريقة 4: ضغط ثم تحميل (للسرعة)

### **خطوة 1: اتصل بالسيرفر وضغط المشروع**

```powershell
# اتصل بالسيرفر
ssh -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP

# على السيرفر، ضغط المشروع
cd ~
tar -czf crm-backup-$(date +%Y%m%d).tar.gz crm/

# تحقق من الملف المضغوط
ls -lh crm-backup-*.tar.gz

# اخرج من السيرفر
exit
```

### **خطوة 2: حمّل الملف المضغوط**

```powershell
# حمّل الملف المضغوط (أسرع بكثير!)
scp -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP:~/crm-backup-*.tar.gz D:\

# فك الضغط على جهازك
cd D:\
tar -xzf crm-backup-*.tar.gz
```

---

## 🎯 الطريقة 5: تحميل أجزاء محددة فقط

### **إذا كنت تريد تحميل أجزاء معينة:**

#### تحميل Frontend فقط:
```powershell
scp -i "path\to\your-key.pem" -r ubuntu@YOUR_SERVER_IP:/home/ubuntu/crm/crm-frontend-only D:\Frontend_Only
```

#### تحميل Backend فقط:
```powershell
scp -i "path\to\your-key.pem" -r ubuntu@YOUR_SERVER_IP:/home/ubuntu/crm/crm-backend D:\Backend_Only
```

#### تحميل قاعدة البيانات فقط:
```powershell
# على السيرفر، أنشئ نسخة من قاعدة البيانات
ssh -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP "sudo -u postgres pg_dump crm_production | gzip > /tmp/database.sql.gz"

# حمّلها
scp -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP:/tmp/database.sql.gz D:\

# احذفها من السيرفر
ssh -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP "rm /tmp/database.sql.gz"
```

#### تحميل ملفات الإعدادات فقط:
```powershell
scp -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP:/home/ubuntu/crm/crm-backend/.env D:\backend.env
scp -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP:/home/ubuntu/crm/crm-frontend-only/.env D:\frontend.env
```

---

## 🔍 التحقق من التحميل

### بعد التحميل، تحقق من:

```powershell
# انتقل للمجلد المحمل
cd D:\Downloaded_CRM_Project

# تحقق من المحتويات
dir

# يجب أن ترى:
# - crm-backend/
# - crm-frontend-only/
# - scripts/
# - package.json
# - README.md
# ... إلخ
```

### تحقق من حجم الملفات:
```powershell
# PowerShell
Get-ChildItem -Recurse | Measure-Object -Property Length -Sum

# يجب أن يكون الحجم الإجمالي حوالي 1-2 GB
```

---

## 📊 معلومات مفيدة

### **بنية المشروع المتوقعة:**

```
crm/
├── crm-backend/           # Backend (Node.js + Express)
│   ├── src/
│   ├── models/
│   ├── migrations/
│   ├── node_modules/
│   ├── .env              # ملف الإعدادات (مهم!)
│   └── package.json
├── crm-frontend-only/     # Frontend (React + Vite)
│   ├── src/
│   ├── public/
│   ├── node_modules/
│   ├── .env              # ملف الإعدادات (مهم!)
│   └── package.json
├── scripts/               # سكريبتات النشر
├── .github/              # GitHub Actions
├── package.json          # Root package.json
└── README.md
```

### **الملفات المهمة:**
- ✅ `crm-backend/.env` - إعدادات قاعدة البيانات والـ JWT
- ✅ `crm-frontend-only/.env` - رابط الـ API
- ✅ `package.json` - التبعيات
- ✅ `README.md` - التوثيق

---

## ⚠️ ملاحظات مهمة

### 1. **ملف المفتاح (.pem)**
```powershell
# تأكد من الصلاحيات الصحيحة (على Windows)
icacls "path\to\your-key.pem" /inheritance:r
icacls "path\to\your-key.pem" /grant:r "%USERNAME%:R"
```

### 2. **node_modules كبير الحجم**
إذا كنت لا تريد تحميل `node_modules` (يمكن تثبيتها لاحقاً):

```powershell
# على السيرفر، ضغط بدون node_modules
ssh -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP
cd ~
tar -czf crm-no-modules.tar.gz --exclude='node_modules' crm/
exit

# حمّل الملف الأصغر
scp -i "path\to\your-key.pem" ubuntu@YOUR_SERVER_IP:~/crm-no-modules.tar.gz D:\
```

### 3. **الاتصال البطيء**
إذا كان الاتصال بطيئاً، استخدم الضغط:
```powershell
# SCP مع ضغط إضافي
scp -C -i "path\to\your-key.pem" -r ubuntu@YOUR_SERVER_IP:/home/ubuntu/crm D:\
```

---

## 🚨 حل المشاكل الشائعة

### **المشكلة: Permission denied**
```powershell
# تأكد من صلاحيات ملف المفتاح
icacls "path\to\your-key.pem"
```

### **المشكلة: Connection refused**
```powershell
# تأكد من IP السيرفر
ping YOUR_SERVER_IP

# تأكد من Port 22 مفتوح
telnet YOUR_SERVER_IP 22
```

### **المشكلة: Host key verification failed**
```powershell
# احذف المفتاح القديم
ssh-keygen -R YOUR_SERVER_IP

# أو تجاوز التحقق (غير آمن)
scp -o StrictHostKeyChecking=no -i "path\to\your-key.pem" ...
```

### **المشكلة: التحميل بطيء جداً**
```powershell
# استخدم الضغط أولاً على السيرفر
# ثم حمّل الملف المضغوط (أسرع بكثير)
```

---

## 📝 سكريبت PowerShell جاهز

احفظ هذا في ملف `download-from-server.ps1`:

```powershell
# ===== الإعدادات - عدّلها حسب حاجتك =====
$KEY_FILE = "D:\keys\aws-key.pem"           # مسار ملف المفتاح
$SERVER_IP = "3.25.123.456"                 # IP السيرفر
$SERVER_USER = "ubuntu"                     # اسم المستخدم
$SERVER_PATH = "/home/ubuntu/crm"           # مسار المشروع على السيرفر
$LOCAL_PATH = "D:\Downloaded_CRM_$(Get-Date -Format 'yyyyMMdd_HHmmss')"  # مكان الحفظ

Write-Host "🚀 بدء تحميل المشروع من السيرفر..." -ForegroundColor Green
Write-Host "📍 السيرفر: $SERVER_IP" -ForegroundColor Cyan
Write-Host "📂 سيحفظ في: $LOCAL_PATH" -ForegroundColor Cyan

# إنشاء مجلد الحفظ
New-Item -ItemType Directory -Path $LOCAL_PATH -Force | Out-Null

# الطريقة 1: تحميل مباشر
Write-Host "`n📥 جاري التحميل..." -ForegroundColor Yellow
$scpCommand = "scp -i `"$KEY_FILE`" -r ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH} `"$LOCAL_PATH`""
Invoke-Expression $scpCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ تم التحميل بنجاح!" -ForegroundColor Green
    Write-Host "📂 الموقع: $LOCAL_PATH" -ForegroundColor Cyan
    
    # عرض المحتويات
    Write-Host "`n📋 محتويات المشروع:" -ForegroundColor Yellow
    Get-ChildItem $LOCAL_PATH | Format-Table Name, Length, LastWriteTime
    
    # حساب الحجم الإجمالي
    $totalSize = (Get-ChildItem -Path $LOCAL_PATH -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "`n📊 الحجم الإجمالي: $([math]::Round($totalSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ فشل التحميل!" -ForegroundColor Red
    Write-Host "تحقق من:" -ForegroundColor Yellow
    Write-Host "  - مسار ملف المفتاح صحيح" -ForegroundColor White
    Write-Host "  - IP السيرفر صحيح" -ForegroundColor White
    Write-Host "  - الاتصال بالإنترنت" -ForegroundColor White
}

Write-Host "`n✨ انتهى!" -ForegroundColor Green
```

**لتشغيل السكريبت:**
```powershell
# عدّل الإعدادات في السكريبت أولاً، ثم:
powershell -ExecutionPolicy Bypass -File download-from-server.ps1
```

---

## 🎯 الخطوات السريعة (TL;DR)

### **للتحميل السريع في أمر واحد:**

```powershell
# استبدل القيم بقيمك الحقيقية:
scp -i "D:\keys\aws-key.pem" -r ubuntu@YOUR_SERVER_IP:/home/ubuntu/crm D:\CRM_Downloaded
```

### **للتحميل المضغوط (أسرع):**

```powershell
# 1. ضغط على السيرفر
ssh -i "D:\keys\aws-key.pem" ubuntu@YOUR_SERVER_IP "cd ~ && tar -czf crm.tar.gz crm/"

# 2. تحميل الملف المضغوط
scp -i "D:\keys\aws-key.pem" ubuntu@YOUR_SERVER_IP:~/crm.tar.gz D:\

# 3. فك الضغط
cd D:\
tar -xzf crm.tar.gz
```

---

## 📞 هل تحتاج مساعدة؟

إذا واجهت أي مشكلة:
1. تأكد من صحة ملف المفتاح (.pem)
2. تأكد من صحة IP السيرفر
3. تأكد من اتصالك بالإنترنت
4. جرّب الطريقة المضغوطة (أسرع وأكثر موثوقية)

---

**آخر تحديث**: 30 نوفمبر 2025
**الحالة**: ✅ جاهز للاستخدام
