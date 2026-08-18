const Note = require('../models/Notes');
const { analyzeNoteContent } = require('../services/aiService');

// Get all notes for the authenticated user
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error.message);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
};

// Create a new note (with optional AI processing)
const createNote = async (req, res) => {
  try {
    const { title, content, runAi } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    let aiData = { summary: '', tags: [], actionItems: [] };

    // If the frontend triggers "Analyze & Save"
    if (runAi) {
      try {
        console.log(`[AI] Analyzing note: "${title}"...`);
        aiData = await analyzeNoteContent(title, content);
        console.log('[AI] Successfully analyzed note.');
      } catch (aiError) {
        console.error('[AI] Generation failed:', aiError.message);
        // Note is still created without crashing if AI fails
      }
    }

    const note = await Note.create({
      userId: req.user.userId,
      title: title.trim(),
      content: content.trim(),
      summary: aiData.summary || '',
      tags: aiData.tags || [],
      actionItems: aiData.actionItems || []
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error.message);
    res.status(500).json({ error: 'Failed to create note.' });
  }
};

// Delete a note
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('Error deleting note:', error.message);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
};

// On-demand AI analysis for an existing raw note
const analyzeNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const { summary, tags, actionItems } = await analyzeNoteContent(note.title, note.content);

    note.summary = summary || '';
    note.tags = tags || [];
    note.actionItems = actionItems || [];
    await note.save();

    res.json(note);
  } catch (error) {
    console.error('Error analyzing note:', error.message);
    res.status(500).json({ error: 'AI processing failed.' });
  }
};

module.exports = {
  getNotes,
  createNote,
  deleteNote,
  analyzeNote
};