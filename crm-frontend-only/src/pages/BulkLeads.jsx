import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Upload, Download, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import BulkDuplicateReportModal from '../components/modals/BulkDuplicateReportModal'
import * as XLSX from 'xlsx'

function BulkLeads() {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateData, setDuplicateData] = useState(null)

  const api = useApi()
  const { isAdmin, isSalesManager } = usePermissions()

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      const allowedTypes = ['.csv', '.xlsx', '.xls']
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))

      if (!allowedTypes.includes(fileExtension)) {
        toast.error('يرجى اختيار ملف CSV أو Excel فقط')
        return
      }

      setFile(selectedFile)
      setParsedData(null)
      toast.success('تم اختيار الملف بنجاح')
    }
  }

  const parseFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          let data = []

          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const text = e.target.result
            const lines = text.split('\n')
            const headers = lines[0].split(',').map(h => h.trim())

            for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue
              const values = lines[i].split(',').map(v => v.trim())
              const obj = {}
              headers.forEach((header, index) => {
                obj[header] = values[index] || ''
              })
              data.push(obj)
            }
          } else {
            // Parse Excel
            const workbook = XLSX.read(e.target.result, { type: 'binary' })
            const sheetName = workbook.SheetNames[0]
            data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
          }

          resolve(data)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = reject

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        reader.readAsBinaryString(file)
      }
    })
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('يرجى اختيار ملف أولاً')
      return
    }

    setIsUploading(true)
    try {
      // Parse the file
      const data = await parseFile(file)
      setParsedData(data)

      // Extract phones and emails
      const phones = data.map(row => row['رقم الهاتف'] || row.phone || row.Phone).filter(Boolean)
      const emails = data.map(row => row['البريد الإلكتروني'] || row.email || row.Email).filter(Boolean)

      if (phones.length === 0 && emails.length === 0) {
        toast.error('الملف لا يحتوي على أرقام هواتف أو إيميلات صالحة')
        setIsUploading(false)
        return
      }

      // Check for duplicates
      const duplicateCheck = await api.bulkCheckLeadDuplicates(phones, emails)

      if (duplicateCheck.duplicateCount > 0) {
        // Show duplicate modal
        setDuplicateData(duplicateCheck)
        setShowDuplicateModal(true)
      } else {
        // No duplicates, proceed with import
        await proceedWithImport(data)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('حدث خطأ أثناء معالجة الملف')
    } finally {
      setIsUploading(false)
    }
  }

  const proceedWithImport = async (dataToImport) => {
    try {
      let successCount = 0
      let errorCount = 0

      // Import each lead
      for (const row of dataToImport) {
        try {
          const leadData = {
            name: row['الاسم'] || row.name || row.Name || '',
            phone: row['رقم الهاتف'] || row.phone || row.Phone || '',
            email: row['البريد الإلكتروني'] || row.email || row.Email || '',
            company: row['الشركة'] || row.company || row.Company || '',
            source: row['المصدر'] || row.source || row.Source || 'استيراد جماعي',
            status: row['الحالة'] || row.status || row.Status || 'new',
            notes: row['الملاحظات'] || row.notes || row.Notes || '',
            interest: row['الاهتمام'] || row.interest || row.Interest || '',
            priority: 'medium'
          }

          // Validate required fields
          if (!leadData.name || !leadData.phone) {
            errorCount++
            continue
          }

          await api.addLead(leadData)
          successCount++
        } catch (error) {
          console.error('Error importing lead:', error)
          errorCount++
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`تم استيراد ${successCount} عميل محتمل بنجاح`)
      }
      if (errorCount > 0) {
        toast.error(`فشل استيراد ${errorCount} سجل`)
      }

      setFile(null)
      setParsedData(null)
      setShowDuplicateModal(false)
      setDuplicateData(null)
    } catch (error) {
      console.error('Import error:', error)
      toast.error('فشل في استيراد البيانات')
    }
  }

  const downloadTemplate = () => {
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
              {isUploading ? 'جاري المعالجة...' : 'استيراد ومعالجة الملف'}
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
                <li>• سيتم فحص التكرار تلقائياً قبل الاستيراد</li>
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

      {/* Bulk Duplicate Report Modal */}
      {showDuplicateModal && duplicateData && parsedData && (
        <BulkDuplicateReportModal
          duplicates={duplicateData.duplicates || []}
          duplicateCount={duplicateData.duplicateCount || 0}
          newCount={duplicateData.newCount || 0}
          totalCount={duplicateData.totalInputCount || parsedData.length}
          onSkipDuplicates={async () => {
            // Filter out duplicates
            const duplicatePhones = new Set(duplicateData.duplicates.map(d => d.phone))
            const duplicateEmails = new Set(duplicateData.duplicates.map(d => d.email))
            const newRecords = parsedData.filter(row => {
              const phone = row['رقم الهاتف'] || row.phone || row.Phone
              const email = row['البريد الإلكتروني'] || row.email || row.Email
              return !duplicatePhones.has(phone) && !duplicateEmails.has(email)
            })
            await proceedWithImport(newRecords)
          }}
          onAddAll={async () => {
            // Import all including duplicates
            await proceedWithImport(parsedData)
          }}
          onCancel={() => {
            setShowDuplicateModal(false)
            setDuplicateData(null)
          }}
          isManager={isAdmin() || isSalesManager()}
        />
      )}
    </div>
  )
}

export default BulkLeads