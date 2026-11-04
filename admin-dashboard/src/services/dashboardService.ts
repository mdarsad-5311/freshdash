import { api } from './api';
import { DashboardMetrics, DashboardResponse } from '../types/dashboard';

export const dashboardService = {
  /**
   * Fetch comprehensive real-time dashboard analytics.
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await api.get<DashboardResponse>('/dashboard/');
    return response.data.analytics;
  },
};

