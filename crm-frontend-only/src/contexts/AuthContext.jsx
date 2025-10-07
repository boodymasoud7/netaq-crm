import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../lib/apiSwitch.js'

// Force clear any api.ts cache
if (typeof window !== 'undefined') {
  console.log('🔧 Forcing use of api.js (not api.ts) for frontend-only mode')
}
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // معالج للأخطاء غير المتوقعة
  useEffect(() => {
    const handleError = (event) => {
      console.error('🚨 Unhandled error:', event.error)
    }
    
    const handleUnhandledRejection = (event) => {
      console.error('🚨 Unhandled promise rejection:', event.reason)
    }
    
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // نظام جلسة بسيط بدون JWT tokens
  useEffect(() => {
    const keepSessionAlive = () => {
      if (currentUser) {
        // Just verify session is still valid every 10 minutes
        console.log('✅ Session active for:', currentUser.email)
        
        // Store session timestamp
        localStorage.setItem('sessionTimestamp', Date.now().toString())
        
        // Optional: ping backend to keep session alive
        // authAPI.verifySession().catch(() => console.log('Session verification failed'))
      }
    }
    
    // Keep session alive every 10 minutes
    const interval = setInterval(keepSessionAlive, 10 * 60 * 1000)
    
    // Initial check
    keepSessionAlive()
    
    return () => clearInterval(interval)
  }, [currentUser])

  // تسجيل الدخول
  async function login(email, password) {
    try {
      console.log('🚀 AuthContext.login starting with:', { email, hasPassword: !!password })
      const result = await authAPI.login(email, password)
      console.log('✅ authAPI.login succeeded:', result.user.email)
      
      setCurrentUser(result.user)
      setUserProfile(result.user)
      
      // حفظ بيانات المستخدم في localStorage (بدون token)
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('sessionActive', 'true')
      localStorage.setItem('sessionTimestamp', Date.now().toString())
      console.log('💾 User session saved to localStorage:', result.user.email)
      
      toast.success('تم تسجيل الدخول بنجاح')
      return result
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error)
      toast.error('خطأ في تسجيل الدخول: ' + error.message)
      throw error
    }
  }

  // إنشاء حساب جديد
  async function signup(email, password, userData) {
    try {
      // محاكاة إنشاء حساب جديد
      const newUser = {
        uid: `user-${Date.now()}`,
        email: email,
        displayName: userData.displayName || email.split('@')[0],
        role: userData.role || 'sales_agent',
        department: userData.department || 'المبيعات',
        phone: userData.phone || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        permissions: getDefaultPermissions(userData.role || 'sales_agent')
      }

      setCurrentUser(newUser)
      setUserProfile(newUser)
      
      // حفظ بيانات المستخدم في localStorage
      localStorage.setItem('mockUser', JSON.stringify(newUser))
      localStorage.setItem('mockToken', 'mock-jwt-token')
      
      toast.success('تم إنشاء الحساب بنجاح')
      return { user: newUser }
    } catch (error) {
      console.error('خطأ في إنشاء الحساب:', error)
      toast.error('خطأ في إنشاء الحساب: ' + error.message)
      throw error
    }
  }

  // تسجيل الخروج
  async function logout() {
    try {
      await authAPI.logout()
      setCurrentUser(null)
      setUserProfile(null)
      
      // حذف بيانات الجلسة من localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('sessionActive')
      localStorage.removeItem('sessionTimestamp')
      localStorage.removeItem('token') // Clean up any old tokens
      localStorage.removeItem('authToken') // Clean up any old tokens
      console.log('🗑️ Session data cleared from localStorage')
      
      toast.success('تم تسجيل الخروج بنجاح')
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error)
      toast.error('خطأ في تسجيل الخروج')
      
      // Clear localStorage even if API call fails
      localStorage.removeItem('user')
      localStorage.removeItem('sessionActive')
      localStorage.removeItem('sessionTimestamp')
      localStorage.removeItem('token')
      localStorage.removeItem('authToken')
      setCurrentUser(null)
      setUserProfile(null)
    }
  }

  // دالة لمسح جميع البيانات المحفوظة (للتطوير)
  function clearAllSessions() {
    localStorage.removeItem('user')
    localStorage.removeItem('sessionActive') 
    localStorage.removeItem('sessionTimestamp')
    localStorage.removeItem('mockUser')
    localStorage.removeItem('mockToken')
    localStorage.removeItem('token')
    localStorage.removeItem('authToken')
    setCurrentUser(null)
    setUserProfile(null)
    console.log('🧹 All sessions cleared')
    toast.info('تم مسح جميع البيانات المحفوظة')
  }

  // تحميل ملف المستخدم
  async function loadUserProfile(user) {
    try {
      if (user) {
        setUserProfile(user)
        // تحديث آخر تسجيل دخول
        const updatedUser = {
          ...user,
          lastLogin: new Date().toISOString()
        }
        localStorage.setItem('mockUser', JSON.stringify(updatedUser))
        setUserProfile(updatedUser)
        return updatedUser
      }
      return null
    } catch (error) {
      console.error('خطأ في تحميل ملف المستخدم:', error)
      return null
    }
  }

  // التحقق من الأذونات
  function hasPermission(permission) {
    if (!userProfile) return false
    // المدير لديه جميع الأذونات
    if (userProfile.role === 'admin') return true
    return userProfile.permissions?.includes(permission) || false
  }

  // التحقق من الدور
  function hasRole(role) {
    if (!userProfile) return false
    return userProfile.role === role
  }

  // الحصول على الأذونات الافتراضية حسب الدور
  function getDefaultPermissions(role) {
    const permissions = {
      'admin': [
        'VIEW_DASHBOARD',
        'VIEW_CLIENTS',
        'ADD_CLIENT',
        'EDIT_CLIENT',
        'DELETE_CLIENT',
        'VIEW_LEADS',
        'ADD_LEAD',
        'EDIT_LEAD',
        'DELETE_LEAD',
        'VIEW_PROJECTS',
        'ADD_PROJECT',
        'EDIT_PROJECT',
        'DELETE_PROJECT',
        'VIEW_SALES',
        'ADD_SALE',
        'EDIT_SALE',
        'DELETE_SALE',
        'VIEW_USERS',
        'ADD_USER',
        'EDIT_USER',
        'DELETE_USER',
        'VIEW_REPORTS',
        'MANAGE_SETTINGS',
        'VIEW_TASKS',
        'ADD_TASK',
        'EDIT_TASK',
        'DELETE_TASK',
        'VIEW_REMINDERS',
        'ADD_REMINDER',
        'EDIT_REMINDER',
        'DELETE_REMINDER',
        'VIEW_ANALYTICS',
        'MANAGE_ARCHIVE',
        'VIEW_ROLES',
        'MANAGE_ROLES',
        'VIEW_FEATURES',
        'VIEW_DEVELOPERS',
        'VIEW_UNITS'
      ],
      'sales_manager': [
        'VIEW_DASHBOARD',
        'VIEW_CLIENTS',
        'ADD_CLIENT',
        'EDIT_CLIENT',
        'VIEW_LEADS',
        'ADD_LEAD',
        'EDIT_LEAD',
        'VIEW_PROJECTS',
        'VIEW_SALES',
        'ADD_SALE',
        'EDIT_SALE',
        'VIEW_REPORTS',
        'VIEW_TASKS',
        'ADD_TASK',
        'EDIT_TASK',
        'VIEW_REMINDERS',
        'ADD_REMINDER',
        'EDIT_REMINDER',
        'VIEW_ANALYTICS'
      ],
      'sales_agent': [
        'VIEW_DASHBOARD',
        'VIEW_CLIENTS',
        'ADD_CLIENT',
        'EDIT_CLIENT',
        'VIEW_LEADS',
        'ADD_LEAD',
        'EDIT_LEAD',
        'VIEW_PROJECTS',
        'VIEW_SALES',
        'ADD_SALE',
        'VIEW_TASKS',
        'ADD_TASK',
        'VIEW_REMINDERS',
        'ADD_REMINDER'
      ],
      'marketing_specialist': [
        'VIEW_DASHBOARD',
        'VIEW_LEADS',
        'ADD_LEAD',
        'EDIT_LEAD',
        'VIEW_PROJECTS',
        'VIEW_ANALYTICS',
        'VIEW_TASKS',
        'ADD_TASK'
      ],
      'customer_service': [
        'VIEW_DASHBOARD',
        'VIEW_CLIENTS',
        'EDIT_CLIENT',
        'VIEW_LEADS',
        'VIEW_PROJECTS',
        'VIEW_TASKS',
        'ADD_TASK'
      ]
    }
    
    return permissions[role] || permissions['sales_agent']
  }

  useEffect(() => {
    // محاكاة التحقق من المستخدم المحفوظ
    console.log('🔍 AuthContext: Checking for saved user...')
    
    const checkSavedSession = async () => {
      try {
        const savedToken = localStorage.getItem('authToken')
        const savedUser = localStorage.getItem('user')
        
        const sessionActive = localStorage.getItem('sessionActive')
        const sessionTimestamp = localStorage.getItem('sessionTimestamp')
        
        console.log('💾 Checking saved session:', { 
          savedUser: !!savedUser, 
          sessionActive: !!sessionActive,
          sessionValid: sessionActive === 'true'
        })
        
        if (savedUser && sessionActive === 'true') {
          try {
            const user = JSON.parse(savedUser)
            console.log('✅ Restoring user session:', user.email, user.name)
            
            // First, set user immediately from localStorage
            setCurrentUser(user)
            setUserProfile(user)
            console.log('✅ User restored from localStorage:', user.email)
            
            // Simple session - no backend verification needed
            console.log('✅ Session restored successfully')
          } catch (parseError) {
            console.error('❌ Session data corrupt, clearing session:', parseError)
            localStorage.removeItem('user')
            localStorage.removeItem('sessionActive')
            localStorage.removeItem('sessionTimestamp')
          }
        } else {
          console.log('❌ No saved session found - user needs to login')
          // لا يوجد تسجيل دخول تلقائي - المستخدم يحتاج لتسجيل الدخول
          setCurrentUser(null)
          setUserProfile(null)
        }
      } catch (storageError) {
        console.error('❌ خطأ في الوصول لـ localStorage:', storageError)
      }
      
      setLoading(false)
    }
    
    checkSavedSession()
  }, [])

  const value = {
    currentUser,
    user: currentUser, // alias for compatibility
    userProfile,
    login,
    signup,
    logout,
    clearAllSessions,
    hasPermission,
    hasRole,
    loadUserProfile,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}