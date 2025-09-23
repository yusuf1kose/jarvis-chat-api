const express = require('express');
const { v4: uuidv4 } = require('uuid');
const ChatSession = require('../models/ChatSession');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       required:
 *         - role
 *         - text
 *         - ts
 *       properties:
 *         role:
 *           type: string
 *           enum: [user, assistant]
 *         text:
 *           type: string
 *         ts:
 *           type: string
 *           format: date-time
 *     ChatSession:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - title
 *         - messages
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         title:
 *           type: string
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatMessage'
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new chat session
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - messages
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               messages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ChatMessage'
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatSession'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
  try {
    const { userId, title, messages } = req.body;

    // Validation
    if (!userId || !title || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Missing required fields: userId, title, messages'
      });
    }

    // Create new session
    const sessionData = {
      id: uuidv4(),
      userId,
      title: title.trim() || 'Conversation',
      messages,
      createdAt: new Date()
    };

    const session = new ChatSession(sessionData);
    await session.save();

    console.log(`Created session: ${session.id} for user: ${userId}`);
    res.status(201).json(session);

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get all sessions for authenticated user
 *     tags: [Sessions]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get sessions for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of sessions to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of sessions to skip
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatSession'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 50, skip = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const sessions = await ChatSession.find({ userId })
      .sort({ createdAt: -1 }) // Newest first
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    console.log(`📋 Found ${sessions.length} sessions for user: ${userId}`);
    res.json(sessions);

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ 
      error: 'Failed to get sessions',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get a specific session by ID
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (for security)
 *     responses:
 *       200:
 *         description: Session found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatSession'
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const session = await ChatSession.findOne({ id, userId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`Retrieved session: ${id}`);
    res.json(session);

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ 
      error: 'Failed to get session',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sessions/{id}:
 *   put:
 *     summary: Update a session (rename or append messages)
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               messages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ChatMessage'
 *     responses:
 *       200:
 *         description: Session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatSession'
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, title, messages } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const session = await ChatSession.findOne({ id, userId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update fields if provided
    if (title !== undefined) {
      session.title = title.trim() || 'Conversation';
    }
    if (messages !== undefined && Array.isArray(messages)) {
      session.messages = messages;
    }

    await session.save();

    console.log(`Updated session: ${id}`);
    res.json(session);

  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ 
      error: 'Failed to update session',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sessions/{id}:
 *   delete:
 *     summary: Delete a session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (for security)
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const session = await ChatSession.findOneAndDelete({ id, userId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log(`Deleted session: ${id}`);
    res.json({ message: 'Session deleted successfully' });

  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ 
      error: 'Failed to delete session',
      message: error.message 
    });
  }
});

module.exports = router;