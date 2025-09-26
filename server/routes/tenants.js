const express = require('express');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { tenantAuth } = require('../middleware/tenantAuth');
const { roleAuth } = require('../middleware/roleAuth');

const router = express.Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticateToken);
router.use(tenantAuth);

// POST /api/tenants/:slug/upgrade - Upgrade tenant to Pro plan (admin only)
router.post('/:slug/upgrade', roleAuth(['admin']), async (req, res) => {
  try {
    const { slug } = req.params;

    // Verify the slug matches the user's tenant
    if (slug !== req.tenantSlug) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { plan: 'pro' },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      message: 'Tenant upgraded to Pro plan successfully',
      data: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        noteLimit: tenant.noteLimit
      }
    });
  } catch (error) {
    console.error('Upgrade tenant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade tenant'
    });
  }
});

// GET /api/tenants/:slug/invite - Get tenant info for invitation (admin only)
router.get('/:slug/invite', roleAuth(['admin']), async (req, res) => {
  try {
    const { slug } = req.params;

    // Verify the slug matches the user's tenant
    if (slug !== req.tenantSlug) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }

    res.json({
      success: true,
      data: {
        id: req.tenantId,
        name: req.tenantName,
        slug: req.tenantSlug,
        plan: req.tenantPlan
      }
    });
  } catch (error) {
    console.error('Get tenant info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant information'
    });
  }
});

// NEW: POST /api/tenants/:slug/users/:userId/pro - Approve user-level Pro (admin only)
router.post('/:slug/users/:userId/pro', roleAuth(['admin']), async (req, res) => {
  try {
    const { slug, userId } = req.params;

    if (slug !== req.tenantSlug) {
      return res.status(403).json({ success: false, message: 'Access denied to this tenant' });
    }

    const user = await User.findOne({ _id: userId, tenantId: req.tenantId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isPro = true;

    // Clear any previous cancellation flags
    user.proCancellationReason = null;
    user.proCancelledAt = null;
    user.proCancelledBy = null;

    await user.save();

    res.json({ success: true, message: 'User Pro status approved', data: { userId: user._id, isPro: user.isPro } });
  } catch (error) {
    console.error('Approve user Pro error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve user Pro status' });
  }
});

// NEW: DELETE /api/tenants/:slug/users/:userId/pro - Cancel user-level Pro (admin only)
router.delete('/:slug/users/:userId/pro', roleAuth(['admin']), async (req, res) => {
  try {
    const { slug, userId } = req.params;
    const { reason } = req.body;

    if (slug !== req.tenantSlug) {
      return res.status(403).json({ success: false, message: 'Access denied to this tenant' });
    }

    const user = await User.findOne({ _id: userId, tenantId: req.tenantId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Store cancellation reason in user document
    if (reason) {
      user.proCancellationReason = reason;
      user.proCancelledAt = new Date();
      user.proCancelledBy = req.user.id;
    }

    // Ensure admins remain pro
    if (user.role === 'admin') {
      user.isPro = true;
    } else {
      user.isPro = false;
    }
    await user.save();

    res.json({ 
      success: true, 
      message: 'User Pro status updated', 
      data: { 
        userId: user._id, 
        isPro: user.isPro,
        cancellationReason: reason,
        cancelledAt: user.proCancelledAt
      } 
    });
  } catch (error) {
    console.error('Cancel user Pro error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel user Pro status' });
  }
});

module.exports = router;
