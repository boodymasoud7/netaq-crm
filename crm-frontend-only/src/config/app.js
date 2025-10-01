// Application Configuration
export const APP_CONFIG = {
  // Frontend-only mode - set to true to skip all backend API calls
  FRONTEND_ONLY: false, // Backend is ready and connected
  
  // API Configuration
  API_BASE_URL: 'http://localhost:8000/api',
  
  // Development flags
  ENABLE_MOCK_DATA: false, // استخدام Backend حقيقي
  LOG_LEVEL: 'warn' // 'error', 'warn', 'info', 'debug'
}

export default APP_CONFIG
