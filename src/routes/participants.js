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


// Dependencies for ICS fetch/parse
const { fetchCalendarICS } = require('../utils/icsFetcher');
const { buildAvailabilityFromICS } = require('../utils/icsParser');
const timeBlocksUtil = require('../utils/timeBlocks');
const multer = require('multer');
const upload = multer();

// POST /participants/:participantId/calendar
router.post('/participants/:participantId/calendar', upload.single('calendar_file'), async (req, res) => {
  const participantId = req.params.participantId;
  const url = req.body.calendar_link_url;
  // Find participant and event
  const participant = db.listParticipantsForEvent ? null : null; // fallback if needed
  let event = null;
  try {
    // Find event by joining participants
    const stmt = db.__getEventForParticipant || db.getEventForParticipant;
    if (stmt) {
      event = stmt(participantId);
    } else {
      // fallback: get eventId from participants table
      const p = db.createOrGetParticipant ? null : null; // fallback if needed
      const db_ = require('better-sqlite3')(require('path').join(__dirname, '../data.db'));
      const row = db_.prepare('SELECT event_id FROM participants WHERE id = ?').get(participantId);
      if (row) event = db.getEventById(row.event_id);
    }
  } catch (e) {}
  if (!participantId || (!url && !req.file)) {
    return res.status(400).json({ error: 'Missing participantId or calendar_link_url or file' });
  }
  if (!event) {
    return res.status(404).json({ error: 'Event not found for participant' });
  }
  try {
    let icsText = null;
    if (url) {
      db.saveParticipantCalendarLink(participantId, url);
      icsText = await fetchCalendarICS(url);
    } else if (req.file) {
      icsText = req.file.buffer.toString('utf8');
    }
    if (!icsText) throw new Error('No ICS data');
    // Build grid config
    const gridConfig = timeBlocksUtil.buildGridConfig(event);
    const matrix = buildAvailabilityFromICS({
      icsText,
      eventStartDate: event.start_date,
      eventEndDate: event.end_date,
      minTime: event.min_time,
      maxTime: event.max_time,
      intervalMinutes: 30,
      timezone: event.timezone
    });
    db.saveAvailabilityMatrix(participantId, matrix);
    return res.json({ availabilityMatrix: matrix });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to import calendar: ' + err.message });
  }
});

module.exports = router;