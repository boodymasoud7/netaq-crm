import React, { useState, useEffect } from 'react'
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Calendar,
  Clock,
  User,
  HardDrive,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Eye,
  Archive,
  Server,
  FileText,
  RotateCcw,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

// Utility functions
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDateArabic = (date) => {
  return new Date(date).toLocaleDateString('ar-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function BackupManagement() {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [storageInfo, setStorageInfo] = useState(null)
  const [selectedBackup, setSelectedBackup] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoringId, setRestoringId] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // Dialog states
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  
  const api = useApi()
  const { currentUser } = useAuth()

  useEffect(() => {
    loadBackups()
    loadStorageInfo()
  }, [])

  const loadBackups = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://54.221.136.112/api/backups/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBackups(data.data || data.backups || [])
        console.log('✅ تم جلب النسخ الاحتياطية:', (data.data || data.backups || []).length)
      } else if (response.status === 500) {
        console.warn('⚠️ خطأ في الخادم - جاري العمل على الإصلاح')
        toast.error('الخادم قيد الصيانة - سيتم الإصلاح قريباً')
        setBackups([])
      } else {
        throw new Error('فشل في جلب النسخ الاحتياطية')
      }
    } catch (error) {
      console.error('❌ خطأ في الاتصال:', error)
      if (error.message.includes('fetch')) {
        toast.error('تعذر الاتصال بالخادم - تأكد من تشغيل الباك اند')
      } else {
        toast.error('فشل في جلب النسخ الاحتياطية')
      }
      setBackups([])
    } finally {
      setLoading(false)
    }
  }

  const loadStorageInfo = async () => {
    try {
      const response = await fetch('http://54.221.136.112/api/backups/storage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStorageInfo(data.data || data.storage || null)
      }
    } catch (error) {
      console.warn('تعذر جلب معلومات التخزين:', error)
    }
  }

  const createBackup = async () => {
    try {
      setCreating(true)
      
      const response = await fetch('http://54.221.136.112/api/backups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        },
        body: JSON.stringify({
          type: 'manual'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('✅ تم إنشاء النسخة الاحتياطية بنجاح!')
        await loadBackups()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'فشل في إنشاء النسخة الاحتياطية')
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error)
      toast.error('فشل في إنشاء النسخة الاحتياطية: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = async (backupId, filename) => {
    try {
      toast.loading('جاري تحميل النسخة الاحتياطية...')
      
      const response = await fetch(`http://54.221.136.112/api/backups/download/${backupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast.success('✅ تم تحميل النسخة الاحتياطية بنجاح!')
      } else {
        throw new Error('فشل في تحميل النسخة الاحتياطية')
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل النسخة الاحتياطية:', error)
      toast.error('فشل في تحميل النسخة الاحتياطية')
    } finally {
      toast.dismiss()
    }
  }

  const handleRestoreClick = (backupId, filename) => {
    setPendingAction({ backupId, filename })
    setShowRestoreDialog(true)
  }

  const restoreBackup = async () => {
    if (!pendingAction) return
    
    const { backupId, filename } = pendingAction

    try {
      setRestoring(true)
      setRestoringId(backupId)
      toast.loading('جاري استعادة النسخة الاحتياطية...')
      
      const response = await fetch(`http://54.221.136.112/api/backups/restore/${backupId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('✅ تم استعادة النسخة الاحتياطية بنجاح!')
        console.log('📥 Restore completed:', data)
        
        // Reload data after restore
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'فشل في استعادة النسخة الاحتياطية')
      }
    } catch (error) {
      console.error('❌ خطأ في استعادة النسخة الاحتياطية:', error)
      toast.error('فشل في استعادة النسخة الاحتياطية: ' + error.message)
    } finally {
      setRestoring(false)
      setRestoringId(null)
      toast.dismiss()
    }
  }

  const handleDeleteClick = (backupId, filename) => {
    setPendingDelete({ backupId, filename })
    setShowDeleteDialog(true)
  }

  const deleteBackup = async () => {
    if (!pendingDelete) return
    
    const { backupId } = pendingDelete

    try {
      const response = await fetch(`http://54.221.136.112/api/backups/delete/${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        }
      })

      if (response.ok) {
        toast.success('✅ تم حذف النسخة الاحتياطية بنجاح!')
        await loadBackups()
      } else {
        throw new Error('فشل في حذف النسخة الاحتياطية')
      }
    } catch (error) {
      console.error('❌ خطأ في حذف النسخة الاحتياطية:', error)
      toast.error('فشل في حذف النسخة الاحتياطية')
    }
  }

  const uploadBackup = async (file) => {
    try {
      setUploading(true)
      toast.loading('جاري رفع النسخة الاحتياطية...')
      
      const formData = new FormData()
      formData.append('backup', file)
      
      const response = await fetch('http://54.221.136.112/api/backups/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('✅ تم رفع النسخة الاحتياطية بنجاح!')
        console.log('📤 Upload completed:', data)
        await loadBackups()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'فشل في رفع النسخة الاحتياطية')
      }
    } catch (error) {
      console.error('❌ خطأ في رفع النسخة الاحتياطية:', error)
      toast.error('فشل في رفع النسخة الاحتياطية: ' + error.message)
    } finally {
      setUploading(false)
      toast.dismiss()
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check file extension
    if (!file.name.endsWith('.gz') && !file.name.endsWith('.json')) {
      toast.error('يجب أن يكون الملف بصيغة .gz أو .json')
      event.target.value = ''
      return
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 100 ميجابايت)')
      event.target.value = ''
      return
    }

    setPendingFile(file)
    setShowUploadDialog(true)
    
    // Reset file input
    event.target.value = ''
  }

  const confirmFileUpload = () => {
    if (pendingFile) {
      uploadBackup(pendingFile)
      setPendingFile(null)
    }
  }

  const handleClearAllClick = () => {
    setShowClearAllDialog(true)
  }

  const clearAllBackups = async () => {

    try {
      setRefreshing(true)
      toast.loading('جاري مسح جميع النسخ الاحتياطية...')
      
      const response = await fetch('http://54.221.136.112/api/backups/clear-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`✅ تم مسح جميع النسخ الاحتياطية! (${data.deleted.records} سجل، ${data.deleted.files} ملف)`)
        await loadBackups()
        await loadStorageInfo()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'فشل في مسح النسخ الاحتياطية')
      }
    } catch (error) {
      console.error('❌ خطأ في مسح النسخ الاحتياطية:', error)
      toast.error('فشل في مسح النسخ الاحتياطية: ' + error.message)
    } finally {
      setRefreshing(false)
      toast.dismiss()
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadBackups(), loadStorageInfo()])
    setRefreshing(false)
    toast.success('تم تحديث البيانات بنجاح')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'مكتملة' },
      creating: { color: 'bg-blue-100 text-blue-800', icon: Loader2, text: 'جاري الإنشاء' },
      uploading: { color: 'bg-yellow-100 text-yellow-800', icon: Upload, text: 'جاري الرفع' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'فشلت' }
    }

    const config = statusConfig[status] || statusConfig.failed
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1 px-2 py-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل النسخ الاحتياطية...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-white to-gray-100 min-h-screen">
      {/* Enhanced Page Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-700 rounded-2xl mx-6 mt-6 shadow-xl">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white bg-opacity-10 rounded-full blur-lg"></div>
        
        <div className="relative z-10 px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">إدارة النسخ الاحتياطية</h1>
                <p className="text-orange-100 mt-1">إنشاء، رفع، واسترجاع النسخ الاحتياطية لقاعدة البيانات</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Clock className="h-4 w-4" />
                    <span>{new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white bg-opacity-20 text-white hover:bg-white hover:bg-opacity-30 backdrop-blur-sm border-white border-opacity-20 w-12 h-12 p-0 rounded-xl"
                title="تحديث البيانات"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button 
                onClick={createBackup}
                disabled={creating || uploading}
                className="bg-white text-orange-600 hover:bg-gray-50 font-semibold px-6 py-2 shadow-lg h-12 rounded-xl"
              >
                {creating ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Plus className="h-5 w-5 mr-2" />
                )}
                إنشاء نسخة احتياطية
              </Button>

              <div className="relative" title="رفع نسخة احتياطية">
                <input
                  type="file"
                  accept=".gz,.json"
                  onChange={handleFileUpload}
                  disabled={uploading || creating}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="backup-upload"
                />
                <Button 
                  disabled={uploading || creating}
                  className="bg-white text-green-600 hover:bg-gray-50 border-green-200 w-12 h-12 p-0 cursor-pointer shadow-lg rounded-xl"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </Button>
              </div>

              <Button 
                onClick={handleClearAllClick}
                disabled={creating || uploading || refreshing || backups.length === 0}
                className="bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-12 h-12 p-0 shadow-lg rounded-xl"
                title={backups.length === 0 ? "لا توجد نسخ لحذفها" : "مسح جميع النسخ الاحتياطية"}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="px-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* إجمالي النسخ */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 bg-opacity-30 rounded-full -translate-y-10 translate-x-10"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium mb-1">إجمالي النسخ</p>
                  <p className="text-3xl font-bold text-orange-900">{backups.length}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    {backups.length > 0 ? 'نظام محمي ✓' : 'نظام غير محمي ⚠️'}
                  </p>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Archive className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* المساحة المستخدمة */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 bg-opacity-30 rounded-full -translate-y-10 translate-x-10"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium mb-1">المساحة المستخدمة</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatFileSize(backups.reduce((total, backup) => total + (backup.size || 0), 0))}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {backups.length} {backups.length === 1 ? 'ملف' : 'ملفات'}
                  </p>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <HardDrive className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                    <Database className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* آخر نسخة احتياطية */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 bg-opacity-30 rounded-full -translate-y-10 translate-x-10"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium mb-1">آخر نسخة احتياطية</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {backups.length > 0 ? formatDateArabic(new Date(backups[0].createdAt)) : 'لا توجد'}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    {backups.length > 0 ? '📅 محدث مؤخراً' : '⏰ يحتاج تحديث'}
                  </p>
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                    <Calendar className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backups List */}
        <Card className="bizmax-card shadow-strong border-0">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-900">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                  <Archive className="h-5 w-5 text-white" />
                </div>
                قائمة النسخ الاحتياطية ({backups.length})
              </div>
              {backups.length > 0 && (
                <Badge variant="outline" className="text-sm bg-white border-orange-200 text-orange-700">
                  آخر تحديث: {formatDateArabic(new Date())}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {backups.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-r from-orange-100 to-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Database className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نسخ احتياطية</h3>
                <p className="text-gray-500 mb-6">
                  {loading ? 'جاري تحميل النسخ الاحتياطية...' : 'ابدأ بإنشاء نسخة احتياطية جديدة أو ارفع نسخة من جهازك لحماية بياناتك'}
                </p>
                {!loading && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <Button 
                        onClick={createBackup} 
                        disabled={creating}
                        className="bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white shadow-lg h-12 px-6 rounded-xl"
                      >
                        {creating ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-5 w-5 mr-2" />
                        )}
                        إنشاء نسخة احتياطية
                      </Button>
                      
                      <div className="relative" title="رفع نسخة احتياطية">
                        <input
                          type="file"
                          accept=".gz,.json"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="backup-upload-empty"
                        />
                        <Button 
                          disabled={uploading}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg w-12 h-12 p-0 rounded-xl"
                        >
                          {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      <Button 
                        onClick={handleClearAllClick}
                        disabled={creating || uploading || backups.length === 0}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white shadow-lg w-12 h-12 p-0 rounded-xl"
                        title={backups.length === 0 ? "لا توجد نسخ لحذفها" : "مسح جميع النسخ الاحتياطية"}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        💡 تأكد من تشغيل الباك اند على المنفذ 8000
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {backups.map((backup) => (
                  <div key={backup.id} className="p-6 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                            <Archive className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-bold text-gray-900">{backup.filename}</h3>
                          {getStatusBadge(backup.status)}
                          <Badge className="bg-gray-100 text-gray-600">
                            {backup.type === 'manual' ? 'يدوية' : 'تلقائية'}
                          </Badge>
                          {backup.metadata?.uploadedFile && (
                            <Badge className="bg-purple-100 text-purple-600">
                              مرفوعة
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-blue-100 p-1 rounded">
                              <Calendar className="h-3 w-3 text-blue-600" />
                            </div>
                            <span>{formatDateArabic(new Date(backup.createdAt))}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-green-100 p-1 rounded">
                              <HardDrive className="h-3 w-3 text-green-600" />
                            </div>
                            <span>{formatFileSize(backup.size)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-purple-100 p-1 rounded">
                              <User className="h-3 w-3 text-purple-600" />
                            </div>
                            <span>{backup.createdBy || 'النظام'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-orange-100 p-1 rounded">
                              <Shield className="h-3 w-3 text-orange-600" />
                            </div>
                            <span>{backup.metadata?.storageType || 'محلي'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {backup.status === 'completed' && (
                          <>
                            <Button
                              onClick={() => downloadBackup(backup.id, backup.filename)}
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              تحميل
                            </Button>
                            
                            <Button
                              onClick={() => handleRestoreClick(backup.id, backup.filename)}
                              disabled={restoring}
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                            >
                              {restoring && restoringId === backup.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4 mr-1" />
                              )}
                              {restoring && restoringId === backup.id ? 'جاري الاستعادة...' : 'استعادة'}
                            </Button>
                          </>
                        )}
                        
                        <Button
                          onClick={() => handleDeleteClick(backup.id, backup.filename)}
                          size="sm"
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="bizmax-card shadow-strong border-0 mt-8">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
            <CardTitle className="flex items-center gap-3 text-amber-800">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-2 rounded-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              معلومات مهمة وتحذيرات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    معلومات النظام
                  </h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• يتم إنشاء النسخ الاحتياطية التلقائية يومياً في الساعة 3:00 صباحاً</li>
                    <li>• يحتفظ النظام بآخر 7 نسخ احتياطية تلقائياً</li>
                    <li>• يمكن تحميل واستعادة النسخ الاحتياطية المكتملة فقط</li>
                    <li>• النسخ الاحتياطية مضغوطة ومشفرة لضمان الأمان</li>
                    <li>• تحتوي النسخة الاحتياطية على جميع بيانات قاعدة البيانات</li>
                    <li>• يمكن رفع نسخ احتياطية من جهازك (صيغة .gz أو .json)</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    تحذيرات مهمة
                  </h4>
                  <ul className="space-y-2 text-red-700">
                    <li>⚠️ <strong>تحذير:</strong> استعادة النسخة الاحتياطية ستستبدل جميع البيانات الحالية!</li>
                    <li>🚨 <strong>تحذير خطير:</strong> زر "مسح الكل" يحذف جميع النسخ نهائياً بدون إمكانية استرجاع!</li>
                    <li>🔒 <strong>أمان:</strong> تأكد من تحميل نسخة احتياطية قبل أي عملية استعادة</li>
                    <li>💾 <strong>مهم:</strong> احتفظ بنسخ احتياطية في أماكن متعددة للأمان</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestoreDialog}
        onClose={() => {
          setShowRestoreDialog(false)
          setPendingAction(null)
        }}
        onConfirm={restoreBackup}
        type="warning"
        title="تأكيد استعادة النسخة الاحتياطية"
        message={
          <div className="space-y-3">
            <p className="font-semibold text-orange-800">
              ⚠️ تحذير: هذه العملية ستستبدل جميع البيانات الحالية!
            </p>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-sm text-gray-700">
                <strong>النسخة المحددة:</strong> {pendingAction?.filename}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              جميع البيانات الحالية في النظام ستضيع ولا يمكن استرجاعها بعد هذه العملية.
            </p>
            <p className="text-sm font-medium text-red-600">
              هل أنت متأكد من المتابعة؟
            </p>
          </div>
        }
        confirmText="نعم، استعادة النسخة"
        cancelText="إلغاء"
      />

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearAllDialog}
        onClose={() => setShowClearAllDialog(false)}
        onConfirm={clearAllBackups}
        type="danger"
        title="حذف جميع النسخ الاحتياطية"
        message={
          <div className="space-y-3">
            <p className="font-semibold text-red-800">
              🚨 تحذير خطير: هذا سيحذف جميع النسخ الاحتياطية نهائياً!
            </p>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• جميع النسخ الاحتياطية من قاعدة البيانات</li>
                <li>• جميع ملفات النسخ من الخادم</li>
                <li>• جميع البيانات المرتبطة</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              سيتم حذف <strong>{backups.length}</strong> نسخة احتياطية
            </p>
            <p className="text-sm font-medium text-red-600">
              هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد تماماً؟
            </p>
          </div>
        }
        confirmText="نعم، حذف جميع النسخ"
        cancelText="إلغاء"
      />

      {/* File Upload Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showUploadDialog}
        onClose={() => {
          setShowUploadDialog(false)
          setPendingFile(null)
        }}
        onConfirm={confirmFileUpload}
        type="info"
        title="تأكيد رفع النسخة الاحتياطية"
        message={
          <div className="space-y-3">
            <p className="font-semibold text-blue-800">
              📤 هل تريد رفع هذه النسخة الاحتياطية؟
            </p>
            {pendingFile && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>اسم الملف:</strong> {pendingFile.name}</p>
                  <p><strong>حجم الملف:</strong> {formatFileSize(pendingFile.size)}</p>
                  <p><strong>نوع الملف:</strong> {pendingFile.name.endsWith('.gz') ? 'مضغوط' : 'JSON'}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600">
              سيتم إضافة هذه النسخة لقائمة النسخ الاحتياطية المتاحة.
            </p>
          </div>
        }
        confirmText="نعم، رفع النسخة"
        cancelText="إلغاء"
      />

      {/* Delete Backup Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setPendingDelete(null)
        }}
        onConfirm={deleteBackup}
        type="danger"
        title="حذف النسخة الاحتياطية"
        message={
          <div className="space-y-3">
            <p className="font-semibold text-red-800">
              🗑️ هل تريد حذف هذه النسخة الاحتياطية؟
            </p>
            {pendingDelete && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-gray-700">
                  <strong>النسخة المحددة:</strong> {pendingDelete.filename}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              هذا الإجراء لا يمكن التراجع عنه. ستفقد هذه النسخة الاحتياطية نهائياً.
            </p>
          </div>
        }
        confirmText="نعم، حذف النسخة"
        cancelText="إلغاء"
      />
    </div>
  )
}
