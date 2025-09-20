# 🚀 خطوات رفع المشروع على GitHub

## 1️⃣ إنشاء Repository على GitHub

اذهب إلى: https://github.com/boodymasoud7 وانشئ repository جديد:

- **اسم Repository**: `netaq-crm`
- **Description**: `نظام نطاق لإدارة علاقات العملاء - Netaq CRM System`
- **Privacy**: Private أو Public (كما تفضل)
- **لا تضيف** README, .gitignore, أو LICENSE (موجودين بالفعل)

---

## 2️⃣ أوامر Git للتنفيذ في Terminal

```bash
# 1. Initialize git repository
git init

# 2. Add remote origin (بعد إنشاء الـ repository)
git remote add origin https://github.com/boodymasoud7/netaq-crm.git

# 3. Add all files
git add .

# 4. First commit
git commit -m "🚀 Initial Netaq CRM System - Production Ready

✅ Complete real estate CRM system
✅ Arabic interface with RTL support
✅ Client & Lead management
✅ Follow-ups & Sales tracking
✅ WhatsApp integration
✅ WikiMapia integration
✅ Finance calculator
✅ Advanced reports & analytics
✅ Auto-deployment with GitHub Actions
✅ AWS EC2 production setup
✅ PostgreSQL database
✅ Nginx + SSL ready
✅ PM2 process management

🌐 Domain: www.netaqcrm.site
🖥️ Server: 54.221.136.112"

# 5. Set main branch
git branch -M main

# 6. Push to GitHub
git push -u origin main
```

---

## 3️⃣ إعداد GitHub Secrets

بعد رفع الكود، اذهب إلى:
`Settings` → `Secrets and variables` → `Actions`

وأضف هذه الـ Secrets:

### المطلوب إضافته:

```
Name: EC2_HOST
Value: 54.221.136.112

Name: EC2_USER  
Value: ubuntu

Name: EC2_PORT
Value: 22

Name: EC2_KEY
Value: -----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEArCW4uPLS8QutuQuVbDpTGko3g65d7Xo5Y0YT641HfZQ5+Lnw
aVMpU30LFQ4wTNvDeEUOj4xrtgLcIXOyO9PhoobdDO0d1aZlgGPuatKy2y4AOas1
vAHXPyRDqEzMwrCitBOuQgM1P73BXhRrcxfvuKTToABR+SAQ/VGisYoJCfGoqbEP
yRLXAYNQOjVD6mRH5+XAIeU6rC6UacuRwlI2uVseckHzMPC+TTB1+UH3ASF3oPYa
p3aPi4zkumbg0Kq9Cw++xSauTWIHFQ754q4RGc9aHa/Fq0iXIXseHSmq5eguS82X
1DjSWJb9JwuR6k8j4JIGHzYpFTqualZlhd+snwIDAQABAoIBAF/1lwbhtNxRGkGw
R1bRHEnnXRK2O/2IyDyib7A6TMOfwMD5RR4xETRM28Sc6CevyUJdnERAjjojVfn/
uDbJYVlrvATcmGjkHGh5TAmX8cNj3RRIb+ehTw8Pc/d4+Br+w3OGFPkPOLuTVxrO
XycFDMfseVsTUp6AVXgf7YTx4R/8/zFycl0a6ElYXjGtPElOjlew5W5sInCTixV+
iEPgOEJz/0tWDqEviVyvgxOmX2TAPukqyiIJO3Wr7y9FKygagDXcPTU57/HC4Awk
WXIIHlGvVqKjJamDKfJTx0yX3y8Ut9xPaByHFXPDDhnp8KISPC6vfpQVxZdnEjAN
/78zWGECgYEA29I3e0izrBOYNCnl9xdL2oLaPTy+UUTr7Zubm/kDpmJhJ45dqp0g
Jh5lFL1PmN/ai05yOySctqgqHNUxX+35tk+Mvqy2cnmvYwzSofzYbg/M6S9v45uc
UXdiwHGZgiEsxoj/RBHmZUQ2j1deKyb3yOl5W0lzrXzG9BzxK+SK7DsCgYEAyHra
AV+8VJScCiNYpf+6RrmsbMi35/DYyKidku9XKww+/ZgWqwZb8V+WxM2qa7sU1eNk
NC9E8LGNaKd75ftKWXJ2OaGYpSN652x4EItQYPWQWxv7fLoz+F/qRdeFM3SQ+ZhR
ObEBQ8VpeDtQJ7HqE+b0BeFOQfw0/CbEubhLTu0CgYEAtriKvcO09fhjsBiTu0x2
FPBoEDcJy+wKYLvUIVZgHlHwiDzixwtMyeLCCvdBzsVkmB9g/KB2U659MvJT1HWv
+Ecvqt9N2OIlU6Q5AcV28iXYIoz36K5UxbMDNww2meCRo4YFCcQHS23kHEp3UE9X
8H2CDsuDiFYL2qakIeQbRjkCgYA8DtmaScTQjciFHPuklwyFvX/TAvpdCIDY8/Jo
nzy8z6lbLSG1UG1gzOMMyBQCvAPM45cULwj3FimnrWzng7VNQIX8U9W3uv5Jr+v0
ANgug8IgGSzou5twD8PN8neb55K6ww+qOcWIOO6UrygfDCR0m96EmG9qQxTYaQDM
JlKhLQKBgQCSNrCGTjm/psoASJn51mFP+cUM9pOtSjYSjvgCMuA4bdBMx+N5NoRH
i61QRTmMGm8m4yTIKU/5S4Nl0NHfH7lqsT2cx0fxaozYWv2P1Yb+0rcA9ixS3cq4
9Dv+qltPoeRuf/vETJC4ohtb2x8g4CZtDlMuB0j9va4BnfQWcI8aJg==
-----END RSA PRIVATE KEY-----
```

---

## 4️⃣ تشغيل Setup Script على السيرفر

```bash
# SSH إلى السيرفر
ssh -i your-key.pem ubuntu@54.221.136.112

# تنزيل وتشغيل setup script
curl -o setup.sh https://raw.githubusercontent.com/boodymasoud7/netaq-crm/main/scripts/quick-setup.sh
chmod +x setup.sh
./setup.sh

# أو ارفع الملف يدوياً وشغله
```

---

## 5️⃣ اختبار النشر التلقائي

بعد إعداد كل شيء:

```bash
# أي تعديل وpush سيؤدي للنشر التلقائي
echo "Test deployment" >> test.txt
git add .
git commit -m "🧪 Test auto-deployment"
git push origin main
```

---

## ✅ النتيجة المتوقعة

- 🌐 الموقع: https://www.netaqcrm.site
- 🔧 API: https://www.netaqcrm.site:8000
- 📊 النشر التلقائي يعمل مع كل push
- 💾 نسخ احتياطية تلقائية
- 🔄 Zero downtime deployment

---

## 🆘 في حالة المشاكل

```bash
# فحص الحالة
./status.sh

# نشر سريع
./quick-deploy.sh

# مراقبة logs
pm2 logs crm-backend

# إعادة تشغيل
pm2 restart crm-backend
```
