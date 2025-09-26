import React, { useState, useCallback } from 'react';
import { useUpgrade } from '../context/UpgradeContext';
import { useAuth } from '../context/AuthContext';
import { Crown, Clock, CheckCircle, XCircle, Users, AlertCircle, UserCheck, UserX } from 'lucide-react';
import api from '../services/api';

const AdminPanel = () => {
  const { 
    pendingRequests, 
    approveUpgrade, 
    rejectUpgrade, 
    fetchPendingRequests,
    loading,
    error 
  } = useUpgrade();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userActionMsg, setUserActionMsg] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [targetUserId, setTargetUserId] = useState(null);

  // Don't show for non-admins
  if (user?.role !== 'admin') {
    return null;
  }

  // Memoize the manual refresh function
  const handleManualRefresh = useCallback(() => {
    if (!loading) {
      fetchPendingRequests();
    }
  }, [fetchPendingRequests, loading]);

  const handleAction = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !action) return;

    setSubmitting(true);
    try {
      if (action === 'approve') {
        await approveUpgrade(selectedRequest._id, reason);
      } else if (action === 'reject') {
        await rejectUpgrade(selectedRequest._id, reason);
      }
      setShowModal(false);
      setSelectedRequest(null);
      setAction('');
      setReason('');
    } catch (error) {
      console.error('Error processing upgrade request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setReason('');
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        {/* Manual refresh button - only call when user explicitly clicks */}
        <button
          onClick={handleManualRefresh}
          className="btn-secondary flex items-center space-x-2"
          disabled={loading}
        >
          <Users className="w-4 h-4" />
          <span>{loading ? 'Refreshing...' : 'Refresh Requests'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          <span>Pending Upgrade Requests</span>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
            {pendingRequests.length}
          </span>
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending upgrade requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{request.name}</h4>
                      <span className="text-sm text-gray-500">({request.slug})</span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Requested by:</span> {request.upgradeRequest.requestedBy?.email}
                      </p>
                      <p>
                        <span className="font-medium">Requested at:</span> {formatDate(request.upgradeRequest.requestedAt)}
                      </p>
                      {request.upgradeRequest.reason && (
                        <p>
                          <span className="font-medium">Reason:</span> {request.upgradeRequest.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => openModal(request, 'approve')}
                      className="btn-primary flex items-center space-x-1 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => openModal(request, 'reject')}
                      className="btn-danger flex items-center space-x-1 text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User-level Pro Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Crown className="w-5 h-5 text-primary-600" />
          <span>User-Level Pro Controls</span>
        </h3>
        <p className="text-sm text-gray-600 mb-3">Approve or cancel Pro for a specific user in your tenant.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="email"
            className="input-field"
            placeholder="User email (e.g., user@acme.test)"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <button
            onClick={async () => {
              if (!userEmail.trim()) return;
              setUserActionMsg('');
              setSubmitting(true);
              try {
                // Look up user by email in tenant
                const users = await api.get('/api/auth/users', { params: { email: userEmail } });
                const target = (users.data?.data || []).find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
                if (!target) {
                  setUserActionMsg('User not found in your tenant');
                } else {
                  await api.post(`/api/tenants/${user.tenant.slug}/users/${target.id}/pro`);
                  setUserActionMsg('User upgraded to Pro successfully');
                }
              } catch (err) {
                setUserActionMsg(err.response?.data?.message || 'Failed to upgrade user');
              } finally {
                setSubmitting(false);
              }
            }}
            className="btn-primary flex items-center justify-center space-x-2"
            disabled={submitting}
          >
            <UserCheck className="w-4 h-4" />
            <span>Approve Pro</span>
          </button>
          <button
            onClick={async () => {
              if (!userEmail.trim()) return;
              setUserActionMsg('');
              setSubmitting(true);
              try {
                const users = await api.get('/api/auth/users', { params: { email: userEmail } });
                const target = (users.data?.data || []).find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
                if (!target) {
                  setUserActionMsg('User not found in your tenant');
                } else {
                  setTargetUserId(target.id);
                  setCancelReason('');
                  setShowCancelModal(true);
                }
              } catch (err) {
                setUserActionMsg(err.response?.data?.message || 'Failed to find user');
              } finally {
                setSubmitting(false);
              }
            }}
            className="btn-danger flex items-center justify-center space-x-2"
            disabled={submitting}
          >
            <UserX className="w-4 h-4" />
            <span>Cancel Pro</span>
          </button>
        </div>
        {userActionMsg && (
          <div className="mt-3 text-sm text-gray-700">{userActionMsg}</div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                {action === 'approve' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <h3 className="text-xl font-semibold text-gray-900">
                  {action === 'approve' ? 'Approve' : 'Reject'} Upgrade Request
                </h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-gray-600">
                  {action === 'approve' 
                    ? `Approve the upgrade request for ${selectedRequest.name}? This will give them unlimited notes.`
                    : `Reject the upgrade request for ${selectedRequest.name}? They will remain on the free plan.`
                  }
                </p>
                
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    {action === 'approve' ? 'Approval reason (optional)' : 'Rejection reason (optional)'}
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                    placeholder={action === 'approve' 
                      ? 'Why are you approving this request?'
                      : 'Why are you rejecting this request?'
                    }
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={submitting}
                  className={`${action === 'approve' ? 'btn-primary' : 'btn-danger'} flex-1 flex items-center justify-center`}
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {action === 'approve' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <UserX className="w-8 h-8 text-red-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Cancel Pro Access
                </h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-gray-600">
                  Cancel Pro access for <strong>{userEmail}</strong>? They will be reverted to the free plan with a 3-note limit.
                </p>
                
                <div>
                  <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for cancellation (required)
                  </label>
                  <textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Please provide a reason for cancelling Pro access..."
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!cancelReason.trim()) return;
                    setSubmitting(true);
                    try {
                      await api.delete(`/api/tenants/${user.tenant.slug}/users/${targetUserId}/pro`, {
                        data: { reason: cancelReason }
                      });
                      setUserActionMsg('User Pro access cancelled successfully');
                      setShowCancelModal(false);
                      setCancelReason('');
                      setUserEmail('');
                    } catch (err) {
                      setUserActionMsg(err.response?.data?.message || 'Failed to cancel Pro access');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting || !cancelReason.trim()}
                  className="btn-danger flex-1 flex items-center justify-center"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Cancel Pro Access
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
