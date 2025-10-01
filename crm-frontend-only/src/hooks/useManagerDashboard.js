import { useState, useEffect } from 'react';
import { authAPI, dbAPI } from '../lib/apiSwitch';

export const useManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching manager dashboard data...');
      
      // Try the new optimized dashboard API first
      const response = await fetch('https://netaqcrm.site/api/dashboard/manager', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dev-token'}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Dashboard API failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Dashboard data loaded successfully:', result.data);
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid dashboard data received');
      }
      
    } catch (error) {
      console.error('❌ Dashboard data fetch failed:', error);
      setError(error.message);
      
      // When API fails, set data to null to show error state
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    console.log('🔄 Manual dashboard refresh triggered');
    fetchDashboardData();
  };

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh
  };
};
