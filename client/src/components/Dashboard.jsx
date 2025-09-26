import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { tenantService } from '../services/tenantService';
import NotesManager from './NotesManager';
import UpgradeRequest from './UpgradeRequest';
import AdminPanel from './AdminPanel';
import { 
  Plus, 
  LogOut, 
  Building2, 
  Crown, 
  Users, 
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const { notes, loading } = useNotes();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  // Admins and Pro users have unlimited access regardless of tenant plan
  const isFreePlan = user?.tenant?.plan === 'free' && user?.role !== 'admin' && !user?.isPro;
  const noteCount = notes.length;
  const noteLimit = isFreePlan ? 3 : -1;
  const canCreateNote = isFreePlan ? noteCount < 3 : true;

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      setUpgradeMessage('');
      
      const response = await tenantService.upgradeToPro(user.tenant.slug);
      setUpgradeMessage('Successfully upgraded to Pro plan! You now have unlimited notes.');
      
      // Refresh the page to update user data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setUpgradeMessage(error.message || 'Failed to upgrade. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Tenant Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-8 h-8 text-primary-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {user?.tenant?.name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {user?.email} • {user?.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Badge and Actions */}
            <div className="flex items-center space-x-4">
              {/* Plan Badge */}
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                isFreePlan 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isFreePlan ? (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Free Plan</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>{user?.role === 'admin' ? 'Admin Pro' : 'Pro Plan'}</span>
                  </>
                )}
              </div>

              {/* Upgrade Button */}
              {isFreePlan && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Pro</span>
                </button>
              )}

              {/* Refresh Button */}
              <button
                onClick={async () => {
                  try {
                    await refreshUser();
                    // Don't force page reload, let React handle the updates
                  } catch (error) {
                    console.error('Failed to refresh user data:', error);
                  }
                }}
                className="btn-secondary flex items-center space-x-2"
                title="Refresh to check for updates"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Refresh</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cancellation Notice */}
        {user?.proCancellationReason && !user?.isPro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Notes Count */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900">{noteCount}</p>
              </div>
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          {/* Plan Status */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Plan</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isFreePlan ? 'Free' : (user?.role === 'admin' ? 'Admin Pro' : 'Pro')}
                </p>
              </div>
              {isFreePlan ? (
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500" />
              )}
            </div>
          </div>

          {/* Note Limit */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Note Limit</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isFreePlan ? `${noteCount}/3` : 'Unlimited'}
                </p>
              </div>
              {isFreePlan ? (
                <Users className="w-8 h-8 text-gray-500" />
              ) : (
                <Crown className="w-8 h-8 text-green-500" />
              )}
            </div>
          </div>
        </div>

        {/* Notes Manager */}
        <NotesManager canCreateNote={canCreateNote} />

        {/* Upgrade Request Component */}
        <div className="mt-8">
          <UpgradeRequest />
        </div>

        {/* Admin Panel */}
        <div className="mt-8">
          <AdminPanel />
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Crown className="w-8 h-8 text-primary-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Upgrade to Pro Plan
                  </h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  <p className="text-gray-600">
                    Upgrade to Pro and get unlimited notes for your team.
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

                  {upgradeMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      upgradeMessage.includes('Successfully') 
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {upgradeMessage}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="btn-secondary flex-1"
                    disabled={upgrading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    {upgrading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Upgrade Now'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
