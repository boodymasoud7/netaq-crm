// Frontend Environment Configuration
// إعدادات البيئة للـ Frontend

export const ENV_CONFIG = {
  // API Mode: true = Real Backend, false = Mock Data
  USE_REAL_API: true, // Using Real Backend with simple test server
  
  // Backend URL - Uses relative path to automatically match protocol (HTTP/HTTPS)
  BACKEND_URL: '/api',
  
  // App Configuration
  APP_NAME: 'CRM Real Estate System',
  APP_VERSION: '2.0.0',
  
  // Development Settings
  DEBUG_MODE: false,
  ENABLE_LOGGING: false
}

console.log('🔧 Environment Configuration loaded:', {
  mode: ENV_CONFIG.USE_REAL_API ? 'Real Backend' : 'Mock Frontend-Only',
  backendUrl: ENV_CONFIG.BACKEND_URL
})

export default ENV_CONFIG


