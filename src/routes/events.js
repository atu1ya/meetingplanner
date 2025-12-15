
// src/routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../db');

const timeBlocksUtil = require('../utils/timeBlocks');

// GET /events/:id/summary - event summary for best times
router.get('/events/:id/summary', (req, res) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const timeBlocksUtil = require('../utils/timeBlocks');
  const bestTimesUtil = require('../utils/bestTimes');
  const gridConfig = timeBlocksUtil.buildGridConfig(event);
  const { dateBlocks, timeBlocks, numDays, numTimes } = gridConfig;
  const { participants, mergedAvailability, cellParticipants } = db.getAllAvailabilityForEvent(event.id, numDays, numTimes, true);
  // Compute totals per cell (availability counts)
  const totalsPerCell = mergedAvailability;
  // Compute best slots (top 5)
  const bestSlots = bestTimesUtil.findBestTimes({
    mergedAvailability,
    meetingDurationMinutes: event.meeting_duration_minutes || 60,
    intervalMinutes: 30,
    dateBlocks,
    timeBlocks,
    participantCount: participants.length
  });
  res.json({
    participants,
    totalsPerCell,
    bestSlots,
    cellParticipants // { ["d,t"]: { available: [names], unavailable: [names] } }
  });
});

// GET / - render home.ejs with event creation form
router.get('/', (req, res) => {
  res.render('home', { error: null });
});

// POST /events - create event and redirect
router.post('/events', (req, res) => {
  try {
    let { meeting_name, host_name, start_date, end_date, min_time, max_time, timezone } = req.body;
    meeting_name = (meeting_name || '').trim();
    host_name = (host_name || '').trim();
    // Basic validation
    if (!meeting_name || !host_name || !start_date || !end_date || !min_time || !max_time || !timezone) {
      return res.status(400).render('home', { error: 'All fields are required.' });
    }
    if (meeting_name.length < 1 || meeting_name.length > 80) {
      return res.status(400).render('home', { error: 'Meeting name must be 1-80 characters.' });
    }
    if (host_name.length < 1 || host_name.length > 40) {
      return res.status(400).render('home', { error: 'Host name must be 1-40 characters.' });
    }
    if (start_date > end_date) {
      return res.status(400).render('home', { error: 'Start date must be before or equal to end date.' });
    }
    if (min_time >= max_time) {
      return res.status(400).render('home', { error: 'Earliest time must be before latest time.' });
    }
    const event = db.createEvent({ meeting_name, host_name, start_date, end_date, min_time, max_time, timezone });
    return res.redirect(`/events/${event.id}`);
  } catch (err) {
    console.error(err);
    return res.status(500).render('home', { error: 'Server error creating event.' });
  }
});

// GET /events/:id - show event page
router.get('/events/:id', (req, res) => {
  const event = db.getEventById(req.params.id);
  if (!event) return res.status(404).send('Event not found');
  // Use timeBlocks utility
  const gridConfig = timeBlocksUtil.buildGridConfig(event);
  const { dateBlocks, timeBlocks, numDays, numTimes } = gridConfig;
  // Empty mergedAvailability matrix
  const mergedAvailability = Array.from({ length: numDays }, () => Array(numTimes).fill(0));
  // Fallbacks for old events
  const meeting_name = (event.meeting_name && event.meeting_name.trim()) || 'Untitled meeting';
  const host_name = (event.host_name && event.host_name.trim()) || 'Unknown host';
  res.render('event', {
    event,
    meeting_name,
    host_name,
    dateBlocks,
    timeBlocks,
    numDays,
    numTimes,
    mergedAvailability
  });
});

module.exports = router;