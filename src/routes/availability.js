// src/routes/availability.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// POST /participants/:participantId/availability - save matrix
router.post('/participants/:participantId/availability', express.json(), (req, res) => {
  const participantId = req.params.participantId;
  const matrix = req.body.availability;
  if (!participantId || !Array.isArray(matrix)) {
    return res.status(400).json({ error: 'Missing participantId or invalid matrix' });
  }
  try {
    db.saveAvailabilityMatrix(participantId, matrix);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error saving availability' });
  }
});

// GET /availability - get merged availability and participants
router.get('/availability', (req, res) => {
  const eventId = req.params.id;
  // For now, use 3x4 matrix as in events.js placeholder
  const numDays = 3, numTimes = 4;
  try {
    const { mergedAvailability, participants } = db.getAllAvailabilityForEvent(eventId, numDays, numTimes);
    return res.json({ mergedAvailability, participants });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error loading availability' });
  }
});

module.exports = router;