import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { EnhancedToaster } from './components/ui/EnhancedToast'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ReminderPopupProvider } from './contexts/ReminderPopupContext'
import ApiErrorBoundary from './components/ui/ApiErrorBoundary'

// نظام التذكيرات المتقدم - جديد
import ReminderPopupManager from './components/reminders/ReminderPopupManager'

import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClientsSimple from './pages/ClientsSimple'
import LeadsUltraSimple from './pages/LeadsUltraSimple'
import ManagerDashboard from './pages/ManagerDashboard'
import Projects from './pages/Projects'
import Sales from './pages/Sales'
import UserManagement from './pages/UserManagement'
import Features from './pages/Features'
import Developers from './pages/Developers'
import Analytics from './pages/Analytics'
import BulkLeads from './pages/BulkLeads'
import useMotivationalMessages from './hooks/useMotivationalMessages'
import Units from './pages/Units'
import Tasks from './pages/Tasks'
import RoleManagement from './pages/RoleManagement'
import Archive from './pages/Archive'
import BackupManagement from './pages/BackupManagement'
import SimpleReminders from './pages/SimpleReminders'
import FollowUps from './pages/FollowUps'
import Settings from './pages/Settings'
// ManagerDashboard تم استرجاعها
import NotFound from './components/ui/NotFound'

import { PERMISSIONS } from './lib/roles'
import './App.css'

function App() {
  // تفعيل الرسائل التحفيزية 🎉
  useMotivationalMessages()

  return (
    <ApiErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ReminderPopupProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 text-gray-900 font-arabic">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Routes>
                            <Route path="/" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_DASHBOARD]}>
                                <Dashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/dashboard" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_DASHBOARD]}>
                                <Dashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/clients" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CLIENTS]}>
                                <ClientsSimple />
                              </ProtectedRoute>
                            } />
                            <Route path="/leads" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_LEADS]}>
                                <LeadsUltraSimple />
                              </ProtectedRoute>
                            } />
                            <Route path="/projects" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_PROJECTS]}>
                                <Projects />
                              </ProtectedRoute>
                            } />
                            <Route path="/sales" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_SALES]}>
                                <Sales />
                              </ProtectedRoute>
                            } />
                            <Route path="/users" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_USERS, PERMISSIONS.MANAGE_USERS]} requireAll={false}>
                                <UserManagement />
                              </ProtectedRoute>
                            } />
                            <Route path="/user-management" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_USERS, PERMISSIONS.MANAGE_USERS]} requireAll={false}>
                                <UserManagement />
                              </ProtectedRoute>
                            } />
                            <Route path="/features" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_FEATURES]}>
                                <Features />
                              </ProtectedRoute>
                            } />
                            <Route path="/developers" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_DEVELOPERS]}>
                                <Developers />
                              </ProtectedRoute>
                            } />
                            <Route path="/units" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_UNITS]}>
                                <Units />
                              </ProtectedRoute>
                            } />
                            <Route path="/tasks" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_TASKS]}>
                                <Tasks />
                              </ProtectedRoute>
                            } />
                            <Route path="/roles" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_ROLES, PERMISSIONS.MANAGE_ROLES]} requireAll={false}>
                                <RoleManagement />
                              </ProtectedRoute>
                            } />
                            <Route path="/archive" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_ARCHIVE]}>
                                <Archive />
                              </ProtectedRoute>
                            } />
                            <Route path="/backup-management" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_SYSTEM]} requireAll={false}>
                                <BackupManagement />
                              </ProtectedRoute>
                            } />
                            <Route path="/reminders" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_REMINDERS]}>
                                <SimpleReminders />
                              </ProtectedRoute>
                            } />
                            <Route path="/follow-ups" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CLIENTS, PERMISSIONS.VIEW_LEADS]} requireAll={false}>
                                <FollowUps />
                              </ProtectedRoute>
                            } />
                            <Route path="/settings" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.MANAGE_SETTINGS, PERMISSIONS.MANAGE_SYSTEM]} requireAll={false}>
                                <Settings />
                              </ProtectedRoute>
                            } />
                            <Route path="/manager-dashboard" element={
                              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_ANALYTICS]}>
                                <ManagerDashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <EnhancedToaster />
              </div>

              {/* مدير popup التذكيرات - يعمل في جميع أنحاء التطبيق */}
              <ReminderPopupManager />
            </Router>
          </ReminderPopupProvider>
        </NotificationProvider>
      </AuthProvider>
    </ApiErrorBoundary>
  )
}

export default App
