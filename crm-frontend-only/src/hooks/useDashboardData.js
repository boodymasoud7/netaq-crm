import { useState, useEffect } from 'react';
import { dbAPI } from '../lib/apiSwitch';

/**
 * Custom Hook for Dashboard Data
 * Uses the new optimized Dashboard Summary API
 */
export const useDashboardData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await dbAPI.get('/dashboard/summary');

                if (isMounted && response.success) {
                    setData(response.data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching dashboard data:', err);
                    setError(err.message || 'فشل في تحميل البيانات');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDashboardData();

        // Refresh every 5 minutes
        const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return { data, loading, error };
};

/**
 * Custom Hook for Last 7 Days Stats (for Charts)
 */
export const useLast7DaysStats = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await dbAPI.get('/dashboard/last-7-days');

                if (isMounted && response.success) {
                    setData(response.data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching last 7 days stats:', err);
                    setError(err.message || 'فشل في تحميل الإحصائيات');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStats();

        return () => {
            isMounted = false;
        };
    }, []);

    return { data, loading, error };
};
