import React, { useState } from 'react'
import { 
  Download, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Database,
  Check,
  X,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { formatDateArabic } from '../../lib/utils'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const EXPORT_FORMATS = {
  csv: {
    name: 'CSV',
    icon: FileText,
    description: 'ملف نصي مفصول بفواصل',
    extension: '.csv'
  },
  excel: {
    name: 'Excel',
    icon: FileSpreadsheet,
    description: 'ملف Excel (.xlsx)',
    extension: '.xlsx'
  },
  json: {
    name: 'JSON',
    icon: Database,
    description: 'تنسيق بيانات JSON',
    extension: '.json'
  }
}

const DATA_TYPES = {
  clients: { name: 'العملاء', fields: ['name', 'email', 'phone', 'address', 'status'] },
  leads: { name: 'العملاء المحتملين', fields: ['name', 'email', 'phone', 'source', 'status'] },
  sales: { name: 'المبيعات', fields: ['clientName', 'projectName', 'totalAmount', 'saleDate'] },
  projects: { name: 'المشاريع', fields: ['name', 'location', 'developer', 'status'] }
}

export default function ExportImportManager({ 
  data = [], 
  dataType = 'clients',
  onImport,
  className = "" 
}) {
  const [selectedFormat, setSelectedFormat] = useState('excel')
  const [selectedFields, setSelectedFields] = useState(DATA_TYPES[dataType]?.fields || [])
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [importErrors, setImportErrors] = useState([])

  // تصدير البيانات
  const handleExport = async () => {
    if (!data.length) {
      toast.error('لا توجد بيانات للتصدير')
      return
    }

    setIsExporting(true)

    try {
      // تحضير البيانات للتصدير
      const exportData = data.map(item => {
        const exportItem = {}
        selectedFields.forEach(field => {
          exportItem[getFieldLabel(field)] = formatFieldValue(item[field], field)
        })
        return exportItem
      })

      const fileName = `${DATA_TYPES[dataType].name}_${new Date().toISOString().split('T')[0]}`

      switch (selectedFormat) {
        case 'csv':
          exportToCSV(exportData, fileName)
          break
        case 'excel':
          exportToExcel(exportData, fileName)
          break
        case 'json':
          exportToJSON(data, fileName)
          break
      }

      toast.success(`تم تصدير ${data.length} عنصر بنجاح`)
    } catch (error) {
      console.error('خطأ في التصدير:', error)
      toast.error('فشل في تصدير البيانات')
    } finally {
      setIsExporting(false)
    }
  }

  // تصدير إلى CSV
  const exportToCSV = (data, fileName) => {
    const headers = Object.keys(data[0])
    const csvContent = [
      includeHeaders ? headers.join(',') : '',
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].filter(Boolean).join('\n')

    downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;')
  }

  // تصدير إلى Excel
  const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, DATA_TYPES[dataType].name)
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }

  // تصدير إلى JSON
  const exportToJSON = (data, fileName) => {
    const jsonContent = JSON.stringify(data, null, 2)
    downloadFile(jsonContent, `${fileName}.json`, 'application/json;charset=utf-8;')
  }

  // تنزيل الملف
  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // معالجة رفع الملف
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImportFile(file)
    setImportErrors([])

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let parsedData = []
        
        if (file.name.endsWith('.csv')) {
          parsedData = parseCSV(e.target.result)
        } else if (file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(e.target.result, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
        } else if (file.name.endsWith('.json')) {
          parsedData = JSON.parse(e.target.result)
        }

        // التحقق من صحة البيانات
        const { validData, errors } = validateImportData(parsedData)
        setImportPreview(validData.slice(0, 10)) // عرض أول 10 صفوف
        setImportErrors(errors)

      } catch (error) {
        console.error('خطأ في قراءة الملف:', error)
        toast.error('فشل في قراءة الملف')
        setImportErrors([{ row: 0, message: 'فشل في قراءة الملف' }])
      }
    }

    if (file.name.endsWith('.xlsx')) {
      reader.readAsBinaryString(file)
    } else {
      reader.readAsText(file)
    }
  }

  // تحليل CSV
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim())
      const obj = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      return obj
    }).filter(obj => Object.values(obj).some(val => val))
  }

  // التحقق من صحة البيانات المستوردة
  const validateImportData = (data) => {
    const validData = []
    const errors = []
    const requiredFields = DATA_TYPES[dataType]?.fields || []

    data.forEach((item, index) => {
      const rowErrors = []
      
      // التحقق من الحقول المطلوبة
      requiredFields.forEach(field => {
        const fieldLabel = getFieldLabel(field)
        if (!item[fieldLabel] && !item[field]) {
          rowErrors.push(`الحقل "${fieldLabel}" مطلوب`)
        }
      })

      // التحقق من صيغة البريد الإلكتروني
      if (item.email || item['البريد الإلكتروني']) {
        const email = item.email || item['البريد الإلكتروني']
        if (email && !/\S+@\S+\.\S+/.test(email)) {
          rowErrors.push('صيغة البريد الإلكتروني غير صحيحة')
        }
      }

      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, message: rowErrors.join(', ') })
      } else {
        validData.push(item)
      }
    })

    return { validData, errors }
  }

  // تأكيد الاستيراد
  const confirmImport = async () => {
    if (!importPreview?.length) {
      toast.error('لا توجد بيانات صالحة للاستيراد')
      return
    }

    setIsImporting(true)

    try {
      if (onImport) {
        await onImport(importPreview)
        toast.success(`تم استيراد ${importPreview.length} عنصر بنجاح`)
        setImportFile(null)
        setImportPreview(null)
        setImportErrors([])
      }
    } catch (error) {
      console.error('خطأ في الاستيراد:', error)
      toast.error('فشل في استيراد البيانات')
    } finally {
      setIsImporting(false)
    }
  }

  // الحصول على تسمية الحقل بالعربية
  const getFieldLabel = (field) => {
    const labels = {
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      address: 'العنوان',
      status: 'الحالة',
      source: 'المصدر',
      clientName: 'اسم العميل',
      projectName: 'اسم المشروع',
      totalAmount: 'المبلغ الإجمالي',
      saleDate: 'تاريخ البيع',
      location: 'الموقع',
      developer: 'المطور'
    }
    return labels[field] || field
  }

  // تنسيق قيمة الحقل
  const formatFieldValue = (value, field) => {
    if (!value) return ''
    
    if (field.includes('Date') || field.includes('At')) {
      return formatDateArabic(value)
    }
    
    if (field.includes('Amount') || field.includes('Price')) {
      return `${value.toLocaleString()} جنيه`
    }
    
    return value
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Export Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Download className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">تصدير البيانات</h3>
            <p className="text-sm text-gray-600">تصدير {DATA_TYPES[dataType].name} بصيغات مختلفة</p>
          </div>
          <Badge variant="outline" className="mr-auto">
            {data.length} عنصر
          </Badge>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تنسيق التصدير
          </label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(EXPORT_FORMATS).map(([key, format]) => {
              const Icon = format.icon
              return (
                <button
                  key={key}
                  onClick={() => setSelectedFormat(key)}
                  className={`p-3 border rounded-lg transition-colors ${
                    selectedFormat === key
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{format.name}</div>
                  <div className="text-xs text-gray-500">{format.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Field Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الحقول المراد تصديرها
          </label>
          <div className="flex flex-wrap gap-2">
            {DATA_TYPES[dataType].fields.map(field => (
              <label key={field} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFields([...selectedFields, field])
                    } else {
                      setSelectedFields(selectedFields.filter(f => f !== field))
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{getFieldLabel(field)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeHeaders}
              onChange={(e) => setIncludeHeaders(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">تضمين عناوين الأعمدة</span>
          </label>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting || !selectedFields.length}
          className="w-full"
        >
          {isExporting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              جاري التصدير...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              تصدير {data.length} عنصر
            </div>
          )}
        </Button>
      </Card>

      {/* Import Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Upload className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">استيراد البيانات</h3>
            <p className="text-sm text-gray-600">استيراد {DATA_TYPES[dataType].name} من ملف</p>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر ملف للاستيراد
          </label>
          <input
            type="file"
            accept=".csv,.xlsx,.json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            الصيغ المدعومة: CSV, Excel (.xlsx), JSON
          </p>
        </div>

        {/* Import Errors */}
        {importErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                تم العثور على {importErrors.length} خطأ
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {importErrors.map((error, index) => (
                <div key={index} className="text-xs text-red-700">
                  الصف {error.row}: {error.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Preview */}
        {importPreview && importPreview.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">
                معاينة البيانات ({importPreview.length} عنصر)
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-auto">
              <div className="text-xs space-y-1">
                {importPreview.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-gray-600">
                    {Object.entries(item).slice(0, 3).map(([key, value]) => (
                      <span key={key} className="mr-2">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Import Actions */}
        {importPreview && (
          <div className="flex gap-3">
            <Button
              onClick={confirmImport}
              disabled={isImporting || importErrors.length > 0}
              className="flex-1"
            >
              {isImporting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  جاري الاستيراد...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  استيراد {importPreview.length} عنصر
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setImportFile(null)
                setImportPreview(null)
                setImportErrors([])
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}


