// routes/noteRoutes.js
const express = require('express');
const { getNotes, createNote, deleteNote, analyzeNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);
router.post('/:id/analyze', analyzeNote);

module.exports = router;