import api from './api';

export const upgradeService = {
  // Request upgrade to Pro plan
  requestUpgrade: async (reason) => {
    try {
      const response = await api.post('/api/upgrade-requests', { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to request upgrade' };
    }
  },

  // Get current upgrade request status
  getUpgradeStatus: async () => {
    try {
      const response = await api.get('/api/upgrade-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch upgrade status' };
    }
  },

  // Get all pending requests (admin only)
  getPendingRequests: async () => {
    try {
      const response = await api.get('/api/upgrade-requests/pending');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pending requests' };
    }
  },

  // Approve upgrade request (admin only)
  approveUpgrade: async (tenantId, reason) => {
    try {
      const response = await api.post(`/api/upgrade-requests/${tenantId}/approve`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve upgrade' };
    }
  },

  // Reject upgrade request (admin only)
  rejectUpgrade: async (tenantId, reason) => {
    try {
      const response = await api.post(`/api/upgrade-requests/${tenantId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject upgrade' };
    }
  }
};
