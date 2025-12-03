import React, { useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { useClients } from '../hooks/useClients'
import { useLeads } from '../hooks/useLeads'
import { useSales } from '../hooks/useSales'
import { useProjects } from '../hooks/useProjects'
import { LoadingPage } from '../components/ui/loading'
import AdvancedAnalytics from '../components/analytics/AdvancedAnalytics'
import ExportImportManager from '../components/export/ExportImportManager'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'

export default function Analytics() {
  const { clients, loading: clientsLoading } = useClients()
  const { leads, loading: leadsLoading } = useLeads()
  const { sales, loading: salesLoading } = useSales()
  const { projects, loading: projectsLoading } = useProjects()
  const api = useApi()
  const { isAdmin, isSalesManager } = usePermissions()

  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  const loading = clientsLoading || leadsLoading || salesLoading || projectsLoading

  const handleRefresh = async () => {
    setRefreshing(true)
    // محاكاة إعادة تحميل البيانات
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const tabs = [
    { id: 'overview', name: 'نظرة عامة', icon: BarChart3 },
    { id: 'trends', name: 'الاتجاهات', icon: TrendingUp },
    { id: 'export', name: 'التصدير والاستيراد', icon: Download }
  ]

  if (loading) {
    return <LoadingPage message="جاري تحليل البيانات..." />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التحليلات والتقارير</h1>
          <p className="text-gray-600 mt-1">رؤى شاملة حول أداء الأعمال والمبيعات</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>

          <Button variant="outline">
            <Calendar className="h-4 w-4 ml-2" />
            تخصيص الفترة
          </Button>

          <Button variant="outline">
            <Filter className="h-4 w-4 ml-2" />
            الفلاتر
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{clients?.length || 0}</div>
          <div className="text-sm text-gray-600">إجمالي العملاء</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{leads?.length || 0}</div>
          <div className="text-sm text-gray-600">العملاء المحتملين</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{sales?.length || 0}</div>
          <div className="text-sm text-gray-600">إجمالي المبيعات</div>
        </Card>

        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{projects?.length || 0}</div>
          <div className="text-sm text-gray-600">المشاريع النشطة</div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <AdvancedAnalytics
            clients={clients}
            leads={leads}
            sales={sales}
            projects={projects}
          />
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تحليل الاتجاهات</h3>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">تحليل الاتجاهات المتقدم</h3>
                <p className="text-gray-500 mb-4">سيتم إضافة المزيد من التحليلات المتقدمة قريباً</p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExportImportManager
                data={clients}
                dataType="clients"
                onImport={(data) => console.log('Import clients:', data)}
              />

              <ExportImportManager
                data={leads}
                dataType="leads"
                onImport={(data) => console.log('Import leads:', data)}
                api={api}
                isManager={isAdmin() || isSalesManager()}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExportImportManager
                data={sales}
                dataType="sales"
                onImport={(data) => console.log('Import sales:', data)}
              />

              <ExportImportManager
                data={projects}
                dataType="projects"
                onImport={(data) => console.log('Import projects:', data)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

