import { useState, useEffect } from 'react';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import { useAuth } from '../../../auth/hooks/useAuth';

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(apiEndpoints.vendorDashboard);
        if (response.data.status === 'success') {
          setDashboardData(response.data.data);
        } else {
          throw new Error('Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      fetchDashboardData();
    }
  }, [user?.userId]);

  return { dashboardData, loading, error };
};
