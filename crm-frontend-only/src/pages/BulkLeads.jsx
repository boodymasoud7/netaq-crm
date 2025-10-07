import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Upload, Download, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'

function BulkLeads() {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      // التحقق من نوع الملف
      const allowedTypes = ['.csv', '.xlsx', '.xls']
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('يرجى اختيار ملف CSV أو Excel فقط')
        return
      }
      
      setFile(selectedFile)
      toast.success('تم اختيار الملف بنجاح')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('يرجى اختيار ملف أولاً')
      return
    }

    setIsUploading(true)
    try {
      // هنا يمكن إضافة منطق رفع الملف الفعلي
      // const formData = new FormData()
      // formData.append('file', file)
      // await uploadBulkLeads(formData)
      
      // محاكاة عملية الرفع
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('تم رفع الملف ومعالجة البيانات بنجاح')
      setFile(null)
    } catch (error) {
      toast.error('حدث خطأ أثناء رفع الملف')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    // إنشاء ملف CSV نموذجي
    const csvContent = `الاسم,البريد الإلكتروني,رقم الهاتف,الشركة,المصدر,الحالة,الملاحظات
أحمد محمد,ahmed@example.com,01234567890,شركة ABC,موقع إلكتروني,جديد,عميل محتمل مهتم بالخدمات
فاطمة علي,fatima@example.com,01987654321,شركة XYZ,إحالة,متابعة,تم التواصل معها
محمد حسن,mohamed@example.com,01122334455,شركة DEF,معرض,مؤهل,جاهز للعرض التقديمي`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'نموذج_العملاء_المحتملين.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('تم تحميل النموذج بنجاح')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">استيراد العملاء المحتملين بالجملة</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* بطاقة رفع الملف */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع ملف العملاء المحتملين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <FileText className="h-12 w-12 text-gray-400" />
                <span className="text-sm text-gray-600">
                  اضغط لاختيار ملف أو اسحب الملف هنا
                </span>
                <span className="text-xs text-gray-500">
                  CSV, Excel (.xlsx, .xls)
                </span>
              </label>
            </div>

            {file && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>الملف المحدد:</strong> {file.name}
                </p>
                <p className="text-xs text-blue-600">
                  الحجم: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? 'جاري الرفع...' : 'رفع ومعالجة الملف'}
            </Button>
          </CardContent>
        </Card>

        {/* بطاقة تحميل النموذج */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              تحميل النموذج
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              قم بتحميل النموذج لمعرفة التنسيق المطلوب لملف العملاء المحتملين
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">الحقول المطلوبة:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• الاسم (مطلوب)</li>
                <li>• البريد الإلكتروني</li>
                <li>• رقم الهاتف (مطلوب)</li>
                <li>• الشركة</li>
                <li>• المصدر</li>
                <li>• الحالة</li>
                <li>• الملاحظات</li>
              </ul>
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              تحميل النموذج
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>تعليمات الاستيراد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">نصائح مهمة:</h4>
              <ul className="space-y-1">
                <li>• تأكد من أن الملف بتنسيق CSV أو Excel</li>
                <li>• يجب أن تكون الأسماء وأرقام الهواتف مطلوبة</li>
                <li>• تحقق من صحة عناوين البريد الإلكتروني</li>
                <li>• استخدم النموذج المتوفر لضمان التنسيق الصحيح</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">حالات العملاء المحتملين:</h4>
              <ul className="space-y-1">
                <li>• جديد - عميل محتمل جديد</li>
                <li>• متابعة - يحتاج متابعة</li>
                <li>• مؤهل - مؤهل للشراء</li>
                <li>• مهتم - أظهر اهتماماً</li>
                <li>• غير مهتم - غير مهتم حالياً</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BulkLeads