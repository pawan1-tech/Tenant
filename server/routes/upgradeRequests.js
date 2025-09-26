const express = require('express');
const Tenant = require('../models/Tenant');
const { authenticateToken } = require('../middleware/auth');
const { tenantAuth } = require('../middleware/tenantAuth');
const { roleAuth } = require('../middleware/roleAuth');

const router = express.Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticateToken);
router.use(tenantAuth);

// POST /api/upgrade-requests - Request upgrade to Pro (any user)
router.post('/', async (req, res) => {
  try {
    const { reason } = req.body;

    // Check if tenant is already on Pro plan
    if (req.tenantPlan === 'pro') {
      return res.status(400).json({
        success: false,
        message: 'Tenant is already on Pro plan'
      });
    }

    // Check if there's already a pending request
    const tenant = await Tenant.findById(req.tenantId);
    if (tenant.upgradeRequest.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Upgrade request is already pending'
      });
    }

    // Create or update upgrade request
    tenant.upgradeRequest = {
      status: 'pending',
      requestedBy: req.user.id,
      requestedAt: new Date(),
      reason: reason || 'Requesting upgrade to Pro plan for unlimited notes'
    };

    await tenant.save();

    res.json({
      success: true,
      message: 'Upgrade request submitted successfully. Admin will review your request.',
      data: {
        status: tenant.upgradeRequest.status,
        requestedAt: tenant.upgradeRequest.requestedAt,
        reason: tenant.upgradeRequest.reason
      }
    });
  } catch (error) {
    console.error('Create upgrade request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit upgrade request'
    });
  }
});

// GET /api/upgrade-requests - Get current upgrade request status
router.get('/', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId)
      .populate('upgradeRequest.requestedBy', 'email')
      .populate('upgradeRequest.reviewedBy', 'email');

    res.json({
      success: true,
      data: {
        status: tenant.upgradeRequest.status,
        requestedBy: tenant.upgradeRequest.requestedBy,
        requestedAt: tenant.upgradeRequest.requestedAt,
        reviewedBy: tenant.upgradeRequest.reviewedBy,
        reviewedAt: tenant.upgradeRequest.reviewedAt,
        reason: tenant.upgradeRequest.reason
      }
    });
  } catch (error) {
    console.error('Get upgrade request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upgrade request status'
    });
  }
});

// GET /api/upgrade-requests/pending - Get all pending requests (admin only)
router.get('/pending', roleAuth(['admin']), async (req, res) => {
  try {
    const pendingRequests = await Tenant.find({
      'upgradeRequest.status': 'pending'
    })
    .populate('upgradeRequest.requestedBy', 'email')
    .select('name slug upgradeRequest createdAt');

    res.json({
      success: true,
      data: pendingRequests
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests'
    });
  }
});

// POST /api/upgrade-requests/:tenantId/approve - Approve upgrade request (admin only)
router.post('/:tenantId/approve', roleAuth(['admin']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (tenant.upgradeRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending upgrade request for this tenant'
      });
    }

    // Approve the request and grant Pro to the requesting user (user-level Pro)
    const requestedByUserId = tenant.upgradeRequest.requestedBy;
    // Safety: ensure requestedBy exists
    if (!requestedByUserId) {
      return res.status(400).json({ success: false, message: 'Invalid request: missing requester' });
    }

    const User = require('../models/User');
    const user = await User.findOne({ _id: requestedByUserId, tenantId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Requesting user not found' });
    }

    user.isPro = true;

    // Clear any previous cancellation flags
    user.proCancellationReason = null;
    user.proCancelledAt = null;
    user.proCancelledBy = null;

    await user.save();

    tenant.upgradeRequest.status = 'approved';
    tenant.upgradeRequest.reviewedBy = req.user.id;
    tenant.upgradeRequest.reviewedAt = new Date();
    if (reason) {
      tenant.upgradeRequest.reason = reason;
    }

    await tenant.save();

    res.json({
      success: true,
      message: 'Upgrade request approved: user granted Pro status',
      data: {
        tenantId: tenant._id,
        tenantName: tenant.name,
        approvedAt: tenant.upgradeRequest.reviewedAt,
        user: { id: user._id, email: user.email, isPro: user.isPro }
      }
    });
  } catch (error) {
    console.error('Approve upgrade request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve upgrade request'
    });
  }
});

// POST /api/upgrade-requests/:tenantId/reject - Reject upgrade request (admin only)
router.post('/:tenantId/reject', roleAuth(['admin']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (tenant.upgradeRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending upgrade request for this tenant'
      });
    }

    // Reject the request
    tenant.upgradeRequest.status = 'rejected';
    tenant.upgradeRequest.reviewedBy = req.user.id;
    tenant.upgradeRequest.reviewedAt = new Date();
    if (reason) {
      tenant.upgradeRequest.reason = reason;
    }

    await tenant.save();

    res.json({
      success: true,
      message: 'Upgrade request rejected',
      data: {
        tenantId: tenant._id,
        tenantName: tenant.name,
        rejectedAt: tenant.upgradeRequest.reviewedAt,
        reason: tenant.upgradeRequest.reason
      }
    });
  } catch (error) {
    console.error('Reject upgrade request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject upgrade request'
    });
  }
});

module.exports = router;
