// API Switch System - Toggle between Mock and Real APIs
// نظام تبديل APIs - التبديل بين Mock والحقيقي

import { ENV_CONFIG } from '../config/environment.js'

// Environment configuration - Use Real API with simple test server
const USE_REAL_API = true // استخدام Real API مع simple test server
const BACKEND_URL = ENV_CONFIG.BACKEND_URL

console.log('🔧 API Switch Configuration:', {
  USE_REAL_API,
  BACKEND_URL,
  mode: USE_REAL_API ? 'Real Backend' : 'Mock Frontend-Only'
})

// Static API imports for better performance and reliability
import realApiModule from './realApi.js'
import mockApiModule from './api.js'

// Select API module based on configuration
let apiModule

if (USE_REAL_API) {
  console.log('🌐 Loading Real Backend API...')
  apiModule = realApiModule
} else {
  console.log('🎭 Loading Mock Frontend-Only API...')
  apiModule = mockApiModule
}

// Export the selected API
export const { authAPI, dbAPI } = apiModule
export const config = {
  mode: USE_REAL_API ? 'full-stack' : 'frontend-only',
  baseURL: BACKEND_URL,
  enableMockData: !USE_REAL_API,
  hasBackend: USE_REAL_API
}

console.log(`✅ API System loaded in ${config.mode} mode`)

export default {
  authAPI,
  dbAPI,
  config
}
