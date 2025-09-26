import React, { useState } from 'react';
import { useUpgrade } from '../context/UpgradeContext';
import { useAuth } from '../context/AuthContext';
import { Crown, Clock, CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react';

const UpgradeRequest = () => {
  const { 
    upgradeStatus, 
    requestUpgrade, 
    canRequestUpgrade, 
    isUpgradePending, 
    isUpgradeApproved,
    loading,
    error 
  } = useUpgrade();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequestUpgrade = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      await requestUpgrade(reason);
      setShowModal(false);
      setReason('');
    } catch (error) {
      console.error('Error requesting upgrade:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    if (!upgradeStatus) return null;
    
    switch (upgradeStatus.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (!upgradeStatus) return null;
    
    switch (upgradeStatus.status) {
      case 'pending':
        return 'Your upgrade request is pending admin approval.';
      case 'approved':
        return 'Your upgrade request has been approved! You now have unlimited notes.';
      case 'rejected':
        return 'Your upgrade request was rejected. You can submit a new request.';
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (!upgradeStatus) return 'gray';
    
    switch (upgradeStatus.status) {
      case 'pending':
        return 'yellow';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Don't show for admins
  if (user?.role === 'admin') {
    return null;
  }

  // Hide entire component when user has active Pro (regardless of old cancellation fields)
  if (user?.isPro || user?.tenant?.plan === 'pro') {
    return null;
  }

  // Only show status when pending, or approved AND user effectively has Pro
  const showStatus =
    upgradeStatus &&
    (isUpgradePending() || isUpgradeApproved());

  return (
    <div className="space-y-4">
      {/* Cancellation Notice (hide if user is currently Pro) */}
      {user?.proCancellationReason && !user?.isPro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">
              Pro Access Cancelled
            </p>
          </div>
          <p className="text-red-700 text-sm mt-2">
            <strong>Reason:</strong> {user.proCancellationReason}
          </p>
          {user.proCancelledAt && (
            <p className="text-red-600 text-xs mt-1">
              Cancelled on: {new Date(user.proCancelledAt).toLocaleDateString()}
            </p>
          )}
          <p className="text-red-600 text-sm mt-2">
            You can request Pro access again using the form below.
          </p>
        </div>
      )}

      {/* Current Status (pending or truly approved only) */}
      {showStatus && (
        <div className={`bg-${getStatusColor()}-50 border border-${getStatusColor()}-200 rounded-lg p-4`}>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <p className={`text-${getStatusColor()}-800 font-medium`}>
              {getStatusMessage()}
            </p>
          </div>
          {upgradeStatus.reason && (
            <p className={`text-${getStatusColor()}-700 text-sm mt-2`}>
              Reason: {upgradeStatus.reason}
            </p>
          )}
        </div>
      )}

      {/* Request Button (now visible after cancellation) */}
      {canRequestUpgrade() && (
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Crown className="w-4 h-4" />
          <span>Request Pro Upgrade</span>
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Request Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Crown className="w-8 h-8 text-primary-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Request Pro Upgrade
                </h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-gray-600">
                  Request an upgrade to Pro plan for unlimited notes. Your admin will review and approve your request.
                </p>
                
                <div className="bg-primary-50 rounded-lg p-4">
                  <h4 className="font-medium text-primary-900 mb-2">Pro Plan Benefits:</h4>
                  <ul className="text-sm text-primary-700 space-y-1">
                    <li>• Unlimited notes</li>
                    <li>• Advanced features</li>
                    <li>• Priority support</li>
                    <li>• Team collaboration tools</li>
                  </ul>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for upgrade (optional)
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Explain why you need the Pro upgrade..."
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
                  onClick={handleRequestUpgrade}
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
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

export default UpgradeRequest;
