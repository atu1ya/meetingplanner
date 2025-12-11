// src/routes/participants.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// POST /participants - create or get participant by username
router.post('/participants', express.json(), express.urlencoded({ extended: true }), (req, res) => {
  const eventId = req.params.id;
  const username = req.body.username;
  if (!eventId || !username) {
    return res.status(400).json({ error: 'Missing eventId or username' });
  }
  try {
    const participant = db.createOrGetParticipant(eventId, username);
    // For now, use 3x4 matrix as in events.js placeholder
    const numDays = 3, numTimes = 4;
    const availabilityMatrix = db.getAvailabilityMatrixForParticipant(participant.id, numDays, numTimes);
    return res.json({
      participantId: participant.id,
      username: participant.username,
      availabilityMatrix
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error creating/loading participant' });
  }
});

// POST /participants/:participantId/calendar - save calendar link (ICS fetch later)
router.post('/participants/:participantId/calendar', express.json(), (req, res) => {
  const participantId = req.params.participantId;
  const url = req.body.calendar_link_url;
  if (!participantId || !url) {
    return res.status(400).json({ error: 'Missing participantId or calendar_link_url' });
  }
  try {
    db.saveParticipantCalendarLink(participantId, url);
    // For now, return dummy empty matrix
    const numDays = 3, numTimes = 4;
    const availabilityMatrix = Array.from({ length: numDays }, () => Array(numTimes).fill(false));
    return res.json({ availabilityMatrix });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error saving calendar link' });
  }
});

module.exports = router;