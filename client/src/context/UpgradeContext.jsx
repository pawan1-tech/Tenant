import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { upgradeService } from '../services/upgradeService';
import { useAuth } from './AuthContext';

const UpgradeContext = createContext();

export const useUpgrade = () => {
  const context = useContext(UpgradeContext);
  if (!context) {
    throw new Error('useUpgrade must be used within an UpgradeProvider');
  }
  return context;
};

export const UpgradeProvider = ({ children }) => {
  const [upgradeStatus, setUpgradeStatus] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAdmin, refreshUser } = useAuth();

  // Memoize fetchUpgradeStatus; now refreshUser is stable
  const fetchUpgradeStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Server upgrade status
      const server = await upgradeService.getUpgradeStatus();
      const serverStatus = server?.data || null;

      // Refresh user to get latest isPro/cancellation flags
      const fresh = await refreshUser();

      // Compute effective status for UI:
      // - If user is not Pro (or has cancellation) and tenant isn't Pro,
      //   suppress stale "approved" status so the user can request again.
      let nextStatus = serverStatus;
      const isTenantPro = fresh?.tenant?.plan === 'pro';
      const userHasActivePro = !!fresh?.isPro && !fresh?.proCancellationReason;

      if (!isTenantPro && !userHasActivePro && serverStatus?.status !== 'pending') {
        nextStatus = { status: 'none' };
      }

      setUpgradeStatus(nextStatus);
    } catch (err) {
      setError(err.message || 'Failed to fetch upgrade status');
      console.error('Error fetching upgrade status:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  // Memoize fetchPendingRequests - THIS IS THE KEY FIX
  const fetchPendingRequests = useCallback(async () => {
    if (!user?.id || user?.role !== 'admin') {
      setPendingRequests([]);
      return;
    }

    try {
      setError(null);
      const response = await upgradeService.getPendingRequests();
      setPendingRequests(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending requests');
      console.error('Error fetching pending requests:', err);
    }
  }, [user?.id, user?.role]); // Only depend on specific user properties

  const requestUpgrade = useCallback(async (reason) => {
    try {
      setError(null);
      const response = await upgradeService.requestUpgrade(reason);
      await fetchUpgradeStatus(); // Refresh status
      return response;
    } catch (err) {
      setError(err.message || 'Failed to request upgrade');
      throw err;
    }
  }, [fetchUpgradeStatus]);

  const approveUpgrade = useCallback(async (tenantId, reason) => {
    try {
      setError(null);
      const response = await upgradeService.approveUpgrade(tenantId, reason);
      
      // Refresh both pending requests and user data
      await Promise.all([
        fetchPendingRequests(),
        refreshUser()
      ]);
      
      return response;
    } catch (err) {
      setError(err.message || 'Failed to approve upgrade');
      throw err;
    }
  }, [fetchPendingRequests, refreshUser]);

  const rejectUpgrade = useCallback(async (tenantId, reason) => {
    try {
      setError(null);
      const response = await upgradeService.rejectUpgrade(tenantId, reason);
      
      // Refresh both pending requests and user data
      await Promise.all([
        fetchPendingRequests(),
        refreshUser()
      ]);
      
      return response;
    } catch (err) {
      setError(err.message || 'Failed to reject upgrade');
      throw err;
    }
  }, [fetchPendingRequests, refreshUser]);

  // Fetch upgrade status when user ID changes (do not depend on function identity)
  useEffect(() => {
    if (user?.id) {
      fetchUpgradeStatus();
    } else {
      setUpgradeStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch pending requests ONLY when admin status changes (no function dep to avoid loops)
  useEffect(() => {
    if (user?.id && user?.role === 'admin') {
      fetchPendingRequests();
    } else {
      setPendingRequests([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const canRequestUpgrade = useCallback(() => {
    if (!user || user.role === 'admin') return false;
    const isTenantPro = user?.tenant?.plan === 'pro';
    const userHasActivePro = !!user?.isPro; // treat active Pro regardless of cancellation fields

    if (isTenantPro || userHasActivePro) return false;
    if (upgradeStatus?.status === 'pending') return false;
    return true;
  }, [user, upgradeStatus?.status]);

  const isUpgradeApproved = useCallback(() => {
    if (!upgradeStatus) return false;
    const isTenantPro = user?.tenant?.plan === 'pro';
    const userHasActivePro = !!user?.isPro; // treat active Pro regardless of cancellation fields
    return upgradeStatus.status === 'approved' && (isTenantPro || userHasActivePro);
  }, [upgradeStatus, user]);

  const isUpgradePending = useCallback(() => {
    return upgradeStatus?.status === 'pending';
  }, [upgradeStatus?.status]);

  const value = {
    upgradeStatus,
    pendingRequests,
    loading,
    error,
    requestUpgrade,
    approveUpgrade,
    rejectUpgrade,
    fetchUpgradeStatus,
    fetchPendingRequests,
    canRequestUpgrade,
    isUpgradePending,
    isUpgradeApproved
  };

  return (
    <UpgradeContext.Provider value={value}>
      {children}
    </UpgradeContext.Provider>
  );
};
