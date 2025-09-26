import api from './api';

export const tenantService = {
  // Upgrade tenant to Pro plan
  upgradeToPro: async (tenantSlug) => {
    try {
      const response = await api.post(`/api/tenants/${tenantSlug}/upgrade`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upgrade tenant' };
    }
  },

  // Get tenant info for invitation
  getTenantInfo: async (tenantSlug) => {
    try {
      const response = await api.get(`/api/tenants/${tenantSlug}/invite`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch tenant info' };
    }
  }
};
