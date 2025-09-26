const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { authenticateToken } = require('../middleware/auth');
const { roleAuth } = require('../middleware/roleAuth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with tenant information
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('tenantId');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Ensure admins always have isPro true
    const isAdmin = user.role === 'admin';
    if (isAdmin && !user.isPro) {
      user.isPro = true;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        isPro: user.isPro || isAdmin,
        tenantId: user.tenantId._id,
        tenantSlug: user.tenantId.slug
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isPro: user.isPro || isAdmin,
        tenant: {
          id: user.tenantId._id,
          name: user.tenantId.name,
          slug: user.tenantId.slug,
          plan: user.tenantId.plan
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/register (admin only)
router.post('/register', authenticateToken, roleAuth(['admin']), async (req, res) => {
  try {
    const { email, password, role = 'member' } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user in the same tenant
    const newUser = new User({
      email: email.toLowerCase(),
      password,
      role,
      tenantId: req.user.tenantId
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        tenantId: newUser.tenantId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/auth/me - Get current user data
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.user.id).populate('tenantId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Ensure admins always have isPro true
    const isAdmin = user.role === 'admin';
    if (isAdmin && !user.isPro) {
      user.isPro = true;
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isPro: user.isPro || isAdmin,
        proCancellationReason: user.proCancellationReason,
        proCancelledAt: user.proCancelledAt,
        tenant: {
          id: user.tenantId._id,
          name: user.tenantId.name,
          slug: user.tenantId.slug,
          plan: user.tenantId.plan
        }
      }
    });
  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/auth/users - List users in current tenant (admin only)
router.get('/users', authenticateToken, roleAuth(['admin']), async (req, res) => {
  try {
    const { email } = req.query;
    const query = { tenantId: req.user.tenantId };
    if (email) {
      query.email = email.toLowerCase();
    }
    const users = await User.find(query).select('_id email role isPro');
    res.json({
      success: true,
      data: users.map(u => ({ id: u._id, email: u.email, role: u.role, isPro: u.isPro }))
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

module.exports = router;
