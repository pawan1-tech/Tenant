const express = require('express');
const Note = require('../models/Note');
const Tenant = require('../models/Tenant');
const { authenticateToken } = require('../middleware/auth');
const { tenantAuth } = require('../middleware/tenantAuth');

const router = express.Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticateToken);
router.use(tenantAuth);

// GET /api/notes - List all notes for current tenant
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ tenantId: req.tenantId })
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notes,
      count: notes.length
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes'
    });
  }
});

// POST /api/notes - Create a new note
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Check note limit - admins have unlimited access, regular users with isPro=true have unlimited access
    // Only check limit for regular users (non-admin) who don't have isPro=true
    if (req.user.role !== 'admin' && !req.user.isPro) {
      const noteCount = await Note.countDocuments({ tenantId: req.tenantId });
      
      if (noteCount >= 3) {
        return res.status(403).json({
          success: false,
          message: 'Note limit reached. Request upgrade to Pro for unlimited notes.',
          limit: 3,
          current: noteCount,
          canRequestUpgrade: true
        });
      }
    }

    const note = new Note({
      title,
      content,
      tenantId: req.tenantId,
      createdBy: req.user.id
    });

    await note.save();
    await note.populate('createdBy', 'email');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note'
    });
  }
});

// GET /api/notes/:id - Get specific note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate('createdBy', 'email');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note'
    });
  }
});

// PUT /api/notes/:id - Update note
router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenantId
      },
      { title, content },
      { new: true, runValidators: true }
    ).populate('createdBy', 'email');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note'
    });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note'
    });
  }
});

module.exports = router;
